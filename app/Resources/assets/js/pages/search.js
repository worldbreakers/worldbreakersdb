/* global $ */
import { latestCards, findMatches } from "../search.js";

export function enhanceSearchPage() {
  $(document).on("data.app", function () {
    var cards = latestCards();

    $("#filter-text").typeahead(
      {
        hint: true,
        highlight: true,
        minLength: 2,
      },
      {
        name: "cardnames",
        display(card) {
          return card.title;
        },
        source: findMatches(cards),
      }
    );

    $("#filter-text").on(
      "typeahead:selected typeahead:autocompleted",
      function (event, card) {
        var line = $(
          '<p class="background-' +
            card.faction_code +
            '-20" style="padding: 3px 5px;border-radius: 3px;border: 1px solid silver">' +
            '<button type="button" class="close" aria-hidden="true">&times;</button>' +
            '<input type="hidden" name="cards[]" value="' +
            card.code +
            '">' +
            card.title +
            " (" +
            card.pack.name +
            ")</p>"
        );
        line.on({
          click() {
            line.remove();
          },
        });
        line.insertBefore($("#filter-text"));
        $(event.target).typeahead("val", "");
      }
    );
  });
}
