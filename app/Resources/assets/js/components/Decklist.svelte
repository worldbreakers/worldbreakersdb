<script>
import { route, cardImageURL } from "../svelte-helpers.js";
import GuildDistribution from "./GuildDistribution.svelte";

export let decklist;

$: identity = { code: decklist.code, stripped_title: decklist.identity };
$: created_at = new Date(decklist.date_creation).toLocaleDateString();
</script>

<div class="decklist--list-item">
    <div class="visible-xs-block">
        <a
            href={route("decklist_view", {
                 decklist_uuid: decklist.uuid,
                 decklist_name: decklist.prettyname,
                 })}>{decklist.name}</a
                                    >
    </div>
    <div class="media" style="margin-top:0">
        <div class="media-left">
            <img
                data-src="{cardImageURL()}/tiny/{identity.code}_front.jpg"
                alt={identity.stripped_title}
                          style="width:51px;height:71px"
                class="lazyload"
            />
        </div>
        <div class="media-body">
            <div class="row h4 hidden-xs">
                <div class="col-sm-9">
                    <a
                        href={route("decklist_view", {
                             decklist_uuid: decklist.uuid,
                             decklist_name: decklist.prettyname,
                             })}>{decklist.name}</a
                                                >
                </div>
                <div class="col-sm-3 small social">
                    <span class="glyphicon glyphicon-heart social-icon-like" />
                    {decklist.nbvotes}
                    <span class="glyphicon glyphicon-star social-icon-favorite" />
                    {decklist.nbfavorites}
                    <span class="glyphicon glyphicon-comment social-icon-comment" />
                    {decklist.nbcomments}
                </div>
            </div>
            <div class="row h5">
                <div class="col-sm-5">
                    <span class="glyphicon glyphicon-user {decklist.usercolor}" />
                    <a
                        href={route("user_profile_view", {
                             user_id: decklist.user_id,
                             user_name: decklist.username,
                             })}
                             class={decklist.usercolor}>{decklist.username}</a
                                                                           >
                    <small class="reputation">{decklist.reputation}</small>
                    <div class="decklist-row--guild-distribution">
                        {#if decklist.guild_distribution}
                            <GuildDistribution distribution={decklist.guild_distribution} />
                        {/if}
                    </div>
                </div>
                <div class="visible-xs-block">
                    <div class="col-sm-3 social">
                        <span class="glyphicon glyphicon-heart social-icon-like" />
                        {decklist.nbvotes}
                        <span class="glyphicon glyphicon-star social-icon-favorite" />
                        {decklist.nbfavorites}
                        <span class="glyphicon glyphicon-comment social-icon-comment" />
                        {decklist.nbcomments}
                    </div>
                </div>
                <div class="col-sm-4">
                    {#if decklist.tournament}
                        <span class="text-success">
                            <span class="glyphicon glyphicon-certificate" />
                            {decklist.tournament}
                        </span>
                    {/if}
                </div>
                <div class="col-sm-3 hidden-xs">
                    <span class="glyphicon glyphicon-calendar" />
                    <time datetime={decklist.date_creation}>{created_at}</time>
                </div>
            </div>
        </div>
    </div>
</div>

<style>
.decklist--list-item {
    border-top: 1px solid #ddd;
    margin-bottom: 10px;
    padding-top: 10px;
}
</style>
