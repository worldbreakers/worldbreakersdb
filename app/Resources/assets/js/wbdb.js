import { card_modal } from "./wbdb.card_modal.js";
import { data } from "./wbdb.data.js";
import { diff } from "./wbdb.diff.js";
import { format } from "./wbdb.format.js";
import { fuzzy_search } from "./wbdb.fuzzy_search.js";
import { settings } from "./wbdb.settings.js";
import { smart_filter } from "./wbdb.smart_filter.js";
import { tip } from "./wbdb.tip.js";
import { ui } from "./wbdb.ui.js";
import { user } from "./wbdb.user.js";

import * as pages from "./pages.js";

const WBDB = {
  card_modal,
  data,
  diff,
  format,
  fuzzy_search,
  settings,
  smart_filter,
  tip,
  ui,
  user,

  pages,

  DeckSize: 0,

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

      function findMatches(q, cb) {
        if (q.match(/^\w:/)) {
          return;
        }

        var regexp = new RegExp(q, "i");
        var matchingCards = _.filter(all_cards, function (card) {
          return regexp.test(_.deburr(card.title).toLowerCase().trim());
        });
        cb(_.sortBy(matchingCards, "title"));
      }
      $("#top_nav_card_search_menu").on(
        "shown.bs.dropdown",
        function (element) {
          $("#top_nav_card_search").focus();
        }
      );
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
          source: findMatches,
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
    });
  },

  initFuzzySearch() {
    $(document).on("data.app", function () {
      WBDB.data.cards.find().forEach(function (card) {
        WBDB.data.cards.updateById(card.code, {
          token: card.title
            .replace(/[^0-9\.\-A-Za-z\u00C0-\u017F]+/g, " ")
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
};

export default WBDB;
