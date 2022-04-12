/* global $, Routing, WBDB */
export const ui = {
  showBanner(message, type) {
    $('<div class="alert alert-' + (type || "info") + '">')
      .html(message)
      .prependTo($("#wrapper>.container:first-of-type"));
  },

  loadImage() {
    var src = this.getAttribute("data-src");

    return new Promise((resolve) => {
      this.addEventListener("load", resolve);
      this.removeAttribute("data-src");
      this.setAttribute("src", src);
    });
  },

  loadAllImages() {
    return Promise.all($("img[data-src]").map(ui.loadImage).get());
  },

  manageImages() {
    var images = $("img[data-src]");
    if (!images.length) {
      return;
    }

    ui.loadAllImages();
  },

  enhanceTextarea(element, showPackName = false) {
    $(element).textcomplete([
      {
        match: /\B#([-+\w]*)$/,
        search: function (term, callback) {
          var regexp = new RegExp("\\b" + term, "i");
          callback(
            WBDB.data.cards.find({
              title: regexp,
            })
          );
        },
        template: function (value) {
          return (
            value.title + (showPackName ? " (" + value.pack.name + ")" : "")
          );
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
        match: /\$([-+\w]*)$/,
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
  },

  promise: new Promise($),
};
