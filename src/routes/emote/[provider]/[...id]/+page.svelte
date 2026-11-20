<script lang="ts">
	import { _ } from 'svelte-i18n';

	import EmoteView from '#lib/components/emote/EmoteView.svelte';
	import LoadError from '#lib/components/LoadError.svelte';
	import Details from '#lib/components/Details.svelte';
	import Seo from '#lib/components/Seo.svelte';

	let { data } = $props();
</script>

{#key `${data.provider}/${data.id}`}
	{#await data.emote}
		<Seo title={$_('emote.label')} pageType="ItemPage" />
		<Details type="emote" provider={data.provider} />
	{:then emote}
		<EmoteView {emote} extras={data.extras} variants={data.variants} />
	{:catch error}
		<LoadError {error} />
	{/await}
{/key}
