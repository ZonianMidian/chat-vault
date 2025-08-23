<script lang="ts">
	import type { User } from '$lib/types/common';

	import { getChannelByLink } from '$lib/channels/getChannelByLink';
	import { searchChannel } from '$lib/channels/searchChannel';
	import { calculateSimilarity, debounce } from '$lib/utils';
	import { goto, replaceState } from '$app/navigation';
	import { Search, Info } from '@lucide/svelte';
	import { browser } from '$app/environment';
	import { onMount, untrack } from 'svelte';
	import { page } from '$app/state';
	import { _ } from 'svelte-i18n';

	import SearchError from '$lib/components/SearchError.svelte';
	import ImageGrid from '$lib/components/ImageGrid.svelte';

	let error = $state<string | null>(null);
	let channels = $state<User[]>([]);
	let isInitialized = $state(false);
	let hasSearched = $state(false);
	let isLoading = $state(false);
	let search = $state('');

	let urlQuery = $derived(page.url.searchParams.get('q') || '');

	const debouncedSearch = debounce((searchTerm: string) => performSearch(searchTerm, true), 1000);

	function cleanSearchText(text: string): string {
		return text
			.trim()
			.replace(/\s+/g, '')
			.replace(/[^a-zA-Z0-9\-_.@]/g, '');
	}

	function isUrl(text: string): boolean {
		try {
			new URL(text);
			return true;
		} catch {
			const urlPattern = /^(https?:\/\/)?([\w\-]+(\.[\w\-]+)+)(\/.*)?$/i;
			return urlPattern.test(text.trim());
		}
	}

	function sortByRelevance(results: User[], searchTerm: string): User[] {
		return results
			.map((item) => ({
				...item,
				similarity: calculateSimilarity(searchTerm, item.username || '')
			}))
			.sort((a, b) => b.similarity - a.similarity)
			.map(({ similarity, ...item }) => item);
	}

	function updateUrl(searchTerm: string): void {
		if (!browser) return;

		const url = new URL(page.url);

		if (searchTerm.trim()) {
			url.searchParams.set('q', searchTerm);
		} else {
			url.searchParams.delete('q');
		}

		replaceState(url, {});
	}

	function handleInput(searchValue: string): void {
		if (!isInitialized) return;

		if (isUrl(searchValue.trim())) {
			debouncedSearch(searchValue.trim());
			return;
		}

		const cleanedSearch = cleanSearchText(searchValue);

		if (cleanedSearch !== searchValue.replace(/\s/g, '')) {
			search = cleanedSearch;
			return;
		}

		debouncedSearch(cleanedSearch);
	}

	async function performSearch(searchTerm: string, shouldUpdateUrl = true): Promise<void> {
		const trimmedTerm = searchTerm.trim();

		if (!trimmedTerm) {
			if (shouldUpdateUrl) updateUrl('');
			hasSearched = false;
			channels = [];
			error = null;
			return;
		}

		hasSearched = true;
		isLoading = true;
		error = null;

		if (shouldUpdateUrl) updateUrl(trimmedTerm);

		try {
			if (isUrl(trimmedTerm)) {
				const result = getChannelByLink(trimmedTerm);

				if (result) {
					await goto(result);
					return;
				} else {
					error = $_('status.404');
					channels = [];
					return;
				}
			}

			const results = await searchChannel('all', trimmedTerm);

			if (results.length === 0) {
				error = $_('status.404');
				channels = [];
			} else {
				error = null;
				channels = sortByRelevance(results, trimmedTerm);
			}
		} catch (err) {
			console.error(`[${$_('channel.label')}] ${$_('search.label')}:`, err);
			error = $_('status.404');
			channels = [];
		} finally {
			isLoading = false;
		}
	}

	$effect(() => {
		untrack(() => {
			if (!isInitialized) {
				search = urlQuery;
				if (urlQuery) {
					performSearch(urlQuery, false);
				}
				isInitialized = true;
			} else if (urlQuery !== search) {
				search = urlQuery;
				if (urlQuery) {
					performSearch(urlQuery, false);
				} else {
					hasSearched = false;
					channels = [];
					error = null;
				}
			}
		});
	});

	$effect(() => {
		if (isInitialized) {
			handleInput(search);
		}
	});

	onMount(() => {
		return () => {
			debouncedSearch.cancel();
		};
	});
</script>

<svelte:head>
	<title>{`${$_('channel.search')}${hasSearched ? `: ${search}` : ''} | Chat Vault`}</title>
	<meta
		property="og:title"
		content={`${$_('channel.search')}${hasSearched ? `: ${search}` : ''}`}
	/>

	<meta property="og:url" content="{page.url.origin}/channel/search" />
	<link rel="canonical" href="{page.url.origin}/channel/search" />

	<meta property="og:image" content="{page.url.origin}/favicon.png" />
</svelte:head>

<div class="container-general">
	<div class="bg-neutral mx-auto w-full max-w-7xl space-y-6 rounded-xl p-6 shadow-md">
		<h1 class="text-4xl font-bold sm:text-left">{$_('channel.search')}</h1>

		<div class="flex">
			<label class="input w-full max-w-md">
				<Search />
				<input
					type="search"
					required
					placeholder={$_('search.channel')}
					bind:value={search}
				/>
			</label>
		</div>

		{#if hasSearched}
			<div class="transition-opacity duration-300" class:opacity-0={!hasSearched}>
				{#if error}
					<SearchError {search} />
				{:else}
					<div class="bg-base-100 rounded-lg p-[1rem]">
						<ImageGrid
							providerKey="platform"
							linkPrefix="channel"
							nameKey="username"
							imageKey="avatar"
							idKey="username"
							placeholderCount={36}
							items={channels}
							logo={true}
							{isLoading}
						/>
					</div>
				{/if}
			</div>
		{:else}
			<div class="alert alert-dash max-sm:alert-vertical alert-warning text-sm font-medium">
				<div class="flex items-center justify-center gap-3">
					<Info class="h-5 w-5 flex-shrink-0" />
					<span class="text-xl">
						{$_('search.message')}
					</span>
				</div>
			</div>
		{/if}
	</div>
</div>
