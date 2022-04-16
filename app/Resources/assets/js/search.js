/* global _ */
import { data as Data } from "./wbdb.data.js";

export function findMatches(cards) {
  return (q, cb) => {
    if (q.match(/^\w:/)) {
      return;
    }

    var regexp = new RegExp(q, "i");
    var matchingCards = _.filter(cards, function (card) {
      return regexp.test(_.deburr(card.title).toLowerCase().trim());
    });
    cb(_.sortBy(matchingCards, "title"));
  };
}

export function latestCards(cards = null) {
  if (cards === null) {
    cards = Data.cards.find();
  }
  var latestCardsByTitle = {};
  for (var card of cards) {
    var latestCard = latestCardsByTitle[card.title];
    if (!latestCard || card.code > latestCard.code) {
      latestCardsByTitle[card.title] = card;
    }
  }

  return cards.filter(function (value) {
    return value.code == latestCardsByTitle[value.title].code;
  });
}
