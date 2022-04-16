/* global $, WBDB */
import { data as Data } from "./wbdb.data.js";

export function bbcode(deck) {
  $("#export-deck").html(build_bbcode(deck).join("\n"));
  $("#exportModal").modal("show");
}

export function markdown(deck) {
  $("#export-deck").html(build_markdown(deck).join("\n"));
  $("#exportModal").modal("show");
}

export function plaintext(deck) {
  $("#export-deck").html(build_plaintext(deck).join("\n"));
  $("#exportModal").modal("show");
}

export function tts(deck) {
  var content = $("#export-deck").parent().html();

  // show loading message
  var $modalBody = $("#export-deck").parent();
  $modalBody.html("<p>Loading …</p>");
  $("#exportModal").modal("show");

  build_tts(deck).then((link) => {
    $modalBody.html(link);
    $(link).on("click", function () {
      $("#exportModal").modal("hide");
      $modalBody.html(content);
    });
  });
}

var FactionColors = {
  earth: "#FF4500",
  moon: "#4169E1",
  neutral: "#32CD32",
  stars: "#708090",
  void: "#8A2BE2",
};

function build_bbcode(deck) {
  process_deck_by_type(deck || WBDB.SelectedDeck);
  var lines = [];
  lines.push("[b]" + WBDB.SelectedDeck.name + "[/b]");
  lines.push("");
  lines.push(
    "[url=" +
      WBDB.worldbreakersdb_url +
      "/" +
      WBDB.locale +
      "/card/" +
      WBDB.Identity.code +
      "]" +
      WBDB.Identity.title +
      "[/url] (" +
      WBDB.Identity.pack.name +
      ")"
  );

  $("#deck-content > div > h5:visible, #deck-content > div > div > div").each(
    function (i, line) {
      switch ($(line).prop("tagName")) {
        case "H5":
          lines.push("");
          lines.push("[b]" + $(line).text().trim() + "[/b]");
          break;
        default:
          var qty = $(line)
            .ignore("a, span, small")
            .text()
            .trim()
            .replace(/x.*/, "x");
          var inf = $(line).find("span").text().trim();
          var card = Data.cards.findById($(line).find("a.card").data("index"));
          lines.push(
            qty +
              " [url=" +
              WBDB.worldbreakersdb_url +
              "/" +
              WBDB.locale +
              "/card/" +
              card.code +
              "]" +
              card.title +
              "[/url] [i](" +
              card.pack.name +
              ")[/i] " +
              (inf
                ? "[color=" +
                  FactionColors[card.faction_code] +
                  "]" +
                  inf +
                  "[/color]"
                : "")
          );
      }
    }
  );

  lines.push($("#cardcount").text());
  lines.push($("#latestpack").text());
  lines.push("");
  if (typeof WBDB.Decklist != "undefined" && WBDB.Decklist != null) {
    lines.push(
      "Decklist [url=" + location.href + "]published on WorldbreakersDB[/url]."
    );
  } else {
    lines.push(
      "Deck built on [url=" +
        WBDB.worldbreakersdb_url +
        "]WorldbreakersDB[/url]."
    );
  }
  return lines;
}

function build_markdown(deck) {
  process_deck_by_type(deck || WBDB.SelectedDeck);
  var lines = [];
  lines.push("## " + WBDB.SelectedDeck.name);
  lines.push("");
  lines.push(
    "[" +
      WBDB.Identity.title +
      "](" +
      WBDB.worldbreakersdb_url +
      "/" +
      WBDB.locale +
      "/card/" +
      WBDB.Identity.code +
      ") _(" +
      WBDB.Identity.pack.name +
      ")_"
  );

  $("#deck-content > div > h5:visible, #deck-content > div > div > div").each(
    function (i, line) {
      switch ($(line).prop("tagName")) {
        case "H5":
          lines.push("");
          lines.push("###" + $(line).text());
          break;
        default:
          var qty = $(line)
            .ignore("a, span, small")
            .text()
            .trim()
            .replace(/x.*/, "x");
          var inf = $(line).find("span").text().trim();
          var card = Data.cards.findById($(line).find("a.card").data("index"));
          lines.push(
            "* " +
              qty +
              " [" +
              card.title +
              "](" +
              WBDB.worldbreakersdb_url +
              "/" +
              WBDB.locale +
              "/card/" +
              card.code +
              ") _(" +
              card.pack.name +
              ")_ " +
              inf
          );
      }
    }
  );

  lines.push("");
  lines.push($("#cardcount").text() + "  ");
  lines.push($("#latestpack").text() + "  ");
  lines.push("");
  if (typeof WBDB.Decklist != "undefined" && WBDB.Decklist != null) {
    lines.push(
      "Decklist [published on WorldbreakersDB](" + location.href + ")."
    );
  } else {
    lines.push(
      "Deck built on [WorldbreakersDB](" + WBDB.worldbreakersdb_url + ")."
    );
  }
  return lines;
}

function build_plaintext(deck) {
  process_deck_by_type(deck || WBDB.SelectedDeck);
  var lines = [];
  lines.push(WBDB.SelectedDeck.name);
  lines.push("");
  lines.push(WBDB.Identity.title);

  $("#deck-content > div > h5:visible, #deck-content > div > div > div").each(
    function (i, line) {
      switch ($(line).prop("tagName")) {
        case "H5":
          lines.push("");
          lines.push($(line).text().trim());
          break;
        default:
          lines.push($(line).text().trim());
      }
    }
  );

  lines.push("");
  lines.push($("#cardcount").text());
  lines.push($("#latestpack").text());
  lines.push("");
  if (typeof WBDB.Decklist != "undefined" && WBDB.Decklist != null) {
    lines.push("Decklist published on " + WBDB.worldbreakersdb_url + ".");
  } else {
    lines.push("Deck built on " + WBDB.worldbreakersdb_url + ".");
  }
  return lines;
}

function build_tts(deck) {
  deck = process_deck_by_type(deck || WBDB.SelectedDeck);
  delete deck.identity;
  var lines = [];
  lines = lines.concat.apply(lines, Object.values(deck)).map(function (item) {
    return item.card.code;
  });
  lines.sort();

  var CARD_WIDTH = 744;
  var CARD_HEIGHT = 1039;

  var $canvas = $("<canvas></canvas>").appendTo(document.body);
  $canvas
    .attr({ width: 10 * CARD_WIDTH, height: 3 * CARD_HEIGHT })
    .css({ display: "none" });
  var canvas = $canvas.get(0);
  var ctx = canvas.getContext("2d");

  var images = lines.map(function (code, index) {
    return new Promise(function (resolve) {
      var img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = function () {
        ctx.drawImage(
          img,
          CARD_WIDTH * (index % 10),
          CARD_HEIGHT * Math.floor(index / 10)
        );
        resolve(img);
      };
      img.src = WBDB.card_image_url + "/large/" + code + ".jpg";
    });
  });

  return Promise.all(images).then(function () {
    var link = document.createElement("a");
    link.innerText = "Download deck";
    link.download = "deck.jpeg";

    return new Promise(function (resolve) {
      canvas.toBlob(function (blob) {
        link.href = URL.createObjectURL(blob);
        resolve(link);
      }, "image/png");
    });
  });
}

function process_deck_by_type() {
  var bytype = {};
  WBDB.Identity = Data.cards
    .find({ indeck: { $gt: 0 }, type_code: "identity" })
    .pop();
  if (!WBDB.Identity) {
    return;
  }

  Data.cards
    .find(
      { indeck: { $gt: 0 }, type_code: { $ne: "identity" } },
      {
        indeck: 1,
        type: 1,
        title: 1,
        faction: 1,
      }
    )
    .forEach(function (card) {
      var type = card.type.code;
      var faction_code = "";

      if (card.faction.code != WBDB.Identity.faction_code) {
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
  bytype.identity = [
    {
      card: WBDB.Identity,
      qty: 1,
      faction: "",
    },
  ];

  return bytype;
}
