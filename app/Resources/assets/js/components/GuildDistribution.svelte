<script>
export let distribution;

let relatives = [];

$: {
    const sum = Object.entries(distribution).reduce((memo, [guild, count]) => {
        return memo + count;
    }, 0);

    let guilds = [];
    if (sum > 0) {
        guilds = Object.entries(distribution).map(([guild, count]) => ([guild, count / sum]));
        guilds.sort(([guildA, relA], [guildB, relB]) => relB - relA);
    }
    relatives = guilds;
}

$: toPercent = (value) => `${value * 100}%`;

</script>

<span class="guild-distribution">
    {#each relatives as [guild, relative] (guild)}
        <span
            style="background-color: var(--guild-{guild}) !important; width: {toPercent(relative)}"
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
