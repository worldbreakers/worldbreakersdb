$(document).on('data.app', function() {
  var latestCards = select_only_latest_cards(NRDB.data.cards.find());

  function findMatches(q, cb) {
    if(q.match(/^\w:/)) return;
    var regexp = new RegExp(q, 'i');
    var matchingCards = _.filter(latestCards, function (card) {
      return regexp.test(_.deburr(card.title).toLowerCase().trim());
    });
    cb(_.sortBy(matchingCards, 'title'));
  }

  $('#filter-text').typeahead({
    hint: true,
    highlight: true,
    minLength: 2
  }, {
    name: 'cardnames',
    display: function(card) { return card.title; },
    source: findMatches
  });

  $('#filter-text').on('typeahead:selected typeahead:autocompleted', function(event, card) {
    var line = $(
      '<p class="background-' + card.faction_code +
      '-20" style="padding: 3px 5px;border-radius: 3px;border: 1px solid silver">' +
      '<button type="button" class="close" aria-hidden="true">&times;</button>' +
      '<input type="hidden" name="cards[]" value="' + card.code + '">' +
      card.title + ' (' + card.pack.name + ')</p>'
    );
    line.on({
      click: function(event) { line.remove(); }
    });
    line.insertBefore($('#filter-text'));
    $(event.target).typeahead('val', '');
  });
});

function select_only_latest_cards(matchingCards) {
  var latestCardsByTitle = {};
  for (var card of matchingCards) {
    var latestCard = latestCardsByTitle[card.title];
    if (!latestCard || card.code > latestCard.code) {
      latestCardsByTitle[card.title] = card;
    }
  }
  return matchingCards.filter(function(value, index, arr) {
    return value.code == latestCardsByTitle[value.title].code;
  });
}
