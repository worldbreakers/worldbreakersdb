(function (fuzzy_search, $) {
  var types = ["event", "follower", "location", "worldbreaker"];
  // takes a card name and fuzzy-searches it in the card db
  // the input can include a qty indicator like 3x
  // returns an array of objects Card with an additional key "qty"
  fuzzy_search.lookup = function (input, max_results) {
    if (max_results == null) max_results = 5;
    var qty = null,
      name = input
        .replace(/\(.*\)/, "")
        .replace(/[^0-9\.\-A-Za-z\u00C0-\u024F]+/g, " ")
        .replace(/\s+/, " ")
        .trim()
        .toLowerCase();
    if (name.match(/^(\d+)x?\s*(.*)/)) {
      qty = parseInt(RegExp.$1, 10);
      name = RegExp.$2;
    } else if (name.match(/(.*?)\s*x?(\d+)$/)) {
      qty = parseInt(RegExp.$2, 10);
      name = RegExp.$1;
    }
    if (name == "" || name == "cards") return;
    if (types.indexOf(name) > -1) return;

    var options = [];
    var query = NRDB.data.cards.find({ token: new RegExp(name, "i") });
    if (query.length) {
      query.forEach(function (card) {
        options.push(card);
      });
      options = options.sort(function (a, b) {
        if (a.title == b.title) {
          return a.code < b.code;
        }
        return a.title.length - b.title.length;
      });
    } else if (typeof String.prototype.score === "function") {
      var matches = [];
      NRDB.data.cards.find().forEach(function (card) {
        matches.push({
          score: card.token.score(name, 0.9),
          card: card,
        });
      });
      matches.sort(function (a, b) {
        if (a.score == b.score && a.card.title == b.card.title) {
          return a.card.code < b.card.code;
        }
        return a.score > b.score ? -1 : a.score < b.score ? 1 : 0;
      });
      var bestScore = matches[0].score;
      for (
        var i = 0;
        i < max_results &&
        matches[i].score > 0.4 &&
        matches[i].score > bestScore * 0.9;
        i++
      ) {
        options.push(matches[i].card);
      }
    }
    return { qty: qty, cards: options };
  };

  $(document).on("data.app", function () {
    NRDB.data.cards.find().forEach(function (card) {
      NRDB.data.cards.updateById(card.code, {
        token: card.title
          .replace(/[^0-9\.\-A-Za-z\u00C0-\u017F]+/g, " ")
          .trim()
          .toLowerCase(),
      });
    });
  });
})((NRDB.fuzzy_search = {}), jQuery);
