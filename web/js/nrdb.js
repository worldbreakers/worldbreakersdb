$.fn.ignore = function (sel) {
    return this.clone().find(sel).remove().end();
};

function debounce(fn, delay) {
    var timer = null;
    return function () {
        var context = this, args = arguments;
        clearTimeout(timer);
        timer = setTimeout(function () {
            fn.apply(context, args);
        }, delay);
    };
}

// Use the pack positions to order cards by number properly since the
// pack codes and pack position values aren't enough to sort packs.
function makePackPosition(pack) {
  return String(1000 + pack.position);
}

function getDisplayDescriptions(sort) {
    var dd = {
        'type': [
            [// first column
                {
                    id: 'event',
                    label: 'Event',
                    // image: '/images/types/event.png',
                }, {
                    id: 'location',
                    label: 'Location',
                    // image: '/images/types/location.png',
                }, {
                    id: 'identity',
                    label: 'Worldbreaker',
                    // image: '/images/types/worldbreaker.png',
                },
            ],
            [// second column
                {
                    id: 'follower',
                    label: 'Follower',
                    // image: '/images/types/follower.png',
                },
            ],
        ],
        'faction': [
            [
                {
                    id: 'earth',
                    label: 'Earth Guild',
                },
                {
                    id: 'moon',
                    label: 'Moon Guild',
                },
            ],
            [
                {
                    id: 'stars',
                    label: 'Stars Guild',
                },
                {
                    id: 'void',
                    label: 'Void Guild',
                },
                {
                    id: 'neutral',
                    label: 'Neutral',
                }
            ],
        ],
        'number': [],
        'title': [
            [{
                id: 'cards',
                label: 'Cards',
            }],
        ],
    };
    return dd[sort];
}


function process_deck_by_type() {

    var bytype = {};
    Identity = NRDB.data.cards.find({ indeck: { '$gt': 0 }, type_code: 'identity' }).pop();
    if (!Identity) {
        return;
    }

    NRDB.data.cards.find({ indeck: { '$gt': 0 }, type_code: { '$ne': 'identity' } }, {
        indeck: 1,
        type: 1,
        title: 1,
        faction: 1,
    }).forEach(function (card) {
        var type = card.type.code;
        var faction_code = '';

        if (card.faction.code != Identity.faction_code) {
            faction_code = card.faction.code;
        }

        if (bytype[type] == null) {
            bytype[type] = [];
        }
        bytype[type].push({
            card: card,
            qty: card.indeck,
            faction: faction_code,
        });
    });
    bytype.identity = [{
        card: Identity,
        qty: 1,
        faction: '',
    }];

    return bytype;
}

function find_identity() {
    Identity = NRDB.data.cards.find({ indeck: { '$gt': 0 }, type_code: 'identity' }).pop();
}

function update_deck(options) {
    var restrainOneColumn = false;
    if (options) {
        if (options.restrainOneColumn)
            restrainOneColumn = options.restrainOneColumn;
    }

    find_identity();
    if (!Identity)
        return;

    var displayDescription = getDisplayDescriptions(DisplaySort);
    if (displayDescription == null)
        return;

    if (DisplaySort === 'faction') {
        for (var i = 0; i < displayDescription[1].length; i++) {
            if (displayDescription[1][i].id === Identity.faction_code) {
                displayDescription[0] = displayDescription[1].splice(i, 1);
                break;
            }
        }
    }
    if (DisplaySort === 'number' && displayDescription.length === 0) {
        var rows = [];
        NRDB.data.packs.find().forEach(function (pack) {
            rows.push({ id: makePackPosition(pack), label: pack.name});
        });
        displayDescription.push(rows);
    }
    if (restrainOneColumn && displayDescription.length == 2) {
        displayDescription = [displayDescription[0].concat(displayDescription[1])];
    }

    $('#deck-content').empty();
    var cols_size = 12 / displayDescription.length;
    for (var colnum = 0; colnum < displayDescription.length; colnum++) {
        var rows = displayDescription[colnum];
        // Don't rely on the rows being put into displayDescription in order.
        // Explicitly sort them by their provided ID.
        rows.sort((a,b) => {
          if (a.id < b.id) {
            return -1;
          }
          if (a.id > b.id) {
            return 1;
          }
          return 0;
        });

        var div = $('<div>').addClass('col-sm-' + cols_size).appendTo($('#deck-content'));
        for (var rownum = 0; rownum < rows.length; rownum++) {
            var row = rows[rownum];
            var item = $('<h5> ' + row.label + ' (<span></span>)</h5>').hide();
            if (row.image) {
                $('<img>').addClass(DisplaySort + '-icon').addClass('lazyload').attr('data-src', row.image).attr('alt', row.label).prependTo(item);
            } else if (DisplaySort == "faction") {
                $('<svg class="icon-wb icon-' + row.id + '" aria-hidden="true"><use xlink:href="#icon-' + row.id + '"></use></svg><span class="icon-fallback">' + row.label + '</span>').prependTo(item);
            }
            var content = $('<div class="deck-' + row.id + '"></div>');
            div.append(item).append(content);
        }
    }

    var cabinet = {};
    var parts = Identity.title.split(/[,:] /);

    $('#identity').html('<a href="' + Routing.generate('cards_zoom', { card_code: Identity.code }) + '" data-target="#cardModal" data-remote="false" class="card" data-toggle="modal" data-index="' + Identity.code + '">' + parts[0] + ' <small>' + parts[1] + '</small></a>');
    $('#img_identity').prop('src', Identity.images.medium[0]);

    check_decksize();

    var orderBy = {};
    switch (DisplaySort) {
        case 'type':
            orderBy['type_code'] = 1;
            break;
        case 'faction':
            orderBy['faction_code'] = 1;
            break;
        case 'number':
            orderBy['code'] = 1;
            break;
        case 'title':
            orderBy['title'] = 1;
            break;
    }
    switch (DisplaySortSecondary) {
        case 'type':
            orderBy['type_code'] = 1;
            break;
        case 'faction':
            orderBy['faction_code'] = 1;
            break;
        case 'number':
            orderBy['code'] = 1;
            break;
    }
    orderBy['title'] = 1;

    var latestpack = Identity.pack;

    NRDB.data.cards.find({
        indeck: { '$gt': 0 },
        type_code: { '$ne': 'identity' },
    }, { '$orderBy': orderBy }).forEach(function (card) {
        if (latestpack.position < card.pack.position) {
            latestpack = card.pack;
        }

        var criteria = null;

        if (DisplaySort === 'type') {
            criteria = card.type_code, keywords = card.keywords ? card.keywords.toLowerCase().split(" - ") : [];
        } else if (DisplaySort === 'faction') {
            criteria = card.faction_code;
        } else if (DisplaySort === 'number') {
            criteria = makePackPosition(card.pack);
        } else if (DisplaySort === 'title') {
            criteria = 'cards';
        }

        if (DisplaySort === 'number' || DisplaySortSecondary === 'number') {
            var number_of_sets = Math.ceil(card.indeck / card.quantity);
            var alert_number_of_sets = number_of_sets > 1 ? '<small class="text-warning">' + number_of_sets + ' sets needed</small> ' : '';
        }

        // TODO: This is only correct for constructed and 2p draft. In
        // 4p draft up to 2 copies of a card may exist in a deck.
        var cardIndeck = card.indeck > 1 ? card.indeck  + 'x ' : '';

        var cardTitle = card.title + (card.signature && card.type_code !== 'identity' ? '<span class="card-is-signature glyphicon glyphicon-star" title="Signature Card"></span>' : '');

        var standingReq = [];
        if (card.standing !== null) {
            Object.entries(card.standing).forEach(function (standing) {
                standingReq.push('<span class="decklist-standing-req">');
                for (var j = 0; j < standing[1]; j++) {
                    standingReq.push('<svg class="icon-wb icon-' + standing[0] +
                                     '" aria-hidden="true"><use xlink:href="#icon-' + standing[0] +
                                     '"></use></svg><span class="icon-fallback">' + standing[0] + '</span>');
                }
                standingReq.push('</span>');
            });
        }

        var item = $('<div>' + cardIndeck + '<a href="' + Routing.generate('cards_zoom', { card_code: card.code }) + '" class="card" data-toggle="modal" data-remote="false" data-target="#cardModal" data-index="' + card.code + '">' + cardTitle + standingReq.join('') + '</a>' + '</div>');
        item.appendTo($('#deck-content .deck-' + criteria));

        cabinet[criteria] |= 0;
        cabinet[criteria] = cabinet[criteria] + card.indeck;
        $('#deck-content .deck-' + criteria).prev().show().find('span:last').html(cabinet[criteria]);

    });
    $('#latestpack').html('Cards up to <i>' + latestpack.name + '</i>');
    check_deck_limit();

    update_charts();
}


var charts = {};

function create_charts() {
    var charts = {};

    if (document.getElementById('costChart')) {
        charts.cost = make_stacked_bar_chart(
            document.getElementById('costChart'),
            { labels: [], datasets: [], }
        );
    }

    if (document.getElementById('cardCountChart')) {
        charts.cardCount = makeCardCountGraph(document.getElementById('cardCountChart'));
    }

    return charts;
}

function update_charts() {
    if (!('charts' in NRDB)) {
        NRDB.charts = create_charts();
    }

    if (NRDB.charts.cost) {
        var costData = repartitionByCost();
        NRDB.charts.cost.data = costData;
        NRDB.charts.cost.update();
    }

    if (NRDB.charts.cardCount) {
        var cardCountData = cardCountGraphData();
        NRDB.charts.cardCount.data = cardCountData;
        NRDB.charts.cardCount.update();
    }
}

function check_decksize() {
    DeckSize = _.reduce(
        NRDB.data.cards.find({ indeck: { '$gt': 0 }, type_code: { '$ne': 'identity' } }),
        function (acc, card) {
            return acc + card.indeck;
        },
        0);
    $('#cardcount').html(DeckSize + " cards")[DeckSize !== 30 ? 'addClass' : 'removeClass']("text-danger");
}

function count_card_copies(cards) {
    var count = 0;
    for (var i = 0; i < cards.length; i++) {
        count += cards[i].indeck;
    }
    return count;
}

function check_deck_limit() {
    var nb_violations = 0;
    NRDB.data.cards.find({ indeck: { '$gt': 0 } }).forEach(function (card) {
        // TODO: hard coded limit
        if(1 < card.indeck) {
            nb_violations++;
        }
    });

    if(nb_violations > 0) {
        $('#limited').text('Too many copies of a limited card').show();
    } else {
        $('#limited').text('').hide();
    }
}

function convert_to_recent(update) {
    // This map is all old 'printings' of cards to their latest reprinted versions
    // in System Gateway and System Update 2021.
    var old2new = {
    }
    var cards_used = Object.keys(Deck);
    var replaced = 0;
    cards_used.forEach(function(oldCode) {
        var newCode = old2new[oldCode];

        if (newCode) {
            ++replaced;
            if (update) {
                var quantity = Deck[oldCode];
                NRDB.data.cards.updateById(newCode, {
                    indeck : quantity
                });
                NRDB.data.cards.updateById(oldCode, {
                    indeck : 0
                });
                Deck_changed_since_last_autosave = true;
            }
        }
    });

    if (update) {
        update_deck();
    } else {
        return replaced;
    }
}

$(function () {

    $('[data-toggle="tooltip"]').tooltip();

    $('body').on({
        click: function (event) {
            var element = $(this);
            if (event.shiftKey || event.altKey || event.ctrlKey || event.metaKey) {
                event.stopPropagation();
                return;
            }
            if (NRDB.card_modal)
                NRDB.card_modal.display_modal(event, element);
        },
    }, '.card');
});

function toggle_table(event) {
    event.preventDefault();
    var toggle = $(this);
    var table = toggle.closest('table');
    var tbody = table.find('tbody');
    tbody.toggle(400, function () {
        toggle.text(tbody.is(':visible') ? 'hide' : 'show');
    });
}

var FactionColors = {
    "earth": "#FF4500",
    "moon": "#4169E1",
    "neutral": "#32CD32",
    "stars": "#708090",
    "void": "#8A2BE2",
};

function build_bbcode(deck) {
    var deck = process_deck_by_type(deck || SelectedDeck);
    var lines = [];
    lines.push("[b]" + SelectedDeck.name + "[/b]");
    lines.push("");
    lines.push('[url=' + NRDB.worldbreakersdb_url + '/' + NRDB.locale + '/card/'
        + Identity.code
        + ']'
        + Identity.title
        + '[/url] ('
        + Identity.pack.name
        + ")");

    $('#deck-content > div > h5:visible, #deck-content > div > div > div').each(function (i, line) {
        switch ($(line).prop("tagName")) {
            case "H5":
                lines.push("");
                lines.push("[b]" + $(line).text().trim() + "[/b]");
                break;
            default:
                var qty = $(line).ignore("a, span, small").text().trim().replace(/x.*/, "x");
                var inf = $(line).find("span").text().trim();
                var card = NRDB.data.cards.findById($(line).find('a.card').data('index'));
                lines.push(qty + ' [url=' + NRDB.worldbreakersdb_url + '/' + NRDB.locale + '/card/'
                    + card.code
                    + ']'
                    + card.title
                    + '[/url] [i]('
                    + card.pack.name
                    + ")[/i] "
                    + (inf ? '[color=' + FactionColors[card.faction_code] + ']' + inf + '[/color]' : '')
                );
        }
    });

    lines.push($('#cardcount').text());
    lines.push($('#latestpack').text());
    lines.push("");
    if (typeof Decklist != "undefined" && Decklist != null) {
        lines.push("Decklist [url=" + location.href + "]published on WorldbreakersDB[/url].");
    } else {
        lines.push("Deck built on [url=" + NRDB.worldbreakersdb_url + "]WorldbreakersDB[/url].");
    }
    return lines;
}

function export_bbcode() {
    $('#export-deck').html(build_bbcode().join("\n"));
    $('#exportModal').modal('show');
}

function build_markdown(deck) {
    var deck = process_deck_by_type(deck || SelectedDeck);
    var lines = [];
    lines.push("## " + SelectedDeck.name);
    lines.push("");
    lines.push('['
        + Identity.title
        + '](' + NRDB.worldbreakersdb_url + '/' + NRDB.locale + '/card/'
        + Identity.code
        + ') _('
        + Identity.pack.name
        + ")_");

    $('#deck-content > div > h5:visible, #deck-content > div > div > div').each(function (i, line) {
        switch ($(line).prop("tagName")) {
            case "H5":
                lines.push("");
                lines.push("###" + $(line).text());
                break;
            default:
                var qty = $(line).ignore("a, span, small").text().trim().replace(/x.*/, "x");
                var inf = $(line).find("span").text().trim();
                var card = NRDB.data.cards.findById($(line).find('a.card').data('index'));
                lines.push('* ' + qty + ' ['
                    + card.title
                    + '](' + NRDB.worldbreakersdb_url + '/' + NRDB.locale + '/card/'
                    + card.code
                    + ') _('
                    + card.pack.name
                    + ")_ "
                    + inf
                );
        }
    });

    lines.push("");
    lines.push($('#cardcount').text() + "  ");
    lines.push($('#latestpack').text() + "  ");
    lines.push("");
    if (typeof Decklist != "undefined" && Decklist != null) {
        lines.push("Decklist [published on WorldbreakersDB](" + location.href + ").");
    } else {
        lines.push("Deck built on [WorldbreakersDB](" + NRDB.worldbreakersdb_url + ").");
    }
    return lines;
}

function export_markdown() {
    $('#export-deck').html(build_markdown().join("\n"));
    $('#exportModal').modal('show');
}

function build_plaintext(deck) {
    var deck = process_deck_by_type(deck || SelectedDeck);
    var lines = [];
    lines.push(SelectedDeck.name);
    lines.push("");
    lines.push(Identity.title);

    $('#deck-content > div > h5:visible, #deck-content > div > div > div').each(function (i, line) {
        switch ($(line).prop("tagName")) {
            case "H5":
                lines.push("");
                lines.push($(line).text().trim());
                break;
            default:
                lines.push($(line).text().trim());
        }
    });

    lines.push("");
    lines.push($('#cardcount').text());
    lines.push($('#latestpack').text());
    lines.push("");
    if (typeof Decklist != "undefined" && Decklist != null) {
        lines.push("Decklist published on " + NRDB.worldbreakersdb_url + ".");
    } else {
        lines.push("Deck built on " + NRDB.worldbreakersdb_url + ".");
    }
    return lines;
}

function export_plaintext() {
    $('#export-deck').html(build_plaintext().join("\n"));
    $('#exportModal').modal('show');
}

function build_tts(deck) {
    var deck = process_deck_by_type(deck || SelectedDeck);
    delete deck.identity;
    var lines = []
    lines = lines.concat.apply(lines, Object.values(deck)).map(function (item) {
        return item.card.code;
    });
    lines.sort();

    var CARD_WIDTH = 744;
    var CARD_HEIGHT = 1039;

    var $canvas = $('<canvas></canvas>').appendTo(document.body);
    $canvas.attr({ width: 10 * CARD_WIDTH, height: 3 * CARD_HEIGHT }).css({ display: 'none' });
    var canvas = $canvas.get(0);
    var ctx = canvas.getContext('2d');

    var imagesReady = lines.length;
    var decImages = function () {
        imagesReady--;
    }

    var images = lines.map(function (code, index) {
        return new Promise(function (resolve, reject) {
            var img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = function () {
                ctx.drawImage(img, CARD_WIDTH * (index % 10), CARD_HEIGHT * Math.floor(index / 10));
                resolve(img);
            };
            img.src = NRDB.card_image_url + '/large/' + code + '.jpg';
        });
    });

    return Promise.all(images)
        .then(function (images) {

            var link = document.createElement("a");
            link.innerText = "Download deck";
            link.download = "deck.jpeg";

            return new Promise(function (resolve) {
                canvas.toBlob(function (blob) {
                    link.href = URL.createObjectURL(blob);
                    resolve(link);
                }, 'image/png');
            });
        });
}

function download_tts(deck) {
    var content = $('#export-deck').parent().html();

    // show loading message
    var $modalBody = $('#export-deck').parent();
    $modalBody.html("<p>Loading …</p>");
    $('#exportModal').modal('show');

    build_tts(deck).then((link) => {
        $modalBody.html(link);
        $(link).on("click", function () {
            $('#exportModal').modal('hide');
            $modalBody.html(content);
        });
    });
}

function repartitionByCost()
{
    var costData = {};

    var minCost = 0;
    var maxCost = 0;
    var cards = NRDB.data.cards.find({ indeck: { '$gt': 0 }, type_code: { '$ne': 'identity' } });

    cards.forEach(function (card) {
        if (card.cost > maxCost) {
            maxCost = card.cost;
        }
    });

    cards.forEach(function (card) {
        if (card.cost != null) {
            if (!(card.type.code in costData)) {
                costData[card.type.code] = new Array(maxCost - minCost + 1).fill(0);
            }
            costData[card.type.code][card.cost] += card.indeck;
        }
    });

    var types = NRDB.data.types.find({ code: { '$ne': 'identity' } });
    var types_colors = {
        event: 'red',
        follower: 'blue',
        location: 'green',
    };

    var labels = [];
    for (var i = minCost; i <= maxCost; ++i) {
        labels.push(i);
    }

    var data = {
        labels: labels,
        datasets: types.map(function (type) {
            return {
                label: type.name,
                // TODO: Set colors in JSON
                backgroundColor: types_colors[type.code],
                data: costData[type.code],
            };
        })
    };

    return data;
}

function make_stacked_bar_chart(element, data) {
    var config = {
        type: 'bar',
        data: data,
        options: {
            aspectRatio: 1,
            plugins: {
                legend: {
                    align: 'start',
                    position: 'bottom',
                },
            },
            responsive: true,
            scales: {
                x: {
                    stacked: true,
                },
                y: {
                    stacked: true
                }
            }
        }
    };

    return new Chart(element, config);
}


var COLORS = {
    earth: ["#C98161","#D8A48D","#E7C8BA"],
    moon: ["#476A89","#557FA4","#6F94B4"],
    stars: ["#ABA58B","#C5C1AF","#DFDDD3"],
    void: ["#48375B","#56426D","#654D7F"],
    neutral: ["#AAAAAA", "#AAAAAA", "#AAAAAA"],
};

function cardCountGraphData() {
    var cards = NRDB.data.cards.find({
        indeck: { '$gt': 0 },
        type_code: { '$ne': 'identity' }
    });

    var guilds = NRDB.data.factions.find({ code: { '$ne': 'neutral' }}, { $orderBy: { name: 1 } });
    guilds.push(NRDB.data.factions.find({ code: { '$eq': 'neutral' }})[0]);
    var guildCodes = guilds.map(function (guild) { return guild.code; })
    var labels = guilds.map(function (guild) { return guild.name; });

    var data = [];
    for (var i = 0; i < 3; i++) {
        data.push(new Array(guilds.length).fill(0));
    }

    cards.forEach(function (card) {
        if (card.standing_req > 0) {
        Object.entries(card.standing).forEach(function (entry) {
            var guildCode = entry[0];
            var standingReq = entry[1];
            var guildIndex = guildCodes.indexOf(guildCode);
            data[standingReq - 1][guildIndex]++;
        });
        } else {
            data[0][guildCodes.length - 1]++;
        }
    });

    var datasets = [
        {
            label: 'One standing of this guild',
            data: data[0],
            backgroundColor: createBackgroundColors(2),
        },
        {
            label: 'Two standing of this guild',
            data: data[1],
            backgroundColor: createBackgroundColors(1),
        },
        {
            label: 'Three standing of this guild',
            data: data[2],
            backgroundColor: createBackgroundColors(0),
        },
    ];

    return {
        labels: labels,
        datasets: datasets
    };

    function createBackgroundColors(index) {
        return guildCodes.map(function (guild) {
            return COLORS[guild][index];
        });
    }
 }

function makeCardCountGraph(element) {
    const config = {
        type: 'bar',
        data: { labels: [], datasets: [] },
        options: {
            aspectRatio: 1,
            plugins: {
                legend: {
                    display: false,
                },
            },
            responsive: true,
            interaction: {
                intersect: false,
            },
            scales: {
                x: {
                    stacked: true,
                },
                y: {
                    stacked: true
                }
            }
        }
    };

    return new Chart(element, config);
}

/* my version of button.js, overriding twitter's */

(function ($) {
    "use strict";

    // BUTTON PUBLIC CLASS DEFINITION
    // ==============================

    var Button = function (element, options) {
        this.$element = $(element);
        this.options = $.extend({}, Button.DEFAULTS, options);
        this.isLoading = false;
    };

    Button.DEFAULTS = {
        loadingText: 'loading...',
    };

    Button.prototype.setState = function (state) {
        var d = 'disabled';
        var $el = this.$element;
        var val = $el.is('input') ? 'val' : 'html';
        var data = $el.data();

        state = state + 'Text';

        if (!data.resetText)
            $el.data('resetText', $el[val]());

        $el[val](data[state] || this.options[state]);

        // push to event loop to allow forms to submit
        setTimeout($.proxy(function () {
            if (state == 'loadingText') {
                this.isLoading = true;
                $el.addClass(d).attr(d, d);
            } else if (this.isLoading) {
                this.isLoading = false;
                $el.removeClass(d).removeAttr(d);
            }
        }, this), 0);
    };

    Button.prototype.toggle = function () {
        var changed = true;
        var $parent = this.$element.closest('[data-toggle="buttons"]');

        if ($parent.length) {
            var $input = this.$element.find('input');
            if ($input.prop('type') == 'radio') {
                if ($input.prop('checked') && this.$element.hasClass('active'))
                    changed = false;
                else
                    $parent.find('.active').removeClass('active');
            }
            if (changed)
                $input.prop('checked', !this.$element.hasClass('active')).trigger('change');
        }

        if (changed)
            this.$element.toggleClass('active');
    };

    Button.prototype.on = function () {
        var changed = true;
        var $parent = this.$element.closest('[data-toggle="buttons"]');

        if ($parent.length) {
            var $input = this.$element.find('input');
            if ($input.prop('type') == 'radio' || invertOthers) {
                if ($input.prop('checked') && this.$element.hasClass('active'))
                    changed = false;
                else
                    $parent.find('.active').removeClass('active');
            }
            if (changed)
                $input.prop('checked', !this.$element.hasClass('active')).trigger('change');
        }

        if (changed)
            this.$element.addClass('active');
    };

    Button.prototype.off = function () {
        var changed = true;
        var $parent = this.$element.closest('[data-toggle="buttons"]');

        if ($parent.length) {
            var $input = this.$element.find('input');
            if ($input.prop('type') == 'radio' || invertOthers) {
                if ($input.prop('checked') && this.$element.hasClass('active'))
                    changed = false;
                else
                    $parent.find('.active').removeClass('active');
            }
            if (changed)
                $input.prop('checked', !this.$element.hasClass('active')).trigger('change');
        }

        if (changed)
            this.$element.removeClass('active');
    };


    // BUTTON PLUGIN DEFINITION
    // ========================

    var old = $.fn.button;

    $.fn.button = function (option, invertOthers) {
        return this.each(function () {
            var $this = $(this);
            var data = $this.data('bs.button');
            var options = typeof option == 'object' && option;

            if (!data)
                $this.data('bs.button', (data = new Button(this, options)));

            switch (option) {
                case 'toggle':
                    data.toggle();
                    break;
                case 'off':
                    data.off(invertOthers);
                    break;
                case 'on':
                    data.on(invertOthers);
                    break;
                default:
                    data.setState(option);
                    break;
            }
        });
    };

    $.fn.button.Constructor = Button;


    // BUTTON NO CONFLICT
    // ==================

    $.fn.button.noConflict = function () {
        $.fn.button = old;
        return this;
    };

})(window.jQuery);
