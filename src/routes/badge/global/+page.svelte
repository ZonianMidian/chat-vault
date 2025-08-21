<script lang="ts">
	import type { Badges } from '$lib/types/common';

	import { fetchGlobalBadges } from '$lib/badges/fetchGlobals';
	import { onDestroy, onMount, untrack } from 'svelte';
	import { browser } from '$app/environment';
	import { normalizeText } from '$lib/utils';
	import { Search } from '@lucide/svelte';
	import { _, locale } from 'svelte-i18n';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	import { getCachedOriginData } from '$lib/emotes/originCache';
	import SearchError from '$lib/components/SearchError.svelte';
	import Collapsible from '$lib/components/Collapsible.svelte';
	import ImageGrid from '$lib/components/ImageGrid.svelte';
	import Error from '$lib/components/Error.svelte';

	let prevOpenGroups = $state<Record<string, boolean>>({});
	let openGroups = $state<Record<string, boolean>>({});
	let globalBadges = $state<Badges[]>([]);
	let error = $state<string | null>(null);
	let placeholderCount = $state(2);
	let currentLocale = $state('en');
	let isLoading = $state(true);
	let search = $state('');

	const groupedBadges = $derived(groupByProvider(globalBadges));
	const filteredGroupedBadges = $derived(() => {
		const entries = Object.entries(groupedBadges)
			.map(([provider, badges]) => [provider, filterBadges(badges, search)])
			.filter(([_, badges]) => badges.length > 0);
		return Object.fromEntries(entries) as Record<string, Badges[]>;
	});

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

	function filterBadges(badges: Badges[], searchTerm: string): Badges[] {
		if (!searchTerm.trim()) return badges;

		const s = normalizeText(searchTerm.trim().toLowerCase());

		return badges.filter(
			(e) =>
				normalizeText(e.id).toLowerCase().includes(s) ||
				normalizeText(e.title).toLowerCase().includes(s) ||
				normalizeText(e.provider).toLowerCase().includes(s)
		);
	}

	function reloadPage() {
		const thisPage = window.location.pathname;

		goto('/').then(() => goto(thisPage));
	}

	$effect(() => {
		const providers = Object.keys(groupedBadges);
		if (providers.length > 0) {
			untrack(() => {
				const newOpenGroups = { ...openGroups };
				for (const provider of providers) {
					if (!(provider in newOpenGroups)) {
						newOpenGroups[provider] = true;
					}
				}
				openGroups = newOpenGroups;
			});
		}
	});

	$effect(() => {
		const searchTerm = search.trim();
		const filteredProviders = Object.keys(filteredGroupedBadges);

		untrack(() => {
			if (searchTerm) {
				if (Object.keys(prevOpenGroups).length === 0) {
					prevOpenGroups = { ...openGroups };
				}
				const newOpenGroups = { ...openGroups };
				for (const provider of filteredProviders) {
					newOpenGroups[provider] = true;
				}
				openGroups = newOpenGroups;
			} else if (Object.keys(prevOpenGroups).length > 0) {
				openGroups = { ...prevOpenGroups };
				prevOpenGroups = {};
			}
		});
	});

	onMount(async () => {
		if (browser) {
			untrack(async () => {
				try {
					const badges = await fetchGlobalBadges('all');
					globalBadges = badges;
				} catch (err) {
					console.error(`[${$_('global.label')}] ${$_('badge.label')}:`, err);
					error =
						typeof err === 'object' && err !== null && 'message' in err
							? (err as { message: string }).message
							: String(err);
				} finally {
					isLoading = false;
				}
			});

			let hasMounted = false;
			const unsubscribeLocale = locale.subscribe((value) => {
				untrack(() => {
					if (hasMounted && value && value !== currentLocale) {
						currentLocale = value;
						reloadPage();
					}
					if (!hasMounted && value) {
						currentLocale = value;
						hasMounted = true;
					}
				});
			});

			getCachedOriginData();
			onDestroy(() => {
				unsubscribeLocale();
			});
		}
	});
</script>

<svelte:head>
	<title>{`${$_('global.badge')} | Chat Vault`}</title>
	<meta property="og:title" content={$_('global.badge')} />

	<meta property="og:url" content="{page.url.origin}/badge/global" />
	<link rel="canonical" href="{page.url.origin}/badge/global" />

	<meta property="og:image" content="{page.url.origin}/favicon.png" />
</svelte:head>

<div class="container-general container-h">
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
			{:else if Object.keys(filteredGroupedBadges()).length === 0}
				<SearchError {search} />
			{:else}
				{#each Object.entries(filteredGroupedBadges()) as [provider, badges] (provider)}
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
