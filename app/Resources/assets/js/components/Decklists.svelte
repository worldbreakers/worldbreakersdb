<script>
import Decklist from "./Decklist.svelte";

export let decklists = [];
</script>

{#if decklists.length}
    {#each decklists as decklist (decklist.id)}
        <Decklist {decklist} />
    {/each}
{:else}
    <div class="panel panel-default">
        <div class="panel-body">
            Could not find any decklists.
        </div>
    </div>
{/if}
