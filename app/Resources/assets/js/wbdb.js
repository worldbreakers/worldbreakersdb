/* global $, Routing */
import * as card_modal from "./card_modal.js";
import { data } from "./wbdb.data.js";
import * as search from "./search.js";
import * as settings from "./settings.js";
import * as tip from "./tip.js";
import * as ui from "./ui.js";
import * as user from "./user.js";

import * as pages from "./pages.js";

const WBDB = {
  pages,
  user,

  locale: "",

  Deck: null,
  Decklist: null,
  Filters: null,
  Identity: null,
  InputByTitle: false,
  SelectedDeck: null,

  DisplaySort: "type",
  DisplaySortSecondary: "name",

  setConfig({ locale, card_image_url, worldbreakersdb_url }) {
    WBDB.locale = locale;
    WBDB.card_image_url = card_image_url;
    WBDB.worldbreakersdb_url = worldbreakersdb_url;
  },

  init() {
    $(function () {
      user.query();
      data.load();
    });

    $(document).on("data.app", function () {
      $("body").on({
        touchstart: tip.prevent,
      });
      $("body").on(
        {
          mouseover: tip.display,
        },
        "a"
      );
    });

    Promise.all([user.promise, data.promise]).then(ui.manageImages);

    // this was topnav.js
    Promise.all([data.promise, ui.promise]).then(function () {
      var all_cards = data.cards.find();

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
          source: search.findMatches(all_cards),
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

    $(function () {
      card_modal.create_element();

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
            card_modal.display_modal(event, element);
          },
        },
        ".card"
      );
    });
  },

  initFuzzySearch() {
    $(document).on("data.app", function () {
      data.cards.find().forEach(function (card) {
        data.cards.updateById(card.code, {
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
      settings.load();
    });
  },

  clearCache() {
    data.update();
  },
};

export default WBDB;
