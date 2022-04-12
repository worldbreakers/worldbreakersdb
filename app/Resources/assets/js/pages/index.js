/* global $, WBDB */
export function enhanceIndexPage() {
  $(document).on("data.app", function () {
    if (WBDB.Decklist) {
      for (var i = 0; i < WBDB.Decklist.cards.length; i++) {
        var slot = WBDB.Decklist.cards[i];
        WBDB.data.cards.update(
          {
            code: slot.card_code,
          },
          {
            indeck: parseInt(slot.qty, 10),
          }
        );
      }
    }
    WBDB.deck.update();
  });
}
