<script lang="ts">
	import type { Emotes } from '$lib/types/common';

	import { fetchGlobalEmotes } from '$lib/emotes/fetchGlobals';
	import { browser } from '$app/environment';
	import { onMount, untrack } from 'svelte';
	import { Search } from '@lucide/svelte';
	import { page } from '$app/state';
	import { _ } from 'svelte-i18n';

	import { getCachedOriginData } from '$lib/emotes/originCache';
	import SearchError from '$lib/components/SearchError.svelte';
	import Collapsible from '$lib/components/Collapsible.svelte';
	import ImageGrid from '$lib/components/ImageGrid.svelte';
	import Error from '$lib/components/Error.svelte';
	import { filterEmotes } from '$lib/utils';

	let openGroups = $state<Record<string, boolean>>({});
	let prevOpenGroups = $state<Record<string, boolean>>({});
	let globalEmotes = $state<Emotes[]>([]);
	let error = $state<string | null>(null);
	let placeholderCount = $state(4);
	let isLoading = $state(true);
	let search = $state('');

	const groupedEmotes = $derived(groupByProvider(globalEmotes));
	const filteredGroupedEmotes = $derived(() => {
		const entries = Object.entries(groupedEmotes)
			.map(([provider, emotes]) => [provider, filterEmotes(emotes, search)])
			.filter(([_, emotes]) => emotes.length > 0);
		return Object.fromEntries(entries) as Record<string, Emotes[]>;
	});

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

	$effect(() => {
		const providers = Object.keys(groupedEmotes);
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
		const filteredProviders = Object.keys(filteredGroupedEmotes);

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
					const emotes = await fetchGlobalEmotes('all');
					globalEmotes = emotes;
				} catch (err) {
					console.error(`[${$_('global.label')}] ${$_('emote.label')}:`, err);
					error =
						typeof err === 'object' && err !== null && 'message' in err
							? (err as { message: string }).message
							: String(err);
				} finally {
					isLoading = false;
				}
			});

			getCachedOriginData();
		}
	});
</script>

<svelte:head>
	<title>{`${$_('global.emote')} | Chat Vault`}</title>
	<meta property="og:title" content={$_('global.emote')} />

	<meta property="og:url" content="{page.url.origin}/emote/global" />
	<link rel="canonical" href="{page.url.origin}/emote/global" />

	<meta property="og:image" content="{page.url.origin}/favicon.png" />
</svelte:head>

{#if (error || !globalEmotes.length) && !isLoading}
	<div class="container-general container-h">
		<Error error={error ?? $_('status.500')} />
	</div>
{:else}
	<div class="container-general">
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
			{:else if Object.keys(filteredGroupedEmotes()).length === 0}
				<SearchError {search} />
			{:else}
				{#each Object.entries(filteredGroupedEmotes()) as [provider, emotes] (provider)}
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
	</div>
{/if}
