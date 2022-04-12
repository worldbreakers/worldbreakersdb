/* global $, moment, Markdown, Routing, WBDB */
export function show_publish_deck_form(deck_uuid, deck_name, deck_description) {
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

  WBDB.ui.enhanceTextarea("#publish-decklist-description");
}
