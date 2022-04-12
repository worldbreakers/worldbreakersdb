/* global $, WBDB */
export function enhanceBuildPage() {
  $(function () {
    // Shows a preview of IDs the user mouses over
    $(".list-group").on("mouseenter touchstart", "a", function () {
      let card_code = $(this).data("code");
      let card = WBDB.data.cards.findById(card_code);
      $("#cardimg")
        .prop("src", card.images.large[0])
        .attr("data-code", card_code)
        .show();
    });

    // Check if the preview is showing a card that is currently visible
    function checkPreview() {
      let id = $(`.identity[data-code="${$("#cardimg").attr("data-code")}"]`);
      if (id.hasClass("hidden-format") || id.hasClass("hidden-misc")) {
        $("#cardimg").hide();
      }
    }

    // Force the preview to follow the scroll position of the user
    $(window).scroll(function () {
      let scrollingDiv = $("#initIdentity");
      if (!scrollingDiv.is(":visible")) return;
      let y = $(this).scrollTop(),
        maxY = $("footer").offset().top,
        scrollHeight = scrollingDiv.height(),
        scrollTop = $(window).scrollTop();

      if (y < maxY - scrollHeight - 200) {
        scrollingDiv.stop().animate({ marginTop: scrollTop + "px" }, "slow");
      }
    });

    // Update the ID list when any other parameter is changed
    function updateMisc() {
      let faction = $("#faction-filter").val();
      let search = $("#title-filter")
        .val()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      $(".identity").each(function () {
        if (
          (faction !== "all" && !$(this).hasClass("faction-" + faction)) ||
          !$(this)
            .find(".name")
            .html()
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .includes(search)
        ) {
          $(this).addClass("hidden-misc");
          return;
        }
        $(this).removeClass("hidden-misc");
      });
    }

    // Filter on faction selected
    $("#faction-filter").change(function () {
      updateMisc();
      checkPreview();
    });

    // Filter on search updated
    $("#title-filter").on("input", function () {
      updateMisc();
      checkPreview();
    });

    // Filter on page refresh
    updateMisc();
  });
}
