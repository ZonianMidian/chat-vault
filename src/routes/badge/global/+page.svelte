<script lang="ts">
	import { filterBadges } from '#lib/utils/index.ts';
	import { collectionSchema } from '#lib/seo.ts';
	import { page } from '$app/state';
	import { _ } from 'svelte-i18n';

	import ProviderGroups from '#lib/components/ProviderGroups.svelte';
	import LoadError from '#lib/components/LoadError.svelte';
	import Seo from '#lib/components/Seo.svelte';

	let { data } = $props();
	const schema = $derived(
		Array.isArray(data.badges)
			? collectionSchema(data.badges, {
					origin: page.url.origin,
					url: `${page.url.origin}/badge/global`,
					name: $_('global.badge'),
					description: $_('landing.features.badges.description'),
					section: 'badge'
				})
			: null
	);
</script>

<Seo
	title={$_('global.badge')}
	path="/badge/global"
	pageType="CollectionPage"
	description={$_('landing.features.badges.description')}
	breadcrumbs={[{ name: $_('navbar.badges') }]}
	{schema}
/>

{#snippet list(badges: Awaited<typeof data.badges> | null)}
	<ProviderGroups
		title={$_('global.badge')}
		placeholder={$_('search.badge')}
		items={badges}
		filter={filterBadges}
		linkPrefix="badge"
		versionKey="version"
		nameKey="title"
	/>
{/snippet}

{#await data.badges}
	{@render list(null)}
{:then badges}
	{#if badges.length}
		{@render list(badges)}
	{:else}
		<LoadError error={{ message: $_('status.503'), status: 503 }} />
	{/if}
{:catch error}
	<LoadError {error} />
{/await}
