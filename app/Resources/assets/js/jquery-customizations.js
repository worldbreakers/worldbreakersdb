/* global $ */
window.$.fn.ignore = function (sel) {
  return this.clone().find(sel).remove().end();
};


$(function () {
  $('[data-toggle="tooltip"]').tooltip();
});

/* my version of button.js, overriding twitter's */

(function ($) {
  "use strict";

  // BUTTON PUBLIC CLASS DEFINITION
  // ==============================

  var Button = function (element, options) {
    this.$element = $(element);
    this.options = $.extend({}, Button.DEFAULTS, options);
    this.isLoading = false;
  };

  Button.DEFAULTS = {
    loadingText: "loading...",
  };

  Button.prototype.setState = function (state) {
    var d = "disabled";
    var $el = this.$element;
    var val = $el.is("input") ? "val" : "html";
    var data = $el.data();

    state = state + "Text";

    if (!data.resetText) $el.data("resetText", $el[val]());

    $el[val](data[state] || this.options[state]);

    // push to event loop to allow forms to submit
    setTimeout(
      $.proxy(function () {
        if (state == "loadingText") {
          this.isLoading = true;
          $el.addClass(d).attr(d, d);
        } else if (this.isLoading) {
          this.isLoading = false;
          $el.removeClass(d).removeAttr(d);
        }
      }, this),
      0
    );
  };

  Button.prototype.toggle = function () {
    var changed = true;
    var $parent = this.$element.closest('[data-toggle="buttons"]');

    if ($parent.length) {
      var $input = this.$element.find("input");
      if ($input.prop("type") == "radio") {
        if ($input.prop("checked") && this.$element.hasClass("active"))
          changed = false;
        else $parent.find(".active").removeClass("active");
      }
      if (changed)
        $input
          .prop("checked", !this.$element.hasClass("active"))
          .trigger("change");
    }

    if (changed) this.$element.toggleClass("active");
  };

  Button.prototype.on = function () {
    var changed = true;
    var $parent = this.$element.closest('[data-toggle="buttons"]');

    if ($parent.length) {
      var $input = this.$element.find("input");
      if ($input.prop("type") == "radio") {
        if ($input.prop("checked") && this.$element.hasClass("active"))
          changed = false;
        else $parent.find(".active").removeClass("active");
      }
      if (changed)
        $input
          .prop("checked", !this.$element.hasClass("active"))
          .trigger("change");
    }

    if (changed) this.$element.addClass("active");
  };

  Button.prototype.off = function () {
    var changed = true;
    var $parent = this.$element.closest('[data-toggle="buttons"]');

    if ($parent.length) {
      var $input = this.$element.find("input");
      if ($input.prop("type") == "radio") {
        if ($input.prop("checked") && this.$element.hasClass("active"))
          changed = false;
        else $parent.find(".active").removeClass("active");
      }
      if (changed)
        $input
          .prop("checked", !this.$element.hasClass("active"))
          .trigger("change");
    }

    if (changed) this.$element.removeClass("active");
  };

  // BUTTON PLUGIN DEFINITION
  // ========================

  var old = $.fn.button;

  $.fn.button = function (option, invertOthers) {
    return this.each(function () {
      var $this = $(this);
      var data = $this.data("bs.button");
      var options = typeof option == "object" && option;

      if (!data) $this.data("bs.button", (data = new Button(this, options)));

      switch (option) {
        case "toggle":
          data.toggle();
          break;
        case "off":
          data.off(invertOthers);
          break;
        case "on":
          data.on(invertOthers);
          break;
        default:
          data.setState(option);
          break;
      }
    });
  };

  $.fn.button.Constructor = Button;

  // BUTTON NO CONFLICT
  // ==================

  $.fn.button.noConflict = function () {
    $.fn.button = old;
    return this;
  };
})(window.jQuery);
