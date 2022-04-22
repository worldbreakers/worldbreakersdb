/* global $ */
import * as ui from "../ui.js";
import * as user from "../user.js";
import Decklists from "../components/Decklists.svelte";

export function enhanceDecklistsPage({ decklists }) {
    ui.promise.then(() => showDecklists(decklists));

    Promise.all([user.promise, ui.promise]).then(function () {
        if (user.data.is_moderator) {
            $("#side_nav").addClass("user-is-moderator");
        }
    });
}

function showDecklists(decklists) {
    const recentDecklistsEl = document.querySelector("#decklists--list");

    new Decklists({
        target: recentDecklistsEl,
        props: { decklists },
    });
}
