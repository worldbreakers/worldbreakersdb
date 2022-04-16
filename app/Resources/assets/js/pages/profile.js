/* global $ */
import * as user from "../user.js";

export function enhanceProfilePage(userId) {
  $(function () {
    $.when(user.deferred).then(function () {
      if (user.data.is_authenticated) {
        if (user.data.following.indexOf(userId) > -1) {
          $("#unfollow").show();
        } else {
          $("#follow").show();
        }
      }
    });

    $("#unfollow")
      .mouseover(function () {
        $(this)
          .addClass("btn-danger")
          .removeClass("btn-info")
          .html(
            '<span class="glyphicon glyphicon glyphicon-eye-close"></span> Unfollow'
          );
      })
      .mouseout(function () {
        $(this)
          .addClass("btn-info")
          .removeClass("btn-danger")
          .html(
            '<span class="glyphicon glyphicon glyphicon-eye-open"></span> Following'
          );
      });

    $("a.btn").click(function (event) {
      event.preventDefault();
      var href = $(this).attr("href");
      setTimeout(function () {
        location.href = href;
      }, 100);
    });
  });
}
