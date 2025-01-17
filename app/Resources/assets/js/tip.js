/* global $ */
import { data as Data } from "./wbdb.data.js";
import * as format from "./format.js";

export const tip = {};

var hide_event = "mouseout";
var prevent_all = false;

export function prevent() {
  prevent_all = true;
}

export function display(event) {
  var $this = $(this);

  if (prevent_all || $this.hasClass("no-popup")) {
    return;
  }

  var code =
    $this.data("index") ||
    $this.closest(".card-container").data("index") ||
    ($this.attr("href") &&
      $this.attr("href").replace(/.*\/card\/(\d\d\d\d\d).*/, "$1"));
  var card = Data.cards.findById(code);
  if (!card) return;
  var type = '<p class="card-info">' + format.type(card) + "</p>";
  if (card.type_code === "follower") {
    type +=
      "<p>Strength <b>" +
      card.strength +
      "</b> &middot; Health <b>" +
      card.health +
      "</b></p>";
  } else if (card.type_code === "location") {
    var stages = card.stages
      .filter((s) => s)
      .map((stage) => "<li>" + format.text({ text: stage }) + "</li>");
    type += '<p><ol class="stages">' + stages.join("") + "</ol></p>";
  }
  var image_svg = "";
  if ($("#nrdb_svg_hex").length) {
    image_svg =
      '<div class="card-image card-image-' +
      card.type_code +
      '" style="background-image:url(' +
      card.images.small[0] +
      ')"><svg width="103px" height="90px" viewBox="0 0 677 601" xmlns="http://www.w3.org/2000/svg" xmlns:svg="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><mask id="mask"><use xlink:href="#rect" style="fill:white" /><use xlink:href="#hex" style="fill:black"/></mask><use xlink:href="#rect" mask="url(#mask)"/><use xlink:href="#hex" style="stroke:black;fill:none;stroke-width:15" /></svg></div>';
  }

  $(".qtip").each(function () {
    $(this).qtip("api").destroy(true);
  });

  $this.qtip(
    {
      content: {
        text:
          image_svg +
          '<h4 class="card-title">' +
          card.title +
          (card.signature && card.type_code !== "identity"
            ? '<span class="card-is-signature glyphicon glyphicon-star" title="Signature Card"></span>'
            : "") +
          "</h4>" +
          type +
          '<div class="card-text border-' +
          card.faction_code +
          '">' +
          format.text(card) +
          "</div>" +
          '<p class="card-faction" style="text-align:right;clear:right">' +
          card.faction.name +
          " &ndash; " +
          card.pack.name +
          "</p>",
      },
      style: {
        classes: "qtip-bootstrap qtip-nrdb",
      },
      position: {
        my: "left center",
        at: "right center",
        viewport: $(document.body),
        adjust: {
          method: "flip",
        },
      },
      show: {
        ready: true,
        solo: true,
      },
      hide: {
        event: hide_event,
      },
    },
    event
  );
}

export function set_hide_event(opt_hide_event) {
  if (opt_hide_event === "mouseout" || opt_hide_event === "unfocus") {
    hide_event = opt_hide_event;
  }
}
