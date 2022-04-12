export const user = {};

user.params = {};

user.deferred = $.Deferred().always(function () {
  if (user.data.is_authenticated) {
    user.update();
  } else {
    user.anonymous();
  }
  user.always();
});

user.query = function () {
  $.ajax(Routing.generate("user_info", user.params), {
    cache: false,
    dataType: "json",
    success: function (data, textStatus, jqXHR) {
      user.data = data;
      user.deferred.resolve();
    },
    error: function (jqXHR, textStatus, errorThrown) {
      user.deferred.resolve();
    },
  });
};

user.anonymous = function () {
  $("#login").append(
    '<ul class="dropdown-menu"><li><a href="' +
      Routing.generate("fos_user_security_login") +
      '">Login or Register</a></li></ul>'
  );
};

user.update = function () {
  var unchecked_activity_label = user.data.unchecked_activity
    ? '<span class="label label-success label-as-badge">' +
      user.data.unchecked_activity +
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
          user_id: user.data.id,
          user_name: user.data.name,
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
};

user.always = function () {
  $(document).trigger("user.app");
};

user.showAds = function () {};

user.promise = new Promise(function (resolve, reject) {
  $(document).on("user.app", resolve);
});
