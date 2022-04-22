<script>
  export let distribution;

  $: relatives = () => {
    let sum = 0;
    Object.entries(distribution).forEach(([guild, count]) => {
      sum += count;
    });

    return sum > 0
      ? Object.entries(distribution).reduce((guilds, [guild, count]) => {
          guilds[guild] = count / sum;
          return guilds;
        }, {})
      : {};
  };

  $: toPercent = (value) => `${value * 100}%`;
</script>

<span class="guild-distribution">
  {#each Object.entries(relatives()) as [guild, relative] (guild)}
    <span
      style="background-color: var(--guild-{guild}) !important;width: {toPercent(
        relative
      )}"
      aria-label="{guild} {toPercent(relative)}"
      class="guild-distribution-item"
    />
  {/each}
</span>

<style>
  .guild-distribution {
    display: flex;
    height: 8px;
    overflow: hidden;
    background-color: var(--color-neutral-muted);
    background-color: rgba(175, 184, 193, 0.2);
    border-radius: 6px;
    outline: 1px solid transparent;
  }
  .guild-distribution-item {
    outline: 2px solid transparent;
  }
</style>
