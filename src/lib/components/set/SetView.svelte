<script lang="ts">
	import type { Set } from '#lib/types/common.ts';

	import { getChannelPath } from '#lib/utils/text.ts';
	import { filterEmotes } from '#lib/utils/index.ts';
	import { setSchema } from '#lib/seo.ts';
	import { Search } from '@lucide/svelte';
	import { page } from '$app/state';
	import { _ } from 'svelte-i18n';

	import SearchError from '#lib/components/SearchError.svelte';
	import ImageGrid from '#lib/components/ImageGrid.svelte';
	import Owner from '#lib/components/set/Owner.svelte';
	import Seo from '#lib/components/Seo.svelte';

	let {
		provider,
		set = null
	}: {
		provider: string;
		set?: Set | null;
	} = $props();

	let search = $state('');

	const emotes = $derived(filterEmotes(set?.emotes ?? [], search));

	const title = $derived(
		set ? (set.name ?? $_('set.title', { values: { user: set.owner?.username ?? '' } })) : null
	);

	const description = $derived(
		set
			? [
					`[${$_(`provider.${set.provider}`)}]`,
					`👤 ${set.owner?.username}`,
					`🖼️ ${set.emotes.length}`
				]
					.filter(Boolean)
					.join(' · ')
			: null
	);

	const schema = $derived(
		set && title
			? setSchema(set, {
					origin: page.url.origin,
					url: page.url.origin + page.url.pathname,
					name: title,
					description
				})
			: null
	);
</script>

{#if set}
	<Seo
		title={`${$_('set.label')}: ${title}`}
		path={page.url.pathname}
		image={set.owner?.avatar}
		primaryImage={set.owner?.avatar
			? { url: set.owner.avatar, caption: set.owner.username ?? title }
			: null}
		pageType="CollectionPage"
		source={set.source}
		breadcrumbs={[
			{ name: $_('navbar.emotes'), path: '/emote' },
			set.owner?.username
				? { name: set.owner.username, path: getChannelPath(set.owner) }
				: null,
			{ name: title ?? set.id }
		].filter((crumb) => crumb !== null)}
		{description}
		{schema}
	/>
{:else}
	<Seo title={$_('set.label')} pageType="CollectionPage" />
{/if}

<div class="container-general">
	<div class="bg-neutral mx-auto w-full max-w-7xl space-y-6 rounded-xl p-6 shadow-md">
		<div
			class="mb-6 flex w-full flex-col items-center space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4"
		>
			<div class="flex flex-1">
				{#if !set}
					<div class="skeleton h-10 w-64"></div>
				{:else}
					<h1 class="text-4xl font-bold sm:text-left">{title}</h1>
					{#if set.subtitle}
						<span class="text-4xl font-bold sm:text-left">:&nbsp;</span>
						<h2 class="text-secondary self-end text-2xl font-semibold sm:text-left">
							{$_(set.subtitle, { values: { tier: set.tier ?? '' } })}
						</h2>
					{/if}
				{/if}
			</div>
			<label class="input w-full sm:max-w-3xs">
				<Search />
				<input
					type="search"
					required
					placeholder={$_('search.emote')}
					bind:value={search}
				/>
			</label>
		</div>

		<div class="bg-base-100 rounded-lg p-4">
			<Owner {provider} owner={set?.owner} source={set?.source} isLoading={!set} />
			<div class="divider my-4"></div>
			{#if !set}
				<ImageGrid isLoading={true} placeholderCount={36} />
			{:else if emotes.length === 0}
				<SearchError {search} />
			{:else}
				<ImageGrid items={emotes} linkPrefix="emote" />
			{/if}
		</div>
	</div>
</div>
