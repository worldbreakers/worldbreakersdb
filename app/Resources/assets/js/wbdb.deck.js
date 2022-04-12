/* global _, $, WBDB, Routing */
export const deck = {
  update(options) {
    var restrainOneColumn = false;
    if (options) {
      if (options.restrainOneColumn)
        restrainOneColumn = options.restrainOneColumn;
    }

    WBDB.find_identity();
    if (!WBDB.Identity) return;

    var displayDescription = getDisplayDescriptions(WBDB.DisplaySort);
    if (displayDescription == null) return;

    if (WBDB.DisplaySort === "faction") {
      for (var i = 0; i < displayDescription[1].length; i++) {
        if (displayDescription[1][i].id === WBDB.Identity.faction_code) {
          displayDescription[0] = displayDescription[1].splice(i, 1);
          break;
        }
      }
    }
    if (WBDB.DisplaySort === "number" && displayDescription.length === 0) {
      var packs = [];
      WBDB.data.packs.find().forEach(function (pack) {
        packs.push({ id: makePackPosition(pack), label: pack.name });
      });
      displayDescription.push(packs);
    }
    if (restrainOneColumn && displayDescription.length == 2) {
      displayDescription = [
        displayDescription[0].concat(displayDescription[1]),
      ];
    }

    $("#deck-content").empty();
    var cols_size = 12 / displayDescription.length;
    for (var colnum = 0; colnum < displayDescription.length; colnum++) {
      var rows = displayDescription[colnum];
      // Don't rely on the rows being put into displayDescription in order.
      // Explicitly sort them by their provided ID.
      rows.sort((a, b) => {
        if (a.id < b.id) {
          return -1;
        }
        if (a.id > b.id) {
          return 1;
        }
        return 0;
      });

      var div = $("<div>")
        .addClass("col-sm-" + cols_size)
        .appendTo($("#deck-content"));
      for (var rownum = 0; rownum < rows.length; rownum++) {
        var row = rows[rownum];
        var item = $("<h5> " + row.label + " (<span></span>)</h5>").hide();
        if (row.image) {
          $("<img>")
            .addClass(WBDB.DisplaySort + "-icon")
            .addClass("lazyload")
            .attr("data-src", row.image)
            .attr("alt", row.label)
            .prependTo(item);
        } else if (WBDB.DisplaySort == "faction") {
          $(
            '<svg class="icon-wb icon-' +
              row.id +
              '" aria-hidden="true"><use xlink:href="#icon-' +
              row.id +
              '"></use></svg><span class="icon-fallback">' +
              row.label +
              "</span>"
          ).prependTo(item);
        }
        var content = $('<div class="deck-' + row.id + '"></div>');
        div.append(item).append(content);
      }
    }

    var cabinet = {};
    var parts = WBDB.Identity.title.split(/[,:] /);

    $("#identity").html(
      '<a href="' +
        Routing.generate("cards_zoom", { card_code: WBDB.Identity.code }) +
        '" data-target="#cardModal" data-remote="false" class="card" data-toggle="modal" data-index="' +
        WBDB.Identity.code +
        '">' +
        parts[0] +
        " <small>" +
        parts[1] +
        "</small></a>"
    );
    $("#img_identity").prop("src", WBDB.Identity.images.medium[0]);

    check_decksize();

    var orderBy = {};
    switch (WBDB.DisplaySort) {
      case "type":
        orderBy["type_code"] = 1;
        break;
      case "faction":
        orderBy["faction_code"] = 1;
        break;
      case "number":
        orderBy["code"] = 1;
        break;
      case "title":
        orderBy["title"] = 1;
        break;
    }
    switch (WBDB.DisplaySortSecondary) {
      case "type":
        orderBy["type_code"] = 1;
        break;
      case "faction":
        orderBy["faction_code"] = 1;
        break;
      case "number":
        orderBy["code"] = 1;
        break;
    }
    orderBy["title"] = 1;

    var latestpack = WBDB.Identity.pack;

    WBDB.data.cards
      .find(
        {
          indeck: { $gt: 0 },
          type_code: { $ne: "identity" },
        },
        { $orderBy: orderBy }
      )
      .forEach(function (card) {
        if (latestpack.position < card.pack.position) {
          latestpack = card.pack;
        }

        var criteria = null;

        if (WBDB.DisplaySort === "type") {
          criteria = card.type_code;
        } else if (WBDB.DisplaySort === "faction") {
          criteria = card.faction_code;
        } else if (WBDB.DisplaySort === "number") {
          criteria = makePackPosition(card.pack);
        } else if (WBDB.DisplaySort === "title") {
          criteria = "cards";
        }

        // TODO: This is only correct for constructed and 2p draft. In
        // 4p draft up to 2 copies of a card may exist in a deck.
        var cardIndeck = card.indeck > 1 ? card.indeck + "x " : "";

        var cardTitle =
          card.title +
          (card.signature && card.type_code !== "identity"
            ? '<span class="card-is-signature glyphicon glyphicon-star" title="Signature Card"></span>'
            : "");

        var standingReq = [];
        if (card.standing !== null) {
          Object.entries(card.standing).forEach(function (standing) {
            standingReq.push('<span class="decklist-standing-req">');
            for (var j = 0; j < standing[1]; j++) {
              standingReq.push(
                '<svg class="icon-wb icon-' +
                  standing[0] +
                  '" aria-hidden="true"><use xlink:href="#icon-' +
                  standing[0] +
                  '"></use></svg><span class="icon-fallback">' +
                  standing[0] +
                  "</span>"
              );
            }
            standingReq.push("</span>");
          });
        }

        var item = $(
          "<div>" +
            cardIndeck +
            '<a href="' +
            Routing.generate("cards_zoom", { card_code: card.code }) +
            '" class="card" data-toggle="modal" data-remote="false" data-target="#cardModal" data-index="' +
            card.code +
            '">' +
            cardTitle +
            standingReq.join("") +
            "</a>" +
            "</div>"
        );
        item.appendTo($("#deck-content .deck-" + criteria));

        cabinet[criteria] |= 0;
        cabinet[criteria] = cabinet[criteria] + card.indeck;
        $("#deck-content .deck-" + criteria)
          .prev()
          .show()
          .find("span:last")
          .html(cabinet[criteria]);
      });
    $("#latestpack").html("Cards up to <i>" + latestpack.name + "</i>");
    check_deck_limit();

    WBDB.charts.update();
  },
};

// Use the pack positions to order cards by number properly since the
// pack codes and pack position values aren't enough to sort packs.
function makePackPosition(pack) {
  return String(1000 + pack.position);
}

function getDisplayDescriptions(sort) {
  var dd = {
    type: [
      [
        // first column
        {
          id: "event",
          label: "Event",
          // image: '/images/types/event.png',
        },
        {
          id: "location",
          label: "Location",
          // image: '/images/types/location.png',
        },
        {
          id: "identity",
          label: "Worldbreaker",
          // image: '/images/types/worldbreaker.png',
        },
      ],
      [
        // second column
        {
          id: "follower",
          label: "Follower",
          // image: '/images/types/follower.png',
        },
      ],
    ],
    faction: [
      [
        {
          id: "earth",
          label: "Earth Guild",
        },
        {
          id: "moon",
          label: "Moon Guild",
        },
      ],
      [
        {
          id: "stars",
          label: "Stars Guild",
        },
        {
          id: "void",
          label: "Void Guild",
        },
        {
          id: "neutral",
          label: "Neutral",
        },
      ],
    ],
    number: [],
    title: [
      [
        {
          id: "cards",
          label: "Cards",
        },
      ],
    ],
  };
  return dd[sort];
}

function check_decksize() {
  WBDB.DeckSize = _.reduce(
    WBDB.data.cards.find({
      indeck: { $gt: 0 },
      type_code: { $ne: "identity" },
    }),
    function (acc, card) {
      return acc + card.indeck;
    },
    0
  );
  const content = WBDB.DeckSize + " cards";
  const method = WBDB.DeckSize !== 30 ? "addClass" : "removeClass";
  $("#cardcount").html(content)[method]("text-danger");
}

function check_deck_limit() {
  var nb_violations = 0;
  WBDB.data.cards.find({ indeck: { $gt: 0 } }).forEach(function (card) {
    // TODO: hard coded limit
    if (1 < card.indeck) {
      nb_violations++;
    }
  });

  if (nb_violations > 0) {
    $("#limited").text("Too many copies of a limited card").show();
  } else {
    $("#limited").text("").hide();
  }
}
