/* global _, WBDB */
export const search = {
    findMatches(cards) {
        return (q, cb) => {
            if (q.match(/^\w:/)) {
                return;
            }

            var regexp = new RegExp(q, "i");
            var matchingCards = _.filter(cards, function (card) {
                return regexp.test(_.deburr(card.title).toLowerCase().trim());
            });
            cb(_.sortBy(matchingCards, "title"));
        }
    },

    latestCards(cards = null) {
        if (cards === null) {
            cards = WBDB.data.cards.find()
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
    },
};
