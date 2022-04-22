<script>
import { onMount } from "svelte";
import { route } from "../svelte-helpers.js";
import RecentDecklist from "./RecentDecklist.svelte";

let isLoading = false;
let decklists = [];

onMount(() => {
    isLoading = true;
    fetch(route("api_public_recent_decklists"))
        .then((response) => response.json())
        .then(({ data }) => {
            decklists = data;
        })
        .catch((error) => console.error(error))
        .finally(() => {
            isLoading = false;
        });
});
</script>

<h3 class="section">
  Last decklists
  <a
    href={ route("decklists_list", { type: "recent" }) }
    class="small">more</a
  >
</h3>

{#if isLoading}
  <div>Loading …</div>
{:else}
  <table class="table">
    <tbody>
      {#each decklists as decklist (decklist.id)}
        <RecentDecklist {decklist} />
      {/each}
    </tbody>
  </table>
{/if}
