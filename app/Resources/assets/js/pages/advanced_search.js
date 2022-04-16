/* global $ */
import * as search from "../search.js";
import * as ui from "../ui.js";
import { data } from "../wbdb.data.js";

export function enhanceAdvancedSearchPage() {
  Promise.all([data.promise, ui.promise]).then(function () {
    var latest_cards = search.latestCards();

    $("#q").typeahead(
      {
        hint: true,
        highlight: true,
        minLength: 2,
      },
      {
        display: function (card) {
          return card.title;
        },
        source: search.findMatches(latest_cards),
      }
    );
  });

  $(function () {
    $("#faction-select").multiselect({
      buttonWidth: "100%",
    });
  });
}
