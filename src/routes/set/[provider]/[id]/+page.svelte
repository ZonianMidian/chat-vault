<script lang="ts">
	import type { Emotes, Set, SetPage } from '$lib/types/common';

	import { Search } from '@lucide/svelte';
	import { _ } from 'svelte-i18n';

	import SearchError from '$lib/components/SearchError.svelte';
	import ImageGrid from '$lib/components/ImageGrid.svelte';
	import Owner from '$lib/components/set/Owner.svelte';
	import Error from '$lib/components/Error.svelte';
	import { filterEmotes } from '$lib/utils';

	export let data: SetPage;

	let error: string | null = data.error || null;
	let filteredEmotes: Emotes[] = [];
	let set: Set | null = data.set;
	let search: string = '';

	$: setEmotes = set?.emotes || [];

	$: filteredEmotes = filterEmotes(setEmotes, search);
</script>

<svelte:head>
	<title>{data.pageTitle}</title>
	<meta property="og:title" content={data.pageTitle} />
	<meta property="og:image" content={data.pageImage} />
</svelte:head>

<div class="flex min-h-[90vh] flex-col items-center justify-center px-3 py-5 2xl:px-0">
	{#if error || !set}
		<Error error={error ?? $_('status.404')} />
	{:else}
		<div class="bg-neutral mx-auto w-full max-w-7xl space-y-6 rounded-xl p-6 shadow-md">
			<div
				class="mb-6 flex w-full flex-col items-center space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4"
			>
				<div class="flex flex-1">
					<h1 class="text-4xl font-bold sm:text-left">
						{set?.name ?? $_('set.title', { values: { user: set?.owner?.username } })}
					</h1>
					{#if set?.subtitle}
						<h1 class="text-4xl font-bold sm:text-left">:&nbsp;</h1>
						<h2 class="text-secondary self-end text-2xl font-semibold sm:text-left">
							{set?.subtitle}
						</h2>
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

			{#if filteredEmotes?.length === 0}
				<SearchError {search} />
			{:else}
				<div class="bg-base-100 rounded-lg p-[1rem]">
					<Owner provider={data?.provider} owner={set?.owner} source={set?.source} />
					<div class="divider my-4"></div>
					<ImageGrid items={filteredEmotes} linkPrefix="emote" />
				</div>
			{/if}
		</div>
	{/if}
</div>
