/* global $, Routing */
import { card_modal } from "./wbdb.card_modal.js";
import { charts } from "./wbdb.charts.js";
import { data } from "./wbdb.data.js";
import { deck } from "./wbdb.deck.js";
import { diff } from "./wbdb.diff.js";
import { exporter } from "./wbdb.exporter.js";
import { format } from "./wbdb.format.js";
import { fuzzy_search } from "./wbdb.fuzzy_search.js";
import { search } from "./wbdb.search.js";
import { settings } from "./wbdb.settings.js";
import { smart_filter } from "./wbdb.smart_filter.js";
import { tip } from "./wbdb.tip.js";
import { ui } from "./wbdb.ui.js";
import { user } from "./wbdb.user.js";

import * as pages from "./pages.js";

const WBDB = {
  card_modal,
  charts,
  data,
  deck,
  diff,
  exporter,
  format,
  fuzzy_search,
  search,
  settings,
  smart_filter,
  tip,
  ui,
  user,

  pages,

  Deck: null,
  DeckSize: 0,
  Decklist: null,
  Filters: null,
  InputByTitle: false,
  SelectedDeck: null,

  DisplaySort: "type",
  DisplaySortSecondary: "name",

  init({ locale, card_image_url, worldbreakersdb_url }) {
    WBDB.locale = locale;
    WBDB.card_image_url = card_image_url;
    WBDB.worldbreakersdb_url = worldbreakersdb_url;

    $(function () {
      WBDB.user.query();
      WBDB.data.load();
    });

    $(document).on("data.app", function () {
      $("body").on({
        touchstart: WBDB.tip.prevent,
      });
      $("body").on(
        {
          mouseover: WBDB.tip.display,
        },
        "a"
      );
    });

    Promise.all([WBDB.user.promise, WBDB.data.promise]).then(
      WBDB.ui.manageImages
    );

    // this was topnav.js
    Promise.all([WBDB.data.promise, WBDB.ui.promise]).then(function () {
      var all_cards = WBDB.data.cards.find();

      $("#top_nav_card_search_menu").on("shown.bs.dropdown", function () {
        $("#top_nav_card_search").focus();
      });
      $("#top_nav_card_search").typeahead(
        {
          hint: true,
          highlight: true,
          minLength: 2,
        },
        {
          display: function (card) {
            return card.title + " (" + card.pack.name + ")";
          },
          source: WBDB.search.findMatches(all_cards),
        }
      );
      $("#top_nav_card_search").on(
        "typeahead:selected typeahead:autocomplete",
        function (event, data) {
          location.href = Routing.generate("cards_zoom", {
            card_code: data.code,
            _locale: WBDB.locale,
          });
        }
      );

      $("#top_nav_card_search").keypress(function (event) {
        var keycode = event.keyCode ? event.keyCode : event.which;
        if (keycode == "13") {
          $("#top_nav_card_search_form").submit();
        }
      });
    });
  },

  initCardModal() {
    $(function () {
      WBDB.card_modal.create_element();

      $("body").on(
        {
          click: function (event) {
            var element = $(this);
            if (
              event.shiftKey ||
              event.altKey ||
              event.ctrlKey ||
              event.metaKey
            ) {
              event.stopPropagation();
              return;
            }
            if (WBDB.card_modal) {
              WBDB.card_modal.display_modal(event, element);
            }
          },
        },
        ".card"
      );
    });
  },

  initFuzzySearch() {
    $(document).on("data.app", function () {
      WBDB.data.cards.find().forEach(function (card) {
        WBDB.data.cards.updateById(card.code, {
          token: card.title
            .replace(/[^0-9.\-A-Za-z\u00C0-\u017F]+/g, " ")
            .trim()
            .toLowerCase(),
        });
      });
    });
  },

  initSettings() {
    $(function () {
      WBDB.settings.load();
    });
  },

  find_identity() {
    WBDB.Identity = WBDB.data.cards
      .find({ indeck: { $gt: 0 }, type_code: "identity" })
      .pop();
  },
};

export default WBDB;
