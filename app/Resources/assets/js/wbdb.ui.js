export const ui = {};

ui.showBanner = function showBanner(message, type) {
  $('<div class="alert alert-' + (type || "info") + '">')
    .html(message)
    .prependTo($("#wrapper>.container:first-of-type"));
};

ui.loadImage = function loadImage(image) {
  var image = this,
    src = image.getAttribute("data-src");
  return new Promise(function (resolve, reject) {
    image.addEventListener("load", resolve);
    image.removeAttribute("data-src");
    image.setAttribute("src", src);
  });
};

ui.loadAllImages = function loadAllImages() {
  return Promise.all($("img[data-src]").map(ui.loadImage).get());
};

ui.manageImages = function manageImages() {
  var images = $("img[data-src]");
  if (!images.length) {
    return;
  }

  ui.loadAllImages();
};

ui.promise = new Promise($);
