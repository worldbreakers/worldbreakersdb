/* global _, $, localforage, Markdown, moment, Routing, WBDB */
import { data as Data } from "../wbdb.data.js";
import * as Settings from "../settings.js";
import { update as updateCharts } from "../charts.js";
import { update as updateDeck } from "../deck.js";
import * as Search from "../search.js";
import * as SmartFilter from "../smart_filter.js";
import { typeahead } from "../card_modal.js";
import { enhanceTextarea } from "../ui.js";
import { compute_simple } from "../diff.js";

export function enhanceDeckPage({ deck_uuid, history }) {
  var Autosave_timer = null;
  var Autosave_running = false;
  var Autosave_period = 60;
  var CardDivs = [null, {}, {}, {}];
  var Deck_changed_since_last_autosave = false;
  var FilterQuery = {};
  var Order = 1;
  var Snapshots = [];
  var Sort = "title";

  function update_max_qty() {
    Data.cards.find().forEach(function (card) {
      // TODO: hard coded limit
      var max_qty = 1;
      if (card.pack_code == "core") {
        max_qty = Math.min(Settings.getItem("core-sets"), max_qty);
      }
      Data.cards.updateById(card.code, {
        maxqty: max_qty,
      });
    });
  }

  Promise.all([Data.promise, Settings.promise]).then(function () {
    Data.cards.find().forEach(function (card) {
      var indeck = 0;
      if (WBDB.Deck[card.code]) {
        indeck = parseInt(WBDB.Deck[card.code], 10);
      }
      Data.cards.updateById(card.code, {
        indeck: indeck,
      });
    });

    WBDB.Identity = Data.find_identity();

    update_max_qty();

    $("#faction_code").empty();

    var factions = Data.factions.find().sort(function (a, b) {
      return b.code.substr(0, 7) === "neutral"
        ? -1
        : a.code.substr(0, 7) === "neutral"
        ? 1
        : a.code.localeCompare(b.code);
    });
    factions.forEach(function (faction) {
      var label = $(
        '<label class="btn btn-default btn-sm" data-code="' +
          faction.code +
          '" title="' +
          faction.name +
          '"><input type="checkbox" name="' +
          faction.code +
          '">' +
          faction.code +
          "</label>"
      );
      label.tooltip({ container: "body" });
      $("#faction_code").append(label);
    });

    $("#faction_code").button();
    $("#faction_code")
      .children("label[data-code=" + WBDB.Identity.faction_code + "]")
      .each(function (index, elt) {
        $(elt).button("toggle");
      });

    $("#type_code").empty();
    var types = Data.types
      .find({
        code: { $ne: "identity" },
      })
      .sort();
    types.forEach(function (type) {
      var label = $(
        '<label class="btn btn-default btn-sm" data-code="' +
          type.code +
          '" title="' +
          type.name +
          '"><input type="checkbox" name="' +
          type.code +
          '">' +
          type.name +
          "</label>"
      );
      label.tooltip({ container: "body" });
      $("#type_code").append(label);
    });
    $("#type_code").button();
    $("#type_code")
      .children("label:first-child")
      .each(function (index, elt) {
        $(elt).button("toggle");
      });

    $("input[name=Identity]").prop("checked", false);

    var latestCards = Search.latestCards();

    $("#filter-text").typeahead(
      {
        hint: true,
        highlight: true,
        minLength: 2,
      },
      {
        display: function (card) {
          return card.title + " (" + card.pack.name + ")";
        },
        source: Search.findMatches(latestCards),
      }
    );

    $.each(history, function (index, snapshot) {
      add_snapshot(snapshot);
    });

    $("html,body").css("height", "auto");

    $(document).on("persistence:change", function (event, value) {
      switch ($(event.target).attr("name")) {
        case "display-columns":
          refresh_collection();
          break;
        case "sort-order":
          WBDB.DisplaySort = value;
      }
    });

    var initialPackSelection = {};
    var promises = [];

    Data.packs.find().forEach(function (pack) {
      promises.push(
        localforage.getItem("pack_code_" + pack.code).then(function (value) {
          if (value) initialPackSelection[pack.code] = value === "on";
        })
      );
    });

    Promise.all(promises).then(function () {
      refresh_collection();
      updateDeck();
      updateCharts();
    });
  });

  function get_filter_query(filters) {
    var FilterQuery = _.pickBy(filters);

    return FilterQuery;
  }

  function uncheck_all_others() {
    $(this)
      .closest(".filter")
      .find("input[type=checkbox]")
      .prop("checked", false);
    $(this)
      .children("input[type=checkbox]")
      .prop("checked", true)
      .trigger("change");
  }

  function check_all_others() {
    $(this)
      .closest(".filter")
      .find("input[type=checkbox]")
      .prop("checked", true);
    $(this).children("input[type=checkbox]").prop("checked", false);
  }

  function uncheck_all_active() {
    $(this).closest(".filter").find("label.active").button("toggle");
  }

  function check_all_inactive() {
    $(this).closest(".filter").find("label:not(.active)").button("toggle");
  }

  $(function () {
    // while editing a deck, we don't want to leave the page if the deck is unsaved
    $(window).on("beforeunload", alert_if_unsaved);

    $("html,body").css("height", "100%");

    $("#filter-text").on(
      "typeahead:selected typeahead:autocompleted",
      typeahead
    );

    $(document).on("hidden.bs.modal", function () {
      if (WBDB.InputByTitle) {
        setTimeout(function () {
          $("#filter-text").typeahead("val", "").focus();
        }, 100);
      }
    });

    $("#pack_code,.search-buttons").on("change", "label", handle_input_change);

    $(".search-buttons").on("click", "label", function (event) {
      var dropdown = $(this).closest("ul").hasClass("dropdown-menu");
      if (dropdown) {
        if (event.shiftKey) {
          if (!event.altKey) {
            uncheck_all_others.call(this);
          } else {
            check_all_others.call(this);
          }
        }
        event.stopPropagation();
      } else {
        if (
          (!event.shiftKey &&
            Settings.getItem("buttons-behavior") === "exclusive") ||
          (event.shiftKey &&
            Settings.getItem("buttons-behavior") === "cumulative")
        ) {
          if (!event.altKey) {
            uncheck_all_active.call(this);
          } else {
            check_all_inactive.call(this);
          }
        }
      }
    });

    $("#filter-text").on({
      input: function () {
        var q = $(this).val();
        if (q.match(/^\w[:<>!]/)) {
          SmartFilter.handler(q, refresh_collection);
        } else {
          SmartFilter.handler("", refresh_collection);
        }
      },
    });

    $("#save_form").submit(handle_submit);

    $("#btn-save-as-copy").on("click", function () {
      $("#deck-save-as-copy").val(1);
    });

    $("#btn-cancel-edits").on("click", function () {
      var edits = $.grep(Snapshots, function (snapshot) {
        return snapshot.saved === false;
      });
      if (edits.length) {
        var confirmation = confirm(
          "This operation will revert the changes made to the deck since " +
            edits[edits.length - 1].date_creation.calendar() +
            ". The last " +
            (edits.length > 1 ? edits.length + " edits" : "edit") +
            " will be lost. Do you confirm?"
        );
        if (!confirmation) return false;
      }
      $("#deck-cancel-edits").val(1);
    });

    $("#collection").on(
      {
        change: function (event) {
          var el = event.target;
          // don't allow setting your current ID to 0 copies.  That's silly.
          var index =
            $(el).closest(".card-container").data("index") ||
            $(el).closest("div.modal").data("index");
          var card = Data.cards.findById(index);
          if (card.type_code == "identity") {
            var quantity = parseInt($(el).val(), 10);
            if (quantity == 0 && card.indeck == 1) {
              var name = "qty-" + card.code;
              $("[name=" + name + "][value=0]").prop("checked", false);
              $("[name=" + name + "][value=0]")
                .parent()
                .removeClass("active");
              $("[name=" + name + "][value=1]").prop("checked", true);
              $("[name=" + name + "][value=1]")
                .parent()
                .addClass("active");
              event.preventDefault();
              return;
            }
          }
          WBDB.InputByTitle = false;
          handle_quantity_change.call(this, event);
        },
      },
      "input[type=radio]"
    );

    $("#collection").on(
      {
        click: function () {
          WBDB.InputByTitle = false;
        },
      },
      "a.card"
    );

    $(".modal").on(
      {
        change: handle_quantity_change,
      },
      "input[type=radio]"
    );

    $("thead").on(
      {
        click: handle_header_click,
      },
      "a[data-sort]"
    );

    $("#cardModal").on({
      keypress: function (event) {
        var num = parseInt(event.which, 10) - 48;
        $(".modal input[type=radio][value=" + num + "]").trigger("change");
      },
    });

    var converter = new Markdown.Converter();
    $("#description").on("keyup", function () {
      $("#description-preview").html(
        converter.makeHtml($("#description").val())
      );
    });

    enhanceTextarea("#description");
    $("#tbody-history").on("click", "a[role=button]", load_snapshot);
    setInterval(autosave_interval, 1000);
  });
  function autosave_interval() {
    if (Autosave_running) return;
    if (Autosave_timer < 0 && deck_uuid) Autosave_timer = Autosave_period;
    if (Autosave_timer === 0) {
      deck_autosave();
    }
    Autosave_timer--;
  }
  // if diff is undefined, consider it is the content at load
  function add_snapshot(snapshot) {
    snapshot.date_creation = snapshot.date_creation
      ? moment(snapshot.date_creation)
      : moment();
    Snapshots.push(snapshot);

    var list = [];
    if (snapshot.variation) {
      $.each(snapshot.variation[0], function (code, qty) {
        var card = Data.cards.findById(code);
        if (!card) return;
        list.push(
          "+" +
            qty +
            " " +
            '<a href="' +
            Routing.generate("cards_zoom", { card_code: code }) +
            '" class="card" data-index="' +
            code +
            '">' +
            card.title +
            "</a>"
        );
      });
      $.each(snapshot.variation[1], function (code, qty) {
        var card = Data.cards.findById(code);
        if (!card) return;
        list.push(
          "&minus;" +
            qty +
            " " +
            '<a href="' +
            Routing.generate("cards_zoom", { card_code: code }) +
            '" class="card" data-index="' +
            code +
            '">' +
            card.title +
            "</a>"
        );
      });
    } else {
      list.push("First version");
    }

    $("#tbody-history").prepend(
      "<tr" +
        (snapshot.saved ? "" : ' class="warning"') +
        "><td>" +
        snapshot.date_creation.calendar() +
        (snapshot.saved ? "" : " (unsaved)") +
        "</td><td>" +
        list.join("<br>") +
        '</td><td><a role="button" href="#" data-index="' +
        (Snapshots.length - 1) +
        '"">Revert</a></td></tr>'
    );

    Autosave_timer = -1; // start timer
  }
  function load_snapshot() {
    var index = $(this).data("index");
    var snapshot = Snapshots[index];
    if (!snapshot) return;

    Data.cards.find().forEach(function (card) {
      var indeck = 0;
      if (snapshot.content[card.code]) {
        indeck = parseInt(snapshot.content[card.code], 10);
      }
      Data.cards.updateById(card.code, {
        indeck: indeck,
      });
    });
    updateDeck();
    refresh_collection();
    Deck_changed_since_last_autosave = true;
    return false;
  }
  function deck_autosave() {
    // check if deck has been modified since last autosave
    if (!Deck_changed_since_last_autosave || !deck_uuid) return;
    // compute diff between last snapshot and current deck
    var last_snapshot = Snapshots[Snapshots.length - 1].content;
    var current_deck = get_deck_content();
    Deck_changed_since_last_autosave = false;
    var r = compute_simple([current_deck, last_snapshot]);
    if (!r) return;
    var diff = JSON.stringify(r[0]);
    if (diff == "[{},{}]") return;
    // send diff to autosave
    $("#tab-header-history").html("Autosave...");
    Autosave_running = true;
    $.ajax(Routing.generate("deck_autosave", { deck_uuid: deck_uuid }), {
      data: { diff: diff },
      type: "POST",
      success: function (data) {
        add_snapshot({
          date_creation: data,
          variation: r[0],
          content: current_deck,
          saved: false,
        });
      },
      error: function (jqXHR, textStatus, errorThrown) {
        console.log(
          "[" +
            moment().format("YYYY-MM-DD HH:mm:ss") +
            "] Error on " +
            this.url,
          textStatus,
          errorThrown
        );
        Deck_changed_since_last_autosave = true;
      },
      complete: function () {
        $("#tab-header-history").html("History");
        Autosave_running = false;
      },
    });
  }
  function handle_header_click(event) {
    event.preventDefault();
    var new_sort = $(this).data("sort");
    if (Sort == new_sort) {
      Order *= -1;
    } else {
      Sort = new_sort;
      Order = 1;
    }
    $(this)
      .closest("tr")
      .find("th")
      .removeClass("dropup")
      .find("span.caret")
      .remove();
    $(this)
      .after('<span class="caret"></span>')
      .closest("th")
      .addClass(Order > 0 ? "" : "dropup");
    refresh_collection();
  }

  function update_collection_packs() {
    var div = $("#pack_code");
    var arr = [];
    div.find("input[type=checkbox]").each(function (index, elt) {
      var name = $(elt).attr("name");

      if (name && $(elt).prop("checked")) {
        arr.push(name);
      }

      var key = "pack_code_" + name,
        value = $(elt).prop("checked") ? "on" : "off";
      localforage.setItem(key, value);
    });
    WBDB.Filters["pack_code"] = arr;
    FilterQuery = get_filter_query(WBDB.Filters);
    refresh_collection();
  }

  function handle_input_change() {
    var div = $(this).closest(".filter");
    var columnName = div.attr("id");
    if (columnName == "pack_code") {
      update_collection_packs();
      return;
    }
    var arr = [];
    div.find("input[type=checkbox]").each(function (index, elt) {
      var name = $(elt).attr("name");

      if (name && $(elt).prop("checked")) {
        arr.push(name);
      }
    });
    WBDB.Filters[columnName] = arr;
    FilterQuery = get_filter_query(WBDB.Filters);
    refresh_collection();
  }

  function get_deck_content() {
    return _.reduce(
      Data.cards.find({ indeck: { $gt: 0 } }),
      function (acc, card) {
        acc[card.code] = card.indeck;
        return acc;
      },
      {}
    );
  }
  function handle_submit() {
    Deck_changed_since_last_autosave = false;
    var deck_json = JSON.stringify(get_deck_content());
    $("input[name=content]").val(deck_json);
    $("input[name=description]").val($("textarea[name=description_]").val());
    $("input[name=tags]").val($("input[name=tags_]").val());
  }

  function handle_quantity_change() {
    var index =
      $(this).closest(".card-container").data("index") ||
      $(this).closest("div.modal").data("index");
    var in_collection = $(this).closest("#collection").length;
    var quantity = parseInt($(this).val(), 10);
    var method = quantity ? "addClass" : "removeClass";
    $(this).closest(".card-container")[method]("in-deck");
    Data.cards.updateById(index, {
      indeck: quantity,
    });
    var card = Data.cards.findById(index);
    if (card.type_code == "identity") {
      Data.cards.update(
        {
          indeck: {
            $gt: 0,
          },
          type_code: "identity",
          code: {
            $ne: index,
          },
        },
        {
          indeck: 0,
        }
      );
    }
    updateDeck();
    if (card.type_code == "identity") {
      $.each(CardDivs, function (nbcols, rows) {
        if (rows)
          $.each(rows, function (index, row) {
            row
              .removeClass("disabled")
              .find("label")
              .removeClass("disabled")
              .find("input[type=radio]")
              .attr("disabled", false);
          });
      });
      refresh_collection();
    } else {
      $.each(CardDivs, function (nbcols, rows) {
        // rows is an array of card rows
        if (rows && rows[index]) {
          // rows[index] is the card row of our card
          rows[index]
            .find('input[name="qty-' + index + '"]')
            .each(function (i, element) {
              if ($(element).val() != quantity) {
                $(element)
                  .prop("checked", false)
                  .closest("label")
                  .removeClass("active");
              } else {
                if (!in_collection) {
                  $(element)
                    .prop("checked", true)
                    .closest("label")
                    .addClass("active");
                }
              }
            });
        }
      });
    }
    $("div.modal").modal("hide");

    Deck_changed_since_last_autosave = true;
  }

  function build_div(record) {
    var isSignatureCard = !!record.signature;
    var isOtherSignatureCard =
      isSignatureCard &&
      WBDB.Identity &&
      record.signature !== WBDB.Identity.signature;
    var radios = "";

    if (!isOtherSignatureCard) {
      for (var i = 0; i <= record.maxqty; i++) {
        if (i && !(i % 4)) {
          radios += "<br>";
        }
        radios +=
          '<label class="btn btn-xs btn-default' +
          (i == record.indeck ? " active" : "") +
          (isOtherSignatureCard ? " disabled" : "") +
          '"' +
          (isOtherSignatureCard
            ? ' title="Signature cards of other Worldbreakers cannot be added."'
            : "") +
          '><input type="radio" name="qty-' +
          record.code +
          '" value="' +
          i +
          '"' +
          (isOtherSignatureCard ? ' disabled="disabled"' : "") +
          ">" +
          i +
          "</label>";
      }
    }

    var title =
      record.title +
      (isSignatureCard
        ? '<span class="card-is-signature glyphicon glyphicon-star" title="Signature Card"></span>'
        : "");

    var div = "";
    switch (Number(Settings.getItem("display-columns"))) {
      case 1:
        div = $(
          '<tr class="card-container" data-index="' +
            record.code +
            '"><td><div class="btn-group" data-toggle="buttons">' +
            radios +
            '</div></td><td><a class="card" href="' +
            Routing.generate("cards_zoom", { card_code: record.code }) +
            '" data-target="#cardModal" data-remote="false" data-toggle="modal">' +
            title +
            "</a> " +
            '</td><td class=""></td><td class="type" title="' +
            record.type.name +
            '">' +
            record.type.name +
            '</td><td class="faction" title="' +
            record.faction.name +
            '">' +
            record.faction.name +
            "</td></tr>"
        );
        break;

      case 2:
        div = $(
          '<div class="col-sm-6 card-container" data-index="' +
            record.code +
            '">' +
            '<div class="media"><div class="media-left">' +
            '<img class="media-object" src="' +
            record.images.small[0] +
            '" alt="' +
            record.title +
            '">' +
            '</div><div class="media-body">' +
            '    <h4 class="media-heading"><a class="card" href="' +
            Routing.generate("cards_zoom", { card_code: record.code }) +
            '" data-target="#cardModal" data-remote="false" data-toggle="modal">' +
            title +
            "</a></h4>" +
            '    <div class="btn-group" data-toggle="buttons">' +
            radios +
            "</div>" +
            "</div>" +
            "</div>" +
            "</div>"
        );
        break;

      case 3:
        div = $(
          '<div class="col-sm-4 card-container" data-index="' +
            record.code +
            '">' +
            '<div class="media"><div class="media-left">' +
            '<img class="media-object" src="' +
            record.images.small[0] +
            '" alt="' +
            record.title +
            '">' +
            '</div><div class="media-body">' +
            '    <h5 class="media-heading"><a class="card" href="' +
            Routing.generate("cards_zoom", { card_code: record.code }) +
            '" data-target="#cardModal" data-remote="false" data-toggle="modal">' +
            title +
            "</a></h5>" +
            '    <div class="btn-group" data-toggle="buttons">' +
            radios +
            "</div>" +
            "</div>" +
            "</div>" +
            "</div>"
        );
        break;
    }

    return div;
  }

  function update_filtered() {
    $("#collection-table").empty();
    $("#collection-grid").empty();

    var counter = 0;
    var container = $("#collection-table");
    var display_columns = Settings.getItem("display-columns");
    var SmartFilterQuery = SmartFilter.get_query(FilterQuery);

    var orderBy = {};
    orderBy[Sort] = Order;

    if (Sort != "title") orderBy["title"] = 1;

    var matchingCards = Data.cards.find(SmartFilterQuery, {
      $orderBy: orderBy,
    });
    var sortedCards = Search.latestCards(matchingCards);

    sortedCards.forEach(function (card) {
      var index = card.code;
      var row = (
        CardDivs[display_columns][index] ||
        (CardDivs[display_columns][index] = build_div(card))
      ).data("index", card.code);
      row
        .find('input[name="qty-' + card.code + '"]')
        .each(function (i, element) {
          if ($(element).val() == card.indeck)
            $(element)
              .prop("checked", true)
              .closest("label")
              .addClass("active");
          else
            $(element)
              .prop("checked", false)
              .closest("label")
              .removeClass("active");
        });

      if (display_columns > 1 && counter % display_columns === 0) {
        container = $('<div class="row"></div>').appendTo(
          $("#collection-grid")
        );
      }
      container.append(row);
      counter++;
    });
  }
  var refresh_collection = debounce(update_filtered, 250);

  function alert_if_unsaved(event) {
    if (
      Deck_changed_since_last_autosave &&
      !window.confirm("Deck is not saved. Do you really want to leave?")
    ) {
      event.preventDefault();
      return false;
    }
  }

  function debounce(fn, delay) {
    var timer = null;
    return function () {
      var context = this;
      var args = arguments;
      clearTimeout(timer);
      timer = setTimeout(function () {
        fn.apply(context, args);
      }, delay);
    };
  }
}
