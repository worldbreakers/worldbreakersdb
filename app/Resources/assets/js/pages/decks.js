/* global _, $, moment, Routing, WBDB */
import { show_publish_deck_form } from "./publish_deck_form.js";

let lastClickedDeck = null;

export function enhanceDecksPage({ Decks }) {
  $(document).on("data.app", function () {
    $("#btn-group-deck").on("click", "button[id],a[id]", do_action_deck);
    $("#btn-group-selection").on(
      "click",
      "button[id],a[id]",
      do_action_selection
    );
    $("#btn-group-sort").on("click", "button[id],a[id]", do_action_sort);
    $("#decks_upload_all").on("click", decks_upload_all);
    $("#select_all").on("click", select_all_visible);
    $("#deselect_all").on("click", deselect_all);

    $("#menu-sort").on(
      {
        change: function () {
          if (
            $(this)
              .attr("id")
              .match(/btn-sort-(\w+)/)
          ) {
            WBDB.DisplaySort = RegExp.$1;
            WBDB.deck.update();
          }
        },
      },
      "a"
    );

    $("#tag_toggles").on("click", "button", function (event) {
      var button = $(this);
      if (!event.shiftKey) {
        $("#tag_toggles button").each(function (index, elt) {
          if ($(elt).text() != button.text()) $(elt).removeClass("active");
        });
      }
      setTimeout(filter_decks, 0);
    });
    update_tag_toggles();

    // Selects a decklist with its checkbox
    $("a.deck-list-group-item :checkbox").change(function () {
      let deck = $(`#deck_${$(this).val()}`);
      if (this.checked) {
        lastClickedDeck = deck;
        select_deck(deck);
      } else {
        deselect_deck(deck);
      }
    });
    // Ensures the checkbox isn't blocked by the decklist-expanding event
    $("body").on("click", "a.deck-list-group-item :checkbox", function (event) {
      event.stopPropagation();
    });

    // Expands a decklist by clicking anywhere else on it
    $("body").on("click", "a.deck-list-group-item", function () {
      lastClickedDeck = this;
      show_deck();
    });
    // Close a deck by clicking on its exit button while its expanded
    $("body").on(
      "click",
      "a.deck-list-group-item #close_deck",
      function (event) {
        hide_deck();
        event.stopPropagation();
      }
    );
    // Expand/close a decklist with the keyboard
    $(".decks").keydown(function (event) {
      if (event.which == 27) {
        // Escape
        hide_deck();
      }
      if (event.which == 13) {
        // Enter
        show_deck();
      }
      return false;
    });

    // On load, reset all decklists with checked checkboxes as selected
    $("a.deck-list-group-item :checkbox").each(function () {
      if ($(this).is(":checked")) select_deck($(`#deck_${$(this).val()}`));
    });
  });

  function select_deck(obj) {
    obj.addClass("selected");
    obj.find(":checkbox").prop("checked", true);
  }

  function deselect_deck(obj) {
    obj.removeClass("selected");
    obj.find(":checkbox").prop("checked", false);
  }

  function select_all_visible() {
    $("a.deck-list-group-item").each(function () {
      if ($(this).is(":visible")) {
        select_deck($(this));
      }
    });
  }

  function deselect_all() {
    $("a.deck-list-group-item").each(function () {
      deselect_deck($(this));
    });
  }

  function decks_upload_all() {
    $("#archiveModal").modal("show");
  }

  function do_diff(uuids) {
    if (uuids.length < 2) return;

    var contents = [];
    var names = [];
    for (var decknum = 0; decknum < uuids.length; decknum++) {
      var deck = _.find(Decks, function (adeck) {
        return adeck.uuid == uuids[decknum];
      });
      var hash = {};
      for (var slotnum = 0; slotnum < deck.cards.length; slotnum++) {
        var slot = deck.cards[slotnum];
        hash[slot.card_code] = slot.qty;
      }
      contents.push(hash);
      names.push(deck.name);
    }

    var diff = WBDB.diff.compute_simple(contents);
    var listings = diff[0];
    var intersect = diff[1];

    var container = $("#diff_content");
    container.empty();
    container.append("<h4>Cards in all decks</h4>");
    var list = $("<ul></ul>").appendTo(container);
    var cards = $.map(intersect, function (qty, card_code) {
      var card = WBDB.data.cards.findById(card_code);
      if (card) return { title: card.title, qty: qty };
    }).sort(function (a, b) {
      return a.title.localeCompare(b.title);
    });
    $.each(cards, function (index, card) {
      list.append("<li>" + card.title + " x" + card.qty + "</li>");
    });

    for (var i = 0; i < listings.length; i++) {
      container.append("<h4>Cards only in <b>" + names[i] + "</b></h4>");
      list = $("<ul></ul>").appendTo(container);
      cards = $.map(listings[i], function (qty, card_code) {
        var card = WBDB.data.cards.findById(card_code);
        if (card) return { title: card.title, qty: qty };
      }).sort(function (a, b) {
        return a.title.localeCompare(b.title);
      });
      $.each(cards, function (index, card) {
        list.append("<li>" + card.title + " x" + card.qty + "</li>");
      });
    }
    $("#diffModal").modal("show");
  }

  function do_diff_collection(uuids) {
    if (uuids.length < 2) return;
    var decks;
    decks = [];

    var ensembles;
    ensembles = [];
    var lengths;
    lengths = [];
    for (var decknum = 0; decknum < uuids.length; decknum++) {
      var deck = _.find(Decks, function (adeck) {
        return adeck.uuid == uuids[decknum];
      });
      decks.push(deck);
      var cards = [];
      for (var slotnum = 0; slotnum < deck.cards.length; slotnum++) {
        var slot = deck.cards[slotnum];
        for (var copynum = 0; copynum < slot.qty; copynum++) {
          cards.push(slot.card_code);
        }
      }
      ensembles.push(cards);
      lengths.push(cards.length);
    }

    var imax = 0;
    for (let i = 0; i < lengths.length; i++) {
      if (lengths[imax] < lengths[i]) imax = i;
    }
    var collection = ensembles.splice(imax, 1);
    var rest = [];
    for (let i = 0; i < ensembles.length; i++) {
      rest = rest.concat(ensembles[i]);
    }
    ensembles = [collection[0], rest];
    var names = [decks[imax].name, "The rest"];

    var conjunction = [];
    for (let i = 0; i < ensembles[0].length; i++) {
      var code = ensembles[0][i];
      var indexes = [i];
      for (let j = 1; j < ensembles.length; j++) {
        var index = ensembles[j].indexOf(code);
        if (index > -1) indexes.push(index);
        else break;
      }
      if (indexes.length === ensembles.length) {
        conjunction.push(code);
        for (let j = 0; j < indexes.length; j++) {
          ensembles[j].splice(indexes[j], 1);
        }
        i--;
      }
    }

    var listings = [];
    for (var i = 0; i < ensembles.length; i++) {
      listings[i] = array_count(ensembles[i]);
    }
    var intersect = array_count(conjunction);

    var container = $("#diff_content");
    container.empty();
    container.append("<h4>Cards in all decks</h4>");
    var list = $("<ul></ul>").appendTo(container);
    $.each(intersect, function (card_code, qty) {
      var card = WBDB.data.cards.findById(card_code);
      if (card) list.append("<li>" + card.title + " x" + qty + "</li>");
    });

    for (let i = 0; i < listings.length; i++) {
      container.append("<h4>Cards only in <b>" + names[i] + "</b></h4>");
      list = $("<ul></ul>").appendTo(container);
      $.each(listings[i], function (card_code, qty) {
        var card = WBDB.data.cards.findById(card_code);
        if (card) list.append("<li>" + card.title + " x" + qty + "</li>");
      });
    }
    $("#diffModal").modal("show");
  }

  // takes an array of strings and returns an object where each string of the array
  // is a key of the object and the value is the number of occurences of the string in the array
  function array_count(list) {
    var obj = {};
    list = list.sort();
    for (var i = 0; i < list.length; ) {
      for (var j = i + 1; j < list.length; j++) {
        if (list[i] !== list[j]) break;
      }
      obj[list[i]] = j - i;
      i = j;
    }
    return obj;
  }

  function filter_decks() {
    var buttons = $("#tag_toggles button.active");
    var list_id = [];
    buttons.each(function (index, button) {
      list_id = list_id.concat($(button).data("deck_uuid").split(/\s+/));
    });
    list_id = list_id.filter(function (itm, i, a) {
      return i == a.indexOf(itm);
    });
    $("#decks a.deck-list-group-item").each(function (index, elt) {
      deselect_deck($(elt));
      var uuid = $(elt).attr("id").replace("deck_", "");
      if (list_id.length && list_id.indexOf(uuid) === -1) $(elt).hide();
      else $(elt).show();
    });
  }

  function do_action_deck(event) {
    event.stopPropagation();
    if (event.shiftKey || event.altKey || event.ctrlKey || event.metaKey)
      return;
    var deck_uuid = $(this).closest(".deck-list-group-item").data("uuid");
    var deck = (WBDB.SelectedDeck = _.find(Decks, function (deck) {
      return deck.uuid == deck_uuid;
    }));
    if (!deck) return;
    var action_id = $(this).attr("id");
    if (!action_id) return;
    switch (action_id) {
      case "btn-view":
        location.href = Routing.generate("deck_view", {
          deck_uuid: deck.uuid,
          _locale: WBDB.locale,
        });
        break;
      case "btn-edit":
        location.href = Routing.generate("deck_edit", {
          deck_uuid: deck.uuid,
          _locale: WBDB.locale,
        });
        break;
      case "btn-publish":
        show_publish_deck_form(deck.uuid, deck.name, deck.description);
        break;
      case "btn-duplicate":
        location.href = Routing.generate("deck_duplicate", {
          deck_uuid: deck.uuid,
          _locale: WBDB.locale,
        });
        break;
      case "btn-delete":
        confirm_delete(deck);
        break;
      case "btn-download-text":
        location.href = Routing.generate("deck_export_text", {
          deck_uuid: deck.uuid,
          _locale: WBDB.locale,
        });
        break;
      case "btn-export-tts":
        WBDB.exporter.tts(deck);
        break;
      case "btn-export-bbcode":
        WBDB.exporter.bbcode(deck);
        break;
      case "btn-export-markdown":
        WBDB.exporter.markdown(deck);
        break;
      case "btn-export-plaintext":
        WBDB.exporter.plaintext(deck);
        break;
    }
    return false;
  }

  function do_action_selection() {
    var action_id = $(this).attr("id");
    var uuids = [];
    $("#decks a.deck-list-group-item.selected").each(function (index, elt) {
      uuids.push($(elt).data("uuid"));
    });
    if (!action_id || !uuids.length) return;
    switch (action_id) {
      case "btn-compare":
        do_diff(uuids);
        break;
      case "btn-compare-collection":
        do_diff_collection(uuids);
        break;
      case "btn-tag-add":
        tag_add(uuids);
        break;
      case "btn-tag-remove-one":
        tag_remove(uuids);
        break;
      case "btn-tag-remove-all":
        tag_clear(uuids);
        break;
      case "btn-delete-selected":
        confirm_delete_all(uuids);
        break;
    }
    return;
  }

  function do_action_sort(event) {
    event.stopPropagation();
    var action_id = $(this).attr("id");
    if (!action_id) return;
    switch (action_id) {
      case "btn-sort-update":
        sort_list("date_update");
        break;
      case "btn-sort-creation":
        sort_list("date_creation");
        break;
      case "btn-sort-identity":
        sort_list("identity_title");
        break;
      case "btn-sort-faction":
        sort_list("faction_code");
        break;
      case "btn-sort-lastpack":
        sort_list("lastpack_global_position");
        break;
      case "btn-sort-name":
        sort_list("name");
        break;
    }
    return false;
  }

  function sort_list(type) {
    var container = $("#decks");
    var current_sort = container.data("sort-type");
    var current_order = container.data("sort-order");
    var order = current_order || 1;
    if (current_sort && current_sort == type) {
      order = -order;
    }
    container.data("sort-type", type);
    container.data("sort-order", order);
    var sorted_list_id = Decks.sort(function (a, b) {
      return order * a[type].localeCompare(b[type]);
    }).map(function (deck) {
      return deck.uuid;
    });
    var deck_elt = $("#deck_" + sorted_list_id.shift());

    container.prepend(deck_elt);
    sorted_list_id.forEach(function (deck_uuid) {
      deck_elt = $("#deck_" + deck_uuid).insertAfter(deck_elt);
    });
  }

  function update_tag_toggles() {
    // tags is an object where key is tag and value is array of deck uuids
    var tag_dict = Decks.reduce(function (p, c) {
      c.tags.forEach(function (t) {
        if (!p[t]) p[t] = [];
        p[t].push(c.uuid);
      });
      return p;
    }, {});
    var tags = [];
    for (var tag in tag_dict) {
      tags.push(tag);
    }
    var container = $("#tag_toggles").empty();
    tags.sort().forEach(function (tag) {
      $(
        '<button type="button" class="btn btn-default btn-xs" data-toggle="button">' +
          tag +
          "</button>"
      )
        .data("deck_uuid", tag_dict[tag].join(" "))
        .appendTo(container);
    });
  }

  function set_tags(uuid, tags) {
    var elt = $("#deck_" + uuid);
    var div = elt.find(".deck-list-tags").empty();
    tags.forEach(function (tag) {
      div.append(
        $(
          '<span class="label label-default tag-' + tag + '">' + tag + "</span>"
        )
      );
    });

    for (var i = 0; i < Decks.length; i++) {
      if (Decks[i].uuid == uuid) {
        Decks[i].tags = tags;
        break;
      }
    }

    update_tag_toggles();
  }

  function tag_add(uuids) {
    $("#tag_add_uuids").val(uuids);
    $("#tagAddModal").modal("show");
    setTimeout(function () {
      $("#tag_add_tags").focus();
    }, 500);
  }

  // TODO:
  window.tag_add_process = function tag_add_process(event) {
    event.preventDefault();
    var uuids = $("#tag_add_uuids").val().split(/,/);
    var tags = $("#tag_add_tags").val().split(/\s+/);
    if (!uuids.length || !tags.length) return;
    sendPostRequest("tag_add", uuids, tags);
  };

  function tag_remove(uuids) {
    $("#tag_remove_uuids").val(uuids);
    $("#tagRemoveModal").modal("show");
    setTimeout(function () {
      $("#tag_remove_tags").focus();
    }, 500);
  }

  // TODO:
  window.tag_remove_process = function tag_remove_process(event) {
    event.preventDefault();
    var uuids = $("#tag_remove_uuids").val().split(/,/);
    var tags = $("#tag_remove_tags").val().split(/\s+/);
    if (!uuids.length || !tags.length) return;
    sendPostRequest("tag_remove", uuids, tags);
  };

  function tag_clear(uuids) {
    $("#tag_clear_uuids").val(uuids);
    $("#tagClearModal").modal("show");
  }

  // TODO:
  window.tag_clear_process = function tag_clear_process(event) {
    event.preventDefault();
    var uuids = $("#tag_clear_uuids").val().split(/,/);
    if (!uuids.length) return;
    sendPostRequest("tag_clear", uuids);
  };

  function confirm_delete(deck) {
    $("#delete-deck-name").text(deck.name);
    $("#delete-deck-uuid").val(deck.uuid);
    $("#deleteModal").modal("show");
  }

  function confirm_delete_all(uuids) {
    $("#delete-deck-list-uuid").val(uuids.join(","));
    $("#deleteListModal").modal("show");
  }

  function hide_deck() {
    $("#deck").hide();
    $("#close_deck").remove();
  }

  function show_deck() {
    var deck_uuid = $(lastClickedDeck).data("uuid");
    var deck = _.find(Decks, function (deck) {
      return deck.uuid === deck_uuid;
    });
    if (!deck) return;

    var container = $("#deck_" + deck.uuid);
    $("#deck").appendTo(container);
    $("#deck").show();

    $("#close_deck").remove();
    $(
      '<button type="button" class="close" id="close_deck"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>'
    ).prependTo(container);

    $(this).closest("tr").siblings().removeClass("active");
    $(this).closest("tr").addClass("active");

    WBDB.data.cards.update({}, { indeck: 0 });
    for (var i = 0; i < deck.cards.length; i++) {
      var slot = deck.cards[i];
      WBDB.data.cards.updateById(slot.card_code, {
        indeck: parseInt(slot.qty, 10),
      });
    }
    $("#deck-name").text(deck.name);
    $("#btn-view").attr(
      "href",
      Routing.generate("deck_view", {
        deck_uuid: deck.uuid,
        _locale: WBDB.locale,
      })
    );
    $("#btn-edit").attr(
      "href",
      Routing.generate("deck_edit", {
        deck_uuid: deck.uuid,
        _locale: WBDB.locale,
      })
    );

    WBDB.deck.update();
    // convert date from UTC to local
    $("#date_creation").html(
      "Creation: " + moment(deck.date_creation).format("LLLL")
    );
    $("#date_update").html(
      "Last update: " + moment(deck.date_update).format("LLLL")
    );
    $("#btn-publish").prop("disabled", deck.problem || deck.unsaved);
  }

  function sendPostRequest(route, uuids, tags = null) {
    const data = { uuids };
    if (tags) {
      data.tags = tags;
    }
    $.ajax(Routing.generate(route), {
      type: "POST",
      data,
      dataType: "json",
      success: function (data, textStatus, jqXHR) {
        var response = jqXHR.responseJSON;
        if (!response.success) {
          alert("An error occured while updating the tags.");
          return;
        }
        $.each(response.tags, function (uuid, tags) {
          set_tags(uuid, tags);
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
        alert("An error occured while updating the tags.");
      },
    });
  }
}
