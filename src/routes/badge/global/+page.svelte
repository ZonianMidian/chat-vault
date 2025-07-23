<script lang="ts">
	import type { Badges } from '$lib/types/common';

	import { fetchGlobalBadges } from '$lib/badges/fetchGlobals';
	import { browser } from '$app/environment';
	import { Search } from '@lucide/svelte';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { _ } from 'svelte-i18n';

	import SearchError from '$lib/components/SearchError.svelte';
	import Collapsible from '$lib/components/Collapsible.svelte';
	import ImageGrid from '$lib/components/ImageGrid.svelte';
	import Error from '$lib/components/Error.svelte';
	import { normalizeText } from '$lib/utils';

	let prevOpenGroups: Record<string, boolean> = {};
	let groupedBadges: Record<string, Badges[]> = {};
	let openGroups: Record<string, boolean> = {};

	let placeholderCount: number = 2;
	let error: string | null = null;
	let globalBadges: Badges[] = [];
	let isLoading: boolean = true;
	let search: string = '';

	$: groupedBadges = groupByProvider(globalBadges);

	$: if (Object.keys(groupedBadges).length) {
		for (const provider of Object.keys(groupedBadges)) {
			if (!(provider in openGroups)) openGroups[provider] = true;
		}
	}

	function groupByProvider(badges: Badges[]): Record<string, Badges[]> {
		const groups: Record<string, Badges[]> = {};
		for (const badge of badges) {
			if (!groups[badge.provider]) groups[badge.provider] = [];
			groups[badge.provider].push(badge);
		}
		return groups;
	}

	function toggleGroup(provider: string) {
		openGroups = { ...openGroups, [provider]: !openGroups[provider] };
	}

	function filterBadges(badges: Badges[], search: string): Badges[] {
		if (!search.trim()) return badges;

		const s = normalizeText(search.trim().toLowerCase());

		return badges.filter(
			(e) =>
				normalizeText(e.id).toLowerCase().includes(s) ||
				normalizeText(e.title).toLowerCase().includes(s) ||
				normalizeText(e.provider).toLowerCase().includes(s)
		);
	}

	let filteredGroupedBadges: Record<string, Badges[]> = {};

	$: filteredGroupedBadges = Object.fromEntries(
		Object.entries(groupedBadges)
			.map(([provider, badges]) => [provider, filterBadges(badges, search)])
			.filter(([_, badges]) => badges.length > 0)
	) as Record<string, Badges[]>;

	$: if (search.trim()) {
		if (Object.keys(prevOpenGroups).length === 0) {
			prevOpenGroups = { ...openGroups };
		}
		for (const provider of Object.keys(filteredGroupedBadges)) {
			openGroups[provider] = true;
		}
	} else if (Object.keys(prevOpenGroups).length > 0) {
		openGroups = { ...prevOpenGroups };
		prevOpenGroups = {};
	}

	onMount(async () => {
		if (browser) {
			await fetchGlobalBadges('all')
				.then((badges) => {
					globalBadges = badges;
				})
				.catch((error) => {
					console.error(`[${$_('global.label')}] ${$_('badge.label')}:`, error);
					error = error.message;
				})
				.finally(() => {
					isLoading = false;
				});
		}
	});
</script>

<svelte:head>
	<title>{`Chat Vault | ${$_('global.badge')}`}</title>
	<meta property="og:title" content={`Chat Vault | ${$_('global.badge')}`} />
	<meta property="og:image" content="{page.url.origin}/favicon.png" />
</svelte:head>

<div class="flex min-h-[90vh] flex-col items-center justify-center px-3 py-5 2xl:px-0">
	{#if (error || !globalBadges.length) && !isLoading}
		<Error error={error ?? $_('status.500')} />
	{:else}
		<div class="bg-neutral mx-auto w-full max-w-7xl space-y-6 rounded-xl p-6 shadow-md">
			<div
				class="mb-6 flex w-full flex-col items-center space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4"
			>
				<h1 class="flex-1 text-center text-4xl font-bold sm:text-left">
					{$_('global.badge')}
				</h1>
				<label class="input w-full sm:max-w-3xs">
					<Search />
					<input
						type="search"
						required
						placeholder={$_('search.badge')}
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
			{:else if Object.keys(filteredGroupedBadges).length === 0}
				<SearchError {search} />
			{:else}
				{#each Object.entries(filteredGroupedBadges) as [provider, badges] (provider)}
					<Collapsible
						open={openGroups[provider]}
						logo={`/logos/${provider}.svg`}
						title={$_(`provider.${provider}`)}
						onToggle={() => toggleGroup(provider)}
					>
						<ImageGrid
							{isLoading}
							items={badges}
							linkPrefix="badge"
							versionKey="version"
							nameKey="title"
						/>
					</Collapsible>
				{/each}
			{/if}
		</div>
	{/if}
</div>
