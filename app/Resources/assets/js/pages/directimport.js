/* global $ */
import { data as Data } from "../wbdb.data.js";
import { lookup } from "../fuzzy_search.js";

export function enhanceDirectImportPage() {
  $(document).on("data.app", function () {
    $("#btn-import").prop("disabled", false);
  });

  $(function () {
    $("#analyzed").on(
      {
        click: click_option,
      },
      "ul.dropdown-menu a"
    );
    $("#analyzed").on(
      {
        click: click_trash,
      },
      "a.glyphicon-trash"
    );
  });

  function click_trash() {
    $(this).closest("li.list-group-item").remove();
    update_stats();
  }

  // TODO:
  window.do_import = function do_import() {
    $("#analyzed").empty();
    var content = $('textarea[name="content"]').val();
    var lines = content.split(/[\r\n]+/);
    for (var i = 0; i < lines.length; i++) {
      var a = import_one_line(lines[i], i);
      if (!a) continue;
      $("#analyzed").append(
        '<li class="list-group-item">' +
          a +
          '<a class="pull-right glyphicon glyphicon-trash"></a></li>'
      );
    }
    update_stats();
  };

  function import_one_line(line, lineNumber) {
    var result = lookup(line);
    if (!result) return;
    var options = result.cards,
      qty = result.qty;
    var qty_text = "",
      qty_int = qty;
    if (qty == null) {
      options = $.grep(options, function (card) {
        return card.type_code == "identity";
      });
      qty_int = 1;
    } else {
      qty_text = qty + "x ";
    }

    if (options.length == 0) {
      if (qty == null) return;
      return "<i>No match for " + name + "</i>";
    } else if (options.length == 1) {
      return (
        '<input type="hidden" name="' +
        lineNumber +
        '" value="' +
        options[0].code +
        ":" +
        qty_int +
        '">' +
        qty_text +
        '<a class="card" data-code="' +
        options[0].code +
        '" href="#">' +
        options[0].title +
        " </a>"
      );
    } else {
      var text =
        '<input type="hidden" name="' +
        lineNumber +
        '" value="' +
        options[0].code +
        ":" +
        qty_int +
        '">' +
        qty_text +
        '<a class="card dropdown-toggle text-warning" data-toggle="dropdown" data-code="' +
        options[0].code +
        '" href="#">' +
        options[0].title +
        ' <span class="caret"></span></a>';
      text += '<ul class="dropdown-menu">';
      $.each(options, function (index, option) {
        text +=
          '<li><a href="#" data-code="' +
          option.code +
          '">' +
          option.title +
          "</a></li>";
      });
      text += "</ul>";
      return text;
    }
  }
  function click_option() {
    var name = $(this).text();
    var code = $(this).data("code");
    var input = $(this)
      .closest("li.list-group-item")
      .find('input[type="hidden"]');
    input.val(input.val().replace(/^\d+/, code));
    $(this)
      .closest("li.list-group-item")
      .find("a.card")
      .html(name + ' <span class="caret"></span>')
      .data("code", code);
    update_stats();
  }
  function update_stats() {
    var deck = {},
      size = 0,
      types = {};
    $('#analyzed input[type="hidden"]').each(function (index, element) {
      var card = $(element).val().split(":");
      var code = card[0],
        qty = parseInt(card[1], 10);
      deck[code] = qty;
      var record = Data.cards.findById(code);
      types[record.type.name] = types[record.type.name] || 0;
      types[record.type.name] += qty;
    });
    var html = "";
    $.each(types, function (key, value) {
      if (key != "Identity") {
        size += value;
        html += value + " " + key + "s.<br>";
      }
    });
    html = size + " Cards.<br>" + html;
    $("#stats").html(html);
    if ($("#analyzed li").length > 0) {
      $("#btn-save").prop("disabled", false);
    } else {
      $("#btn-save").prop("disabled", true);
    }
  }

  // TODO:
  window.do_save = function do_save() {
    var deck = {};
    $('#analyzed input[type="hidden"]').each(function (index, element) {
      var card = $(element).val().split(":");
      var code = card[0],
        qty = parseInt(card[1], 10);
      deck[code] = qty;
    });
    $('input[name="content"]').val(JSON.stringify(deck));
  };
}
