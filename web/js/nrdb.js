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

// Use the cycle and pack positions to order cards by number properly since the
// pack codes and pack position values aren't enough to sort packs.
function makeCycleAndPackPosition(pack) {
  return String(1000 + pack.cycle.position) + String(1000 + pack.position);
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
                    id: 'follower',
                    label: 'Follower',
                    // image: '/images/types/follower.png',
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
            ],
        ],
        'faction': [
            [],
            [{
                id: 'earth',
                label: 'Earth Guild',
            }, {
                id: 'moon',
                label: 'Moon Guild',
            }, {
                id: 'stars',
                label: 'Stars Guild',
            }, {
                id: 'void',
                label: 'Void Guild',
            }, {
                id: 'neutral',
                label: 'Neutral',
            }],
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

function get_mwl_modified_card(card) {
    if (MWL && MWL.cards[card.code]) {
        return Object.assign(card, MWL.cards[card.code]);
    }

    return card;
}

function find_identity() {
    Identity = NRDB.data.cards.find({ indeck: { '$gt': 0 }, type_code: 'identity' }).pop();
}

/**
 * Returns a banned, restricted, or rotated icon for the supplied card and selected MWL.
 * @param  card
 * @return string
 */
function get_card_legality_icons(card) {
    var mwlCard = get_mwl_modified_card(card);

    var result = [];

    function add_icon(icon, description) {
        result.push('<span title="' + description + '">' + icon + '</span>');
    }

    // Check MWL
    if (mwlCard.is_restricted) {
        add_icon('🦄', 'Restricted card');
    } else if (mwlCard.deck_limit == 0) {
        // Prohibited or banned cards are identified by having a deck_limit of 0.
        add_icon('🚫', 'Banned card');
    }

    // Check if set has rotated
    if (NRDB.settings && NRDB.settings.getItem('check-rotation')) {
        var rotated_cycles = _.map(NRDB.data.cycles.find( { "rotated": true } ), 'code');
        var cycle = card.pack.cycle_code;
        if (rotated_cycles.indexOf(cycle) !== -1) {
            add_icon('🔄', 'Rotated card');
        }
    }

    if (result.length) {
        return ' <span class="builder-legality-indicators">' + result.join(' ') + '</span> ';
    }
    return '';
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
            rows.push({ id: makeCycleAndPackPosition(pack), label: pack.name});
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
                $('<span class="icon icon-' + row.id + ' ' + row.id + '"></span>').prependTo(item);
            }
            var content = $('<div class="deck-' + row.id + '"></div>');
            div.append(item).append(content);
        }
    }

    var cabinet = {};
    var parts = Identity.title.split(/[,:] /);

    $('#identity').html('<a href="' + Routing.generate('cards_zoom', { card_code: Identity.code }) + '" data-target="#cardModal" data-remote="false" class="card" data-toggle="modal" data-index="' + Identity.code + '">' + parts[0] + ' <small>' + parts[1] + '</small></a>' + get_card_legality_icons(Identity));
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
        if (latestpack.cycle.position < card.pack.cycle.position
            || (latestpack.cycle.position == card.pack.cycle.position && latestpack.position < card.pack.position)) {
            latestpack = card.pack;
        }

        var criteria = null;

        if (DisplaySort === 'type') {
            criteria = card.type_code, keywords = card.keywords ? card.keywords.toLowerCase().split(" - ") : [];
        } else if (DisplaySort === 'faction') {
            criteria = card.faction_code;
        } else if (DisplaySort === 'number') {
            criteria = makeCycleAndPackPosition(card.pack);
        } else if (DisplaySort === 'title') {
            criteria = 'cards';
        }

        if (DisplaySort === 'number' || DisplaySortSecondary === 'number') {
            var number_of_sets = Math.ceil(card.indeck / card.quantity);
            var alert_number_of_sets = number_of_sets > 1 ? '<small class="text-warning">' + number_of_sets + ' sets needed</small> ' : '';
        }

        var cardTitle = card.title + (card.signature && card.type_code !== 'identity' ? '<span class="card-is-signature glyphicon glyphicon-star" title="Signature Card"></span>' : '');
        var item = $('<div>' + card.indeck + 'x <a href="' + Routing.generate('cards_zoom', { card_code: card.code }) + '" class="card" data-toggle="modal" data-remote="false" data-target="#cardModal" data-index="' + card.code + '">' + cardTitle + '</a>' + get_card_legality_icons(card) + '</div>');
        item.appendTo($('#deck-content .deck-' + criteria));

        cabinet[criteria] |= 0;
        cabinet[criteria] = cabinet[criteria] + card.indeck;
        $('#deck-content .deck-' + criteria).prev().show().find('span:last').html(cabinet[criteria]);

    });
    $('#latestpack').html('Cards up to <i>' + latestpack.name + '</i>');
    check_restricted();
    check_deck_limit();
    if (NRDB.settings && NRDB.settings.getItem('check-rotation')) {
        check_rotation();
    } else {
        $('#rotated').hide();
    }
    if ($('#costChart .highcharts-container').length)
        setTimeout(make_cost_graph, 100);
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

function check_restricted() {
    var nb_restricted = 0;
    NRDB.data.cards.find({ indeck: { '$gt': 0 } }).forEach(function (card) {
        var modified_card = get_mwl_modified_card(card);
        if(modified_card.is_restricted) {
            nb_restricted++;
        }
    });

    if(nb_restricted > 1) {
        $('#restricted').text('More than 1 restricted card included').show();
    } else {
        $('#restricted').text('').hide();
    }
}

function check_deck_limit() {
    var nb_violations = 0;
    NRDB.data.cards.find({ indeck: { '$gt': 0 } }).forEach(function (card) {
        var modified_card = get_mwl_modified_card(card);
        if(modified_card.deck_limit < card.indeck) {
            nb_violations++;
        }
    });

    if(nb_violations > 0) {
        $('#limited').text('Too many copies of a limited card').show();
    } else {
        $('#limited').text('').hide();
    }
}

function check_rotation() {
    var rotated_cycles = _.map(NRDB.data.cycles.find( { "rotated": true } ), 'code');
    var used_cycles = _.map(NRDB.data.cards.find({ indeck: { '$gt': 0 } }), 'pack.cycle_code');

    var intersect = rotated_cycles.filter(function(n) {
        return used_cycles.indexOf(n) !== -1;
    });

    if (intersect.length > 0) {
		let num_old_with_new_versions = convert_to_recent(false /* update */);
		if (num_old_with_new_versions > 0) {
           $('#rotated').html('Deck contains ' + num_old_with_new_versions + ' rotated cards with new versions - <a href="javascript:convert_to_recent(true /*update*/)" title="Replace ' + num_old_with_new_versions + ' rotated cards with their post-rotation counterparts.">click to update</a>').show();
		} else {
           $('#rotated').html('Deck contains rotated cards with no post-rotation versions.').show();
		}
    } else {
        $('#rotated').text('').hide();
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
        $('#rotated').html("Replaced " + replaced + " card(s) with their post-rotation counterparts.").show();
    } else {
        return replaced;
    }
}

$(function () {

    $('[data-toggle="tooltip"]').tooltip();

    $.each(['table-graph-costs', 'table-graph-strengths', 'table-predecessor', 'table-parent', 'table-successor', 'table-suggestions'], function (i, table_id) {
        var table = $('#' + table_id);
        if (!table.length)
            return;
        var head = table.find('thead tr th');
        var toggle = $('<a href="#" class="pull-right small">hide</a>');
        toggle.on({ click: toggle_table });
        head.prepend(toggle);
    });

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

    var $canvas = $('<canvas></canvas>').appendTo(document.body);
    $canvas.attr({ width: 10 * 300, height: 3 * 419 })//.css({ display: 'none' });
    var canvas = $canvas.get(0);
    var ctx = canvas.getContext('2d');

    var imagesReady = lines.length;
    var decImages = function () {
        imagesReady--;
    }

    var images = lines.map(function (code, index) {
        return new Promise(function (resolve, reject) {
            var img = new Image();
            img.crossOrigin = "Anonymous";
            img.onload = function () {
                ctx.drawImage(img, 300 * (index % 10), 419 * Math.floor(index / 10));
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

function make_cost_graph() {
    var costs = [];

    NRDB.data.cards.find({ indeck: { '$gt': 0 }, type_code: { '$ne': 'identity' } }).forEach(function (card) {
        if (card.cost != null) {
            if (costs[card.cost] == null)
                costs[card.cost] = [];
            if (costs[card.cost][card.type.name] == null)
                costs[card.cost][card.type.name] = 0;
            costs[card.cost][card.type.name] += card.indeck;
        }
    });

    // costChart
    var cost_series = [
        { name: 'Event', data: [] },
        { name: 'Follower', data: [] },
        { name: 'Location', data: [] },
    ];
    var xAxis = [];

    for (var j = 0; j < costs.length; j++) {
        xAxis.push(j);
        var data = costs[j];
        for (var i = 0; i < cost_series.length; i++) {
            var type_name = cost_series[i].name;
            cost_series[i].data.push((data && data[type_name]) ? data[type_name] : 0);
        }
    }

    $('#costChart').highcharts({
        colors: ['#FFE66F', '#B22A95', '#FF55DA', '#30CCC8'],
        title: {
            text: null,
        },
        credits: {
            enabled: false,
        },
        chart: {
            type: 'column',
            animation: false,
        },
        xAxis: {
            categories: xAxis,
        },
        yAxis: {
            title: {
                text: null,
            },
            allowDecimals: false,
            minTickInterval: 1,
            minorTickInterval: 1,
            endOnTick: false,
        },
        plotOptions: {
            column: {
                stacking: 'normal',
            },
            series: {
                animation: false,
            },
        },
        series: cost_series,
    });

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
