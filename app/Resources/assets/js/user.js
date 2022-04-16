/* global $, Routing, WBDB */
export let data = {};
export const params = {};
export const deferred = $.Deferred().always(function () {
  if (data.is_authenticated) {
    update();
  } else {
    anonymous();
  }
  $(document).trigger("user.app");
});
export const promise = new Promise(function (resolve) {
  $(document).on("user.app", resolve);
});

export function query() {
  $.ajax(Routing.generate("user_info", params), {
    cache: false,
    dataType: "json",
    success: function (userInfoData) {
      data = userInfoData;
      deferred.resolve();
    },
    error: function () {
      deferred.resolve();
    },
  });
}

export function anonymous() {
  $("#login").append(
    '<ul class="dropdown-menu"><li><a href="' +
      Routing.generate("fos_user_security_login") +
      '">Login or Register</a></li></ul>'
  );
}

export function update() {
  var unchecked_activity_label = data.unchecked_activity
    ? '<span class="label label-success label-as-badge">' +
      data.unchecked_activity +
      "</span>"
    : "";
  $("#login a span").after(unchecked_activity_label);
  $("#login")
    .addClass("dropdown")
    .append(
      '<ul class="dropdown-menu">' +
        '<li><a href="' +
        Routing.generate("user_profile", { _locale: WBDB.locale }) +
        '">Edit account</a></li>' +
        '<li><a href="' +
        Routing.generate("user_profile_view", {
          user_id: data.id,
          user_name: data.name,
          _locale: WBDB.locale,
        }) +
        '">Public profile</a></li>' +
        '<li><a href="' +
        Routing.generate("activity_feed", { _locale: WBDB.locale }) +
        '">Activity ' +
        unchecked_activity_label +
        "</a></li>" +
        '<li><a href="' +
        Routing.generate("fos_user_security_logout") +
        '">Log out</a></li>' +
        "</ul>"
    );
}
