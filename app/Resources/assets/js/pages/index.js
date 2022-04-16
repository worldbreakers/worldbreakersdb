/* global $, WBDB */
import { data } from "../wbdb.data.js";
import { update } from "../deck.js";
import RecentDecklists from "../components/RecentDecklists.svelte";

export function enhanceIndexPage() {
    $(document).on("data.app", function () {
        updateHighlightedDecklist();
        showRecentDecklists();
    });
}

function updateHighlightedDecklist() {
    if (WBDB.Decklist) {
        for (var i = 0; i < WBDB.Decklist.cards.length; i++) {
            var slot = WBDB.Decklist.cards[i];
            data.cards.update(
                {
                    code: slot.card_code,
                },
                {
                    indeck: parseInt(slot.qty, 10),
                }
            );
        }
    }
    update();
}

function showRecentDecklists() {
    const recentDecklistsEl = document.querySelector(
        "#index_page > .row > div:nth-child(2)"
    );

    new RecentDecklists({
        target: recentDecklistsEl,
    });
}
