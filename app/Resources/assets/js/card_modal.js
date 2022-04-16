/* global $, WBDB, Routing */
import * as format from "./format.js";
import { data as Data } from './wbdb.data.js';

var modal = null;

export function create_element() {
  modal = $(
    '<div class="modal" id="cardModal" tabindex="-1" role="dialog" aria-labelledby="cardModalLabel" aria-hidden="true"><div class="modal-dialog"><div class="modal-content"><div class="modal-header"><button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button><h3 class="modal-title card-title">Modal title</h3><div class="row"><div class="col-sm-12 text-center"><div class="btn-group modal-qty" data-toggle="buttons"></div></div></div></div><div class="modal-body"><div class="row"><div class="col-sm-6 modal-image"></div><div class="col-sm-6 modal-info"></div></div></div><div class="modal-footer"><a role="button" href="#" class="btn btn-default card-modal-link no-popup">Go to card page</a><button type="button" class="btn btn-primary" data-dismiss="modal">Close</button></div></div></div></div>'
  );
  modal.appendTo("body");
}

export function display_modal(event, element) {
  event.preventDefault();
  $(element).qtip("hide");
  var code =
    $(element).data("index") ||
    $(element).closest(".card-container").data("index");
  fill_modal(code);
}

export function typeahead(event, data) {
  fill_modal(data.code);
  $("#cardModal").modal("show");
  WBDB.InputByTitle = true;
}

function fill_modal(code) {
  var card = Data.cards.findById(code);
  modal.data("index", code);
  modal
    .find(".card-modal-link")
    .attr("href", Routing.generate("cards_zoom", { card_code: card.code }));
  modal
    .find("h3.modal-title")
    .html(
      card.title +
        (card.signature && card.type_code !== "identity"
          ? '<span class="card-is-signature glyphicon glyphicon-star" title="Signature Card"></span>'
          : "")
    );
  modal
    .find(".modal-image")
    .html(
      '<img class="img-responsive" src="' +
        card.images.large[0] +
        '" alt="' +
        card.title +
        '">'
    );

  var modalText = format.text(card);
  if (card.type_code === "location") {
    var stages = card.stages
      .filter((s) => s)
      .map((stage) => "<li>" + format.text({ text: stage }) + "</li>");
    modalText += '<p><ol class="stages">' + stages.join("") + "</ol></p>";
  }

  modal
    .find(".modal-info")
    .html(
      '<div class="card-info">' +
        format.type(card) +
        "</div>" +
        "<div><small>" +
        card.faction.name +
        " &bull; " +
        card.pack.name +
        "</small></div>" +
        '<div class="card-text border-' +
        card.faction_code +
        '"><small>' +
        modalText +
        "</small></div>"
    );

  var qtyelt = modal.find(".modal-qty");

  var isSignatureCard = !!card.signature;
  var isOtherSignatureCard =
    isSignatureCard &&
    WBDB.Identity &&
    card.signature !== WBDB.Identity.signature;

  if (qtyelt && WBDB.Filters !== null) {
    var qty = "";
    if (!isOtherSignatureCard) {
      for (var i = 0; i <= card.maxqty; i++) {
        qty +=
          '<label class="btn btn-default"><input type="radio" name="qty" value="' +
          i +
          '">' +
          i +
          "</label>";
      }
    }
    qtyelt.html(qty);

    qtyelt.find("label").each(function (index, element) {
      if (index == card.indeck) $(element).addClass("active");
      else $(element).removeClass("active");
    });
    if (card.code == WBDB.Identity.code) {
      qtyelt
        .find("label")
        .addClass("disabled")
        .find("input[type=radio]")
        .attr("disabled", true);
    }
  } else {
    if (qtyelt) qtyelt.closest(".row").remove();
  }
}
