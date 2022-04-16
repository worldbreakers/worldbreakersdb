<script>
  import GuildDistribution from "./GuildDistribution.svelte";
  import { data as Data } from "../wbdb.data.js";
  import { onMount } from "svelte";

  export let decklist;
  let cards = [];
  let identity = {};
  const card_image_url = window.WBDB.card_image_url;
  export let route = (name, options) =>
    window.encodeURI(window.Routing.generate(name, options));

  onMount(() => {
    const allCards = Data.cards.find({
      code: { $in: Object.keys(decklist.cards) },
    });
    cards = allCards.filter((card) => card.type_code !== "identity");
    identity = allCards.find((card) => card.type_code === "identity");
  });
</script>

<tr class="decklist-row--info">
  <td>
    <img
      data-src="{card_image_url}/tiny/{identity.code}_front.jpg"
      alt={identity.stripped_title}
      style="width:51px;height:71px"
      class="lazyload"
    />
  </td>
  <td>
    <div>
      <a
        href={route("decklist_view", {
          decklist_uuid: decklist.uuid,
          decklist_name: decklist.prettyname,
        })}>{decklist.name}</a
      >

      <div class="small pull-right">
        <a
          href={route("decklist_view", {
            decklist_uuid: decklist.uuid,
            decklist_name: decklist.prettyname,
          })}
        >
          <span class="social-icons">
            <span class="social-icon-like">
              <span class="glyphicon glyphicon-heart" />
              <span class="num">{decklist.nbvotes}</span>
            </span>
            <span class="social-icon-favorite">
              <span class="glyphicon glyphicon-star" />
              <span class="num">{decklist.nbfavorites}</span>
            </span>
            <span class="social-icon-comment">
              <span class="glyphicon glyphicon-comment" />
              <span class="num">{decklist.nbcomments}</span>
            </span>
          </span>
        </a>
      </div>
    </div>

    <div class="small">
      <div>
        <a
          href={route("user_profile_view", {
            user_id: decklist.user_id,
            user_name: decklist.username,
          })}
          class={decklist.usercolor}>{decklist.user_name}</a
        >
        <small class="reputation">{decklist.user_reputation}</small>
      </div>
    </div>

    <div class="decklist-row--guild-distribution">
        {#if decklist.guild_distribution}
            <GuildDistribution distribution={decklist.guild_distribution} />
        {/if}
    </div>
  </td>
</tr>

<style>
tr.decklist-row--info td {
    padding-bottom: 0.5em;
}

tr.decklist-row--info td:nth-child(1) {
    width: 67px;
}

.decklist-row--guild-distribution {
  margin-top: 0.5em;
}
</style>
