/* global _, $, Routing */
import * as ui from "../ui.js";
import * as user from "../user.js";

export function enhanceDecklistsPage() {
  Promise.all([user.promise, ui.promise]).then(function () {
    if (user.data.is_moderator) {
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
