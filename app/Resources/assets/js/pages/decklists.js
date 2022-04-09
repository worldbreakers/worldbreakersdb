export function enhanceDecklistsPage() {
  Promise.all([WBDB.user.promise, WBDB.ui.promise]).then(function () {
    if (WBDB.user.data.is_moderator) {
      var $sideNav = $("#side_nav");
      var states = { trashed: "Trashed", restored: "Restored" };
      _.forEach(states, function (label, state) {
        var $item = $("<li>").appendTo($sideNav);
        var $link = $("<a>").appendTo($item);
        $link
          .attr("href", Routing.generate("decklists_list", { type: state }))
          .text(label)
          .addClass("text-danger");
      });
    }
  });
}
