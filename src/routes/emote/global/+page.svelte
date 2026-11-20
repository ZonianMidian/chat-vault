<script lang="ts">
	import { filterEmotes } from '#lib/utils/index.ts';
	import { collectionSchema } from '#lib/seo.ts';
	import { page } from '$app/state';
	import { _ } from 'svelte-i18n';

	import ProviderGroups from '#lib/components/ProviderGroups.svelte';
	import LoadError from '#lib/components/LoadError.svelte';
	import Seo from '#lib/components/Seo.svelte';

	let { data } = $props();
	const schema = $derived(
		Array.isArray(data.emotes)
			? collectionSchema(data.emotes, {
					origin: page.url.origin,
					url: `${page.url.origin}/emote/global`,
					name: $_('global.emote'),
					description: $_('landing.features.emotes.description'),
					section: 'emote'
				})
			: null
	);
</script>

<Seo
	title={$_('global.emote')}
	path="/emote/global"
	pageType="CollectionPage"
	description={$_('landing.features.emotes.description')}
	breadcrumbs={[{ name: $_('navbar.emotes'), path: '/emote' }, { name: $_('global.emote') }]}
	{schema}
/>

{#snippet list(emotes: Awaited<typeof data.emotes> | null)}
	<ProviderGroups
		title={$_('global.emote')}
		placeholder={$_('search.emote')}
		items={emotes}
		filter={filterEmotes}
		linkPrefix="emote"
		placeholderGroups={4}
	/>
{/snippet}

{#await data.emotes}
	{@render list(null)}
{:then emotes}
	{#if emotes.length}
		{@render list(emotes)}
	{:else}
		<LoadError error={{ message: 'No global emotes', status: 503 }} />
	{/if}
{:catch error}
	<LoadError {error} />
{/await}
