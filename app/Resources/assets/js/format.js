export function type(card) {
  var type = '<span class="card-type">' + card.type.name + "</span>";
  if (card.keywords)
    type += '<span class="card-keywords">: ' + card.keywords + "</span>";

  if (
    card.type_code == "event" ||
    card.type_code == "location" ||
    card.type_code == "follower"
  ) {
    type +=
      " &middot; <span>" +
      cost(card) +
      '<svg class="icon-wb icon-mythium"><use xlink:href="#icon-mythium"></use></svg><span class="icon-fallback">Mythium</span>' +
      "</span>";
  }

  return type;
}

export function text(card) {
  var text = card.text || "";

  text = text.replace(
    /\[mythium\]/g,
    '<svg class="icon-wb icon-mythium"><use xlink:href="#icon-mythium"></use></svg><span class="icon-fallback">Mythium</span>'
  );
  text = text.replace(
    /\[earth\]/g,
    '<svg class="icon-wb icon-earth"><use xlink:href="#icon-earth"></use></svg><span class="icon-fallback">Earth Guild</span>'
  );
  text = text.replace(
    /\[moon\]/g,
    '<svg class="icon-wb icon-moon"><use xlink:href="#icon-moon"></use></svg><span class="icon-fallback">Moon Guild</span>'
  );
  text = text.replace(
    /\[stars\]/g,
    '<svg class="icon-wb icon-stars"><use xlink:href="#icon-stars"></use></svg><span class="icon-fallback">Stars Guild</span>'
  );
  text = text.replace(
    /\[void\]/g,
    '<svg class="icon-wb icon-void"><use xlink:href="#icon-void"></use></svg><span class="icon-fallback">Void Guild</span>'
  );
  text = text.replace(
    /\[historic\]/g,
    '<svg class="icon-wb icon-historic"><use xlink:href="#icon-historic"></use></svg><span class="icon-fallback">Historic Flavor</span>'
  );

  text = text.split("\n").join("</p><p>");

  return "<p>" + text + "</p>";
}

function cost(card) {
  return card.cost === undefined ? "X" : card.cost;
}
