/* global $, Markdown, Routing, WBDB */
import { show_publish_deck_form } from "./publish_deck_form.js";

export function enhanceDeckviewPage() {
  $(document).on("data.app", function () {
    var sets_in_deck = {};
    WBDB.data.cards.find().forEach(function (card) {
      var indeck = 0;
      if (WBDB.SelectedDeck.slots[card.code]) {
        indeck = parseInt(WBDB.SelectedDeck.slots[card.code], 10);
        sets_in_deck[card.pack_code] = 1;
      }
      WBDB.data.cards.updateById(card.code, {
        indeck: indeck,
      });
    });

    WBDB.deck.update();
    WBDB.charts.update();
  });

  function do_action_deck() {
    var action_id = $(this).attr("id");
    if (!action_id || !WBDB.SelectedDeck) return;
    switch (action_id) {
      case "btn-edit":
        location.href = Routing.generate("deck_edit", {
          deck_uuid: WBDB.SelectedDeck.uuid,
        });
        break;
      case "btn-publish":
        show_publish_deck_form(
          WBDB.SelectedDeck.uuid,
          WBDB.SelectedDeck.name,
          WBDB.SelectedDeck.description
        );
        break;
      case "btn-delete":
        confirm_delete();
        break;
      case "btn-download-text":
        location.href = Routing.generate("deck_export_text", {
          deck_uuid: WBDB.SelectedDeck.uuid,
        });
        break;
      case "btn-export-tts":
        WBDB.exporter.tts();
        break;
      case "btn-print":
        window.print();
        break;
      case "btn-sort-type":
        WBDB.DisplaySort = "type";
        WBDB.DisplaySortSecondary = null;
        switch_to_web_view();
        break;
      case "btn-sort-number":
        WBDB.DisplaySort = "number";
        WBDB.DisplaySortSecondary = null;
        switch_to_web_view();
        break;
      case "btn-sort-faction":
        WBDB.DisplaySort = "faction";
        WBDB.DisplaySortSecondary = null;
        switch_to_web_view();
        break;
      case "btn-sort-faction-type":
        WBDB.DisplaySort = "faction";
        WBDB.DisplaySortSecondary = "type";
        switch_to_web_view();
        break;
      case "btn-sort-faction-number":
        WBDB.DisplaySort = "faction";
        WBDB.DisplaySortSecondary = "number";
        switch_to_web_view();
        break;
      case "btn-sort-title":
        WBDB.DisplaySort = "title";
        WBDB.DisplaySortSecondary = null;
        switch_to_web_view();
        break;
      case "btn-display-plain":
        WBDB.exporter.plaintext();
        break;
      case "btn-display-bbcode":
        WBDB.exporter.bbcode();
        break;
      case "btn-display-markdown":
        WBDB.exporter.markdown();
        break;
    }
  }

  $(function () {
    $("#cardModal").on({
      keypress: function (event) {
        var num = parseInt(event.which, 10) - 48;
        $(".modal input[type=radio][value=" + num + "]").trigger("change");
      },
    });

    var converter = new Markdown.Converter();
    $("#description").html(
      converter.makeHtml(
        WBDB.SelectedDeck.description
          ? WBDB.SelectedDeck.description
          : "<i>No description.</i>"
      )
    );

    $(".btn-actions").on(
      {
        click: do_action_deck,
      },
      "button[id],a[id]"
    );

    $("#btn-publish").prop("disabled", !!WBDB.SelectedDeck.problem);
  });

  function confirm_delete() {
    $("#delete-deck-name").text(WBDB.SelectedDeck.name);
    $("#delete-deck-uuid").val(WBDB.SelectedDeck.uuid);
    $("#deleteModal").modal("show");
  }

  function switch_to_web_view() {
    $("#deck").html(
      '<div class="row"><div class="col-sm-12"><h3 id="identity"></h3><div id="cardcount"></div><div id="latestpack"></div><div id="limited"></div></div></div><div class="row" id="deck-content" style="margin-bottom:10px"></div>'
    );
    WBDB.deck.update();
  }
}
