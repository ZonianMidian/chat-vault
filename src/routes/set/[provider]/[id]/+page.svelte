<script lang="ts">
	import type { Emotes, Set, SetPage } from '$lib/types/common';

	import { Search } from '@lucide/svelte';
	import { _ } from 'svelte-i18n';

	import SearchError from '$lib/components/SearchError.svelte';
	import ImageGrid from '$lib/components/ImageGrid.svelte';
	import Owner from '$lib/components/set/Owner.svelte';
	import Error from '$lib/components/Error.svelte';
	import { filterEmotes } from '$lib/utils';
	import { page } from '$app/state';

	let { data }: { data: SetPage } = $props();

	let search = $state('');

	const set = $derived(data.set);
	const error = $derived(data.error || null);
	const setEmotes = $derived(set?.emotes || []);
	const filteredEmotes = $derived(filterEmotes(setEmotes, search));

	const title = $derived(
		set?.name ?? $_('set.title', { values: { user: set?.owner?.username } })
	);
	const pageTitle = $derived(`${$_('set.label')}: ${title}`);
</script>

<svelte:head>
	<title>{`${error ? $_('common.error') : pageTitle} | Chat Vault`}</title>
	<meta property="og:title" content={error ? $_('common.error') : pageTitle} />

	<meta property="og:url" content="{page.url.origin}/{data.provider}/{set?.id}" />
	<link rel="canonical" href="{page.url.origin}/{data.provider}/{set?.id}" />

	<meta property="og:image" content={data.pageImage} />
</svelte:head>

{#if error || !data}
	<div class="container-general container-h">
		<Error error={error ?? $_('status.404')} />
	</div>
{:else}
	<div class="container-general">
		<div class="bg-neutral mx-auto w-full max-w-7xl space-y-6 rounded-xl p-6 shadow-md">
			<div
				class="mb-6 flex w-full flex-col items-center space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4"
			>
				<div class="flex flex-1">
					<h1 class="text-4xl font-bold sm:text-left">
						{title}
					</h1>
					{#if set?.subtitle}
						<h1 class="text-4xl font-bold sm:text-left">:&nbsp;</h1>
						<h2 class="text-secondary self-end text-2xl font-semibold sm:text-left">
							{$_(set?.subtitle, { values: { tier: set.tier } })}
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

			<div class="bg-base-100 rounded-lg p-[1rem]">
				<Owner provider={data?.provider} owner={set?.owner} source={set?.source} />
				<div class="divider my-4"></div>
				{#if filteredEmotes?.length === 0}
					<SearchError {search} />
				{:else}
					<ImageGrid items={filteredEmotes} linkPrefix="emote" />
				{/if}
			</div>
		</div>
	</div>
{/if}
