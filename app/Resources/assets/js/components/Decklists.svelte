<script>
  import Decklist from "./Decklist.svelte";

  export let decklists = [];
</script>

{#each decklists as decklist (decklist.id)}
  <Decklist {decklist} />
{/each}
