<script lang="ts" generics="T extends Emotes | Badges">
	import type { Badges, Emotes } from '#lib/types/common.ts';

	import { groupByProvider } from '#lib/utils/index.ts';
	import { Search } from '@lucide/svelte';
	import { _ } from 'svelte-i18n';

	import SearchError from '#lib/components/SearchError.svelte';
	import Collapsible from '#lib/components/Collapsible.svelte';
	import ImageGrid from '#lib/components/ImageGrid.svelte';

	let {
		title,
		placeholder,
		items = null,
		filter,
		linkPrefix,
		nameKey = 'name',
		versionKey = null,
		placeholderGroups = 2
	}: {
		title: string;
		placeholder: string;
		items?: T[] | null;
		filter: (items: T[], search: string) => T[];
		linkPrefix: 'emote' | 'badge';
		nameKey?: string;
		versionKey?: string | null;
		placeholderGroups?: number;
	} = $props();

	let search = $state('');
	let closed = $state<Record<string, boolean>>({});

	const searching = $derived(search.trim().length > 0);

	const groups = $derived(
		Object.entries(groupByProvider(items ?? []))
			.map(([provider, group]) => [provider, filter(group, search)] as const)
			.filter(([, group]) => group.length > 0)
	);
</script>

<div class="container-general">
	<div class="bg-neutral mx-auto w-full max-w-7xl space-y-6 rounded-xl p-6 shadow-md">
		<div
			class="mb-6 flex w-full flex-col items-center space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4"
		>
			<h1 class="flex-1 text-center text-4xl font-bold sm:text-left">{title}</h1>
			<label class="input w-full sm:max-w-3xs">
				<Search />
				<input type="search" required {placeholder} bind:value={search} />
			</label>
		</div>

		{#if !items}
			{#each { length: placeholderGroups }}
				<Collapsible isLoading={true}>
					<ImageGrid isLoading={true} placeholderCount={36} />
				</Collapsible>
			{/each}
		{:else if groups.length === 0}
			<SearchError {search} />
		{:else}
			{#each groups as [provider, group] (provider)}
				<Collapsible
					open={searching || !closed[provider]}
					logo={`/logos/${provider}.svg`}
					title={$_(`provider.${provider}`)}
					onToggle={() => (closed[provider] = !closed[provider])}
				>
					<ImageGrid items={group} {linkPrefix} {nameKey} {versionKey} />
				</Collapsible>
			{/each}
		{/if}
	</div>
</div>
