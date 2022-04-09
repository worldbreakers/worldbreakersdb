export function enhanceIndexPage() {
  $(document).on("data.app", function () {
    if (Decklist) {
      for (var i = 0; i < Decklist.cards.length; i++) {
        var slot = Decklist.cards[i];
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
    update_deck();
  });
}
