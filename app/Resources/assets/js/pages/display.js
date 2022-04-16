/* global $, Routing, WBDB */
import { data } from "../wbdb.data.js";
import * as search from "../search.js";
import * as ui from "../ui.js";

export function enhanceDisplayPage() {
  Promise.all([data.promise, ui.promise]).then(function () {
    var all_cards = data.cards.find();

    $("#search-input").typeahead(
      {
        hint: true,
        highlight: true,
        minLength: 2,
      },
      {
        display: function (card) {
          return card.title + " (" + card.pack.name + ")";
        },
        source: search.findMatches(all_cards),
      }
    );
    $("#search-input").on(
      "typeahead:selected typeahead:autocomplete",
      function (event, data) {
        location.href = Routing.generate("cards_zoom", {
          card_code: data.code,
          _locale: WBDB.locale,
        });
      }
    );
  });
}
