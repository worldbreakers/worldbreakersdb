/* global $, _ */

// all the settings, initialized with their default value
var cache = {
  "display-columns": 1,
  "buttons-behavior": "cumulative",
  "sort-order": "type",
};

export function load() {
  // first give them the default values
  _.forIn(cache, function (defaultValue, key) {
    $("[name=" + key + "]").each(function (index, element) {
      var $element = $(element);
      switch ($element.attr("type")) {
        case "checkbox":
          $element.prop("checked", defaultValue);
          break;
        case "radio":
          $element.prop("checked", $element.val() == defaultValue);
          break;
        default:
          $element.val(defaultValue);
          break;
      }
    });
  });

  // then overwrite those default values with the persisted values
  $("[data-persistence]")
    .on("persistence:change", function (event, value) {
      var key = $(this).attr("name");
      cache[key] = value;
    })
    .persistence("load")
    .then(function () {
      $(document).trigger("settings.app");
    });
}

export function getItem(key) {
  return cache[key];
}

export const promise = new Promise(function (resolve) {
  $(document).on("settings.app", resolve);
});
