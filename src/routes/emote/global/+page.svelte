<script lang="ts">
	import type { Emotes } from '$lib/types/common';

	import { fetchGlobalEmotes } from '$lib/emotes/fetchGlobals';
	import { browser } from '$app/environment';
	import { Search } from '@lucide/svelte';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { _ } from 'svelte-i18n';

	import { getCachedOriginData } from '$lib/emotes/originCache';
	import SearchError from '$lib/components/SearchError.svelte';
	import Collapsible from '$lib/components/Collapsible.svelte';
	import ImageGrid from '$lib/components/ImageGrid.svelte';
	import Error from '$lib/components/Error.svelte';
	import { filterEmotes } from '$lib/utils';

	let filteredGroupedEmotes: Record<string, Emotes[]> = {};
	let groupedEmotes: Record<string, Emotes[]> = {};
	let prevOpenGroups: Record<string, boolean> = {};
	let openGroups: Record<string, boolean> = {};

	let placeholderCount: number = 4;
	let error: string | null = null;
	let globalEmotes: Emotes[] = [];
	let isLoading: boolean = true;
	let search: string = '';

	$: groupedEmotes = groupByProvider(globalEmotes);

	$: if (Object.keys(groupedEmotes).length) {
		for (const provider of Object.keys(groupedEmotes)) {
			if (!(provider in openGroups)) openGroups[provider] = true;
		}
	}

	$: filteredGroupedEmotes = Object.fromEntries(
		Object.entries(groupedEmotes)
			.map(([provider, emotes]) => [provider, filterEmotes(emotes, search)])
			.filter(([_, emotes]) => emotes.length > 0)
	) as Record<string, Emotes[]>;

	$: if (search.trim()) {
		if (Object.keys(prevOpenGroups).length === 0) {
			prevOpenGroups = { ...openGroups };
		}
		for (const provider of Object.keys(filteredGroupedEmotes)) {
			openGroups[provider] = true;
		}
	} else if (Object.keys(prevOpenGroups).length > 0) {
		openGroups = { ...prevOpenGroups };
		prevOpenGroups = {};
	}

	function groupByProvider(emotes: Emotes[]): Record<string, Emotes[]> {
		const groups: Record<string, Emotes[]> = {};
		for (const emote of emotes) {
			if (!groups[emote.provider]) groups[emote.provider] = [];
			groups[emote.provider].push(emote);
		}
		return groups;
	}

	function toggleGroup(provider: string) {
		openGroups = { ...openGroups, [provider]: !openGroups[provider] };
	}

	onMount(async () => {
		if (browser) {
			await fetchGlobalEmotes('all')
				.then((emotes) => {
					globalEmotes = emotes;
				})
				.catch((error) => {
					console.error(`[${$_('global.label')}] ${$_('emote.label')}:`, error);
					error = error.message;
				})
				.finally(() => {
					isLoading = false;
				});

			getCachedOriginData();
		}
	});
</script>

<svelte:head>
	<title>{`Chat Vault | ${$_('global.emote')}`}</title>
	<meta property="og:title" content={`Chat Vault | ${$_('global.emote')}`} />
	<meta property="og:image" content="{page.url.origin}/favicon.png" />
</svelte:head>

<div class="flex min-h-[90vh] flex-col items-center justify-center px-3 py-5 2xl:px-0">
	{#if (error || !globalEmotes.length) && !isLoading}
		<Error error={error ?? $_('status.500')} />
	{:else}
		<div class="bg-neutral mx-auto w-full max-w-7xl space-y-6 rounded-xl p-6 shadow-md">
			<div
				class="mb-6 flex w-full flex-col items-center space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4"
			>
				<h1 class="flex-1 text-center text-4xl font-bold sm:text-left">
					{$_('global.emote')}
				</h1>
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

			{#if isLoading}
				{#each Array(placeholderCount) as _}
					<Collapsible isLoading={true}>
						<ImageGrid isLoading={true} placeholderCount={36} />
					</Collapsible>
				{/each}
			{:else if Object.keys(filteredGroupedEmotes).length === 0}
				<SearchError {search} />
			{:else}
				{#each Object.entries(filteredGroupedEmotes) as [provider, emotes] (provider)}
					<Collapsible
						open={openGroups[provider]}
						logo={`/logos/${provider}.svg`}
						title={$_(`provider.${provider}`)}
						onToggle={() => toggleGroup(provider)}
					>
						<ImageGrid {isLoading} items={emotes} linkPrefix="emote" />
					</Collapsible>
				{/each}
			{/if}
		</div>
	{/if}
</div>
