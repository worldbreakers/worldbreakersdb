function initialize_publish_deck_form_typeahead() {
  var converter = new Markdown.Converter();
  $("#publish-decklist-description-preview").html(
    converter.makeHtml($("#publish-decklist-description").val())
  );
  $("#publish-decklist-description").on("keyup", function () {
    $("#publish-decklist-description-preview").html(
      converter.makeHtml($("#publish-decklist-description").val())
    );
  });

  $("#publish-decklist-description").textcomplete([
    {
      match: /\B#([\-+\w]*)$/,
      search: function (term, callback) {
        var regexp = new RegExp("\\b" + term, "i");
        // In the Notes section, we want to allow completion for *all* cards regardless of side.
        callback(
          NRDB.data.cards.find({
            title: regexp,
          })
        );
      },
      template: function (value) {
        return value.title + " (" + value.pack.name + ")";
      },
      replace: function (value) {
        return (
          "[" +
          value.title +
          "](" +
          Routing.generate("cards_zoom", { card_code: value.code }) +
          ")"
        );
      },
      index: 1,
    },
    {
      match: /\$([\-+\w]*)$/,
      search: function (term, callback) {
        var regexp = new RegExp("^" + term);
        callback(
          $.grep(
            ["mythium", "earth", "moon", "stars", "void"],
            function (symbol) {
              return regexp.test(symbol);
            }
          )
        );
      },
      template: function (value) {
        return value;
      },
      replace: function (value) {
        return (
          '<svg class="icon-wb icon-' +
          value +
          '"><use xlink:href="#icon-' +
          value +
          '"></use></svg>'
        );
      },
      index: 1,
    },
  ]);
}

function show_publish_deck_form(deck_uuid, deck_name, deck_description) {
  $("#publish-form-warning").remove();
  $("#btn-publish-submit").text("Checking...").prop("disabled", true);
  $.ajax(Routing.generate("deck_publish", { deck_uuid: deck_uuid }), {
    success: function (response) {
      var type = response.allowed ? "warning" : "danger";
      if (response.message) {
        $("#publish-decklist-form").prepend(
          '<div id="publish-form-warning" class="alert alert-' +
            type +
            '">' +
            response.message +
            "</div>"
        );
      }
      if (response.allowed) {
        $("#btn-publish-submit").text("Go").prop("disabled", false);
      }

      initialize_publish_deck_form_typeahead();
    },
    error: function (jqXHR, textStatus, errorThrown) {
      console.log(
        "[" + moment().format("YYYY-MM-DD HH:mm:ss") + "] Error on " + this.url,
        textStatus,
        errorThrown
      );
      $("#publish-decklist-form").prepend(
        '<div id="publish-form-alert" class="alert alert-danger">' +
          jqXHR.responseText +
          "</div>"
      );
    },
  });
  $("#publish-deck-uuid").val(deck_uuid);
  $("#publish-decklist-name").val(deck_name);
  $("#publish-decklist-description").val(deck_description);
  $("#publishModal").modal("show");
}
