<script lang="ts">
	import type {
		EmoteSearchOptions,
		EmoteSearchResult,
		SearchProvider,
		EmoteFormat,
		SearchEmote,
		EmoteSort
	} from '#lib/emotes/search.ts';
	import type { DropdownOption } from '#lib/components/OptionDropdown.svelte';

	import {
		defaultEmoteSearch,
		emoteSearchParams,
		searchProviders,
		supportsSearch
	} from '#lib/emotes/search.ts';
	import {
		Image as ImageIcon,
		CalendarArrowDown,
		CalendarArrowUp,
		TriangleAlert,
		ArrowDownAZ,
		ArrowDownZA,
		RotateCcw,
		UserRound,
		Sparkles,
		UserLock,
		Layers2,
		Search,
		Shapes,
		Equal,
		Flame,
		Film,
		Info
	} from '@lucide/svelte';
	import { getEmoteByLink } from '#lib/emotes/getEmoteByLink.ts';
	import { isLink } from '#lib/channels/getChannelByLink.ts';
	import { collectionSchema } from '#lib/seo.ts';
	import { debounce } from '#lib/utils/index.ts';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { _ } from 'svelte-i18n';

	import OptionDropdown from '#lib/components/OptionDropdown.svelte';
	import SearchError from '#lib/components/SearchError.svelte';
	import ImageGrid from '#lib/components/ImageGrid.svelte';
	import Seo from '#lib/components/Seo.svelte';

	let { data } = $props();

	// svelte-ignore state_referenced_locally
	let options = $state<EmoteSearchOptions>({ ...data.options });
	// svelte-ignore state_referenced_locally
	let requested = emoteSearchParams(data.options).toString();

	const params = $derived(emoteSearchParams(data.options).toString());
	const customized = $derived(emoteSearchParams({ ...options, query: '' }).toString() !== '');
	const resolved = $derived(data.result instanceof Promise ? null : data.result);

	const title = $derived(
		`${$_('emote.search')}${data.options.query ? `: ${data.options.query}` : ''}`
	);

	const schema = $derived(
		resolved?.emotes.length
			? collectionSchema(resolved.emotes, {
					origin: page.url.origin,
					url: `${page.url.origin}/emote/search${params ? `?${params}` : ''}`,
					name: data.options.query ? title : $_('search.trending'),
					description: $_('emote.search_description'),
					section: 'emote'
				})
			: null
	);

	const formatOptions = $derived<DropdownOption<EmoteFormat>[]>([
		{ value: 'all', label: $_('search.filters.all'), icon: Shapes },
		{ value: 'animated', label: $_('search.filters.animated'), icon: Film },
		{ value: 'static', label: $_('search.filters.static'), icon: ImageIcon }
	]);

	const sortOptions = $derived<DropdownOption<EmoteSort>[]>([
		{ value: 'relevance', label: $_('search.sort.relevance'), icon: Sparkles },
		{ value: 'name-asc', label: $_('search.sort.name-asc'), icon: ArrowDownAZ },
		{ value: 'name-desc', label: $_('search.sort.name-desc'), icon: ArrowDownZA },
		{
			value: 'owner-asc',
			label: $_('search.sort.owner-asc'),
			icon: UserRound,
			detail: ArrowDownAZ
		},
		{
			value: 'owner-desc',
			label: $_('search.sort.owner-desc'),
			icon: UserRound,
			detail: ArrowDownZA
		},
		{ value: 'date-desc', label: $_('search.sort.date-desc'), icon: CalendarArrowDown },
		{ value: 'date-asc', label: $_('search.sort.date-asc'), icon: CalendarArrowUp }
	]);

	const toggles = [
		{ key: 'zeroWidth', label: 'search.filters.zero_width', icon: Layers2 },
		{ key: 'personal', label: 'search.filters.personal', icon: UserLock },
		{ key: 'exact', label: 'search.filters.exact', icon: Equal }
	] as const;

	function navigate() {
		const next = emoteSearchParams(options).toString();
		if (next === requested) return;

		requested = next;
		goto(resolve(`/emote/search?${next}`), { replace: true, reset: false });
	}

	const submit = debounce(navigate, 700);

	function update(changes: Partial<EmoteSearchOptions>) {
		options = { ...options, ...changes };
		submit.cancel();
		navigate();
	}

	function handleInput(value: string) {
		const text = value.trim();
		const emote = isLink(text) ? getEmoteByLink(text) : null;

		if (emote) {
			submit.cancel();
			goto(resolve('/emote/[provider]/[...id]', { provider: emote.provider, id: emote.id }));
			return;
		}

		options.query = isLink(text) ? text : value.replace(/\s+/g, '');
		submit();
	}

	function toggleProvider(name: SearchProvider) {
		const selected = options.providers.includes(name);
		if (selected && options.providers.length === 1) return;

		update({
			providers: selected
				? options.providers.filter((provider) => provider !== name)
				: searchProviders.filter((p) => p === name || options.providers.includes(p))
		});
	}

	function reset() {
		update({ ...defaultEmoteSearch, providers: [...searchProviders], query: options.query });
	}

	const providerList = (list: SearchProvider[]): string =>
		list.map((name) => $_(`provider.${name}`)).join(', ');

	const keyOf = (emote: SearchEmote) => `${emote.provider}:${emote.id}`;

	let first = $state<SearchEmote[]>([]);
	let more = $state<SearchEmote[]>([]);
	let cursor = $state<string | null>(null);
	let loading = $state(false);
	let stalled = $state(false);
	let failedMore = $state<SearchProvider[]>([]);
	let sentinel = $state<HTMLElement>();
	let generation = 0;

	$effect(() => {
		const current = data.result;
		const id = ++generation;

		first = [];
		more = [];
		cursor = null;
		stalled = false;
		failedMore = [];

		Promise.resolve(current)
			.then((result) => {
				if (id !== generation) return;
				first = result.emotes;
				cursor = result.next;
			})
			.catch(() => {});
	});

	async function loadMore() {
		if (loading || !cursor) return;

		const id = generation;
		const query = emoteSearchParams(data.options);
		query.set('cursor', cursor);
		loading = true;

		try {
			const res = await fetch(`${resolve('/api/emote/search')}?${query}`);
			if (!res.ok) throw new Error(`Search page answered ${res.status}`);

			const next: EmoteSearchResult = await res.json();
			if (id !== generation) return;

			const known = new Set([...first, ...more].map(keyOf));
			const fresh = next.emotes.filter((emote) => !known.has(keyOf(emote)));

			more = [...more, ...fresh];
			cursor = next.next;
			failedMore = next.failed;
			stalled = !fresh.length && !!next.next;
		} catch {
			if (id === generation) stalled = true;
		} finally {
			if (id === generation) loading = false;
		}
	}

	$effect(() => {
		const element = sentinel;
		if (!element || !cursor || stalled) return;

		const observer = new IntersectionObserver(
			(entries) => entries.some((entry) => entry.isIntersecting) && loadMore(),
			{ rootMargin: '0px 0px 800px 0px' }
		);

		observer.observe(element);
		return () => observer.disconnect();
	});

	$effect(() => {
		if (params !== requested) {
			requested = params;
			options = { ...data.options };
		}
	});

	onMount(() => submit.cancel);
</script>

<Seo
	{title}
	path="/emote/search"
	pageType={data.options.query ? 'SearchResultsPage' : 'CollectionPage'}
	description={$_('emote.search_description')}
	breadcrumbs={[{ name: $_('navbar.emotes'), path: '/emote' }, { name: $_('emote.search') }]}
	noindex={!!params}
	{schema}
/>

<div class="container-general">
	<div class="bg-neutral mx-auto w-full max-w-7xl space-y-5 rounded-xl p-4 shadow-md sm:p-6">
		<h1 class="text-3xl font-bold sm:text-4xl">{$_('emote.search')}</h1>

		<form
			class="space-y-3"
			method="get"
			onsubmit={(event) => (event.preventDefault(), submit.flush())}
		>
			<div class="flex flex-col gap-2 lg:flex-row">
				<label class="input bg-base-100 w-full lg:flex-1">
					<Search class="h-4 w-4 opacity-60" />
					<input
						type="search"
						name="q"
						autocomplete="off"
						maxlength="100"
						placeholder={$_('search.message')}
						value={options.query}
						oninput={(event) => handleInput(event.currentTarget.value)}
					/>
				</label>

				<div class="grid grid-cols-2 gap-2 lg:flex lg:shrink-0">
					<OptionDropdown
						class="lg:w-40"
						label={$_('search.filters.format')}
						value={options.format}
						options={formatOptions}
						onselect={(format) => update({ format })}
					/>
					<OptionDropdown
						class="lg:w-52"
						label={$_('search.sort.label')}
						value={options.sort}
						options={sortOptions}
						onselect={(sort) => update({ sort })}
					/>
				</div>
			</div>

			<div class="flex flex-wrap items-center gap-2">
				<div
					class="grid w-full grid-cols-4 gap-2 sm:flex sm:w-auto"
					role="group"
					aria-label={$_('search.filters.providers')}
				>
					{#each searchProviders as name (name)}
						{@const selected = options.providers.includes(name)}
						{@const available = supportsSearch(name, options)}
						{@const label = $_(`provider.${name}`)}
						<button
							type="button"
							class="btn btn-sm"
							class:btn-primary={selected}
							class:btn-soft={!selected}
							class:opacity-50={selected && !available}
							aria-pressed={selected}
							aria-label={label}
							title={selected && !available
								? $_('search.skipped', { values: { providers: label } })
								: label}
							onclick={() => toggleProvider(name)}
						>
							<img
								src={`/logos/${name}.svg`}
								alt=""
								class="h-4 w-4"
								draggable="false"
							/>
							<span class="hidden md:inline">{label}</span>
						</button>
					{/each}
				</div>

				<div class="divider divider-horizontal mx-0 hidden h-6 sm:flex"></div>

				<div
					class="flex flex-wrap gap-2"
					role="group"
					aria-label={$_('search.filters.label')}
				>
					{#each toggles as toggle (toggle.key)}
						{@const active = options[toggle.key]}
						<button
							type="button"
							class="btn btn-sm"
							class:btn-secondary={active}
							class:btn-soft={!active}
							aria-pressed={active}
							onclick={() => update({ [toggle.key]: !active })}
						>
							<toggle.icon class="h-4 w-4" />
							{$_(toggle.label)}
						</button>
					{/each}
				</div>

				{#if customized}
					<button type="button" class="btn btn-ghost btn-sm sm:ml-auto" onclick={reset}>
						<RotateCcw class="h-4 w-4" />
						{$_('search.filters.reset')}
					</button>
				{/if}
			</div>
		</form>

		{#await data.result}
			{@render heading()}
			{@render results(true)}
		{:then result}
			{@render heading(result.emotes.length + more.length)}

			{#if result.failed.length}
				{@render failure(result.failed)}
			{/if}
			{#if result.skipped.length}
				<div role="status" class="alert alert-info alert-soft text-sm">
					<Info class="h-5 w-5 shrink-0" />
					<span>
						{$_('search.skipped', {
							values: { providers: providerList(result.skipped) }
						})}
					</span>
				</div>
			{/if}

			{#if result.emotes.length}
				{@render results(false, [...result.emotes, ...more])}

				<div bind:this={sentinel} class="flex min-h-10 flex-col items-center gap-3">
					{#if loading}
						<span class="loading loading-dots loading-md text-primary"></span>
					{:else if stalled}
						{#if failedMore.length}
							{@render failure(failedMore)}
						{/if}
						<button
							type="button"
							class="btn btn-sm btn-primary btn-soft"
							onclick={() => ((stalled = false), loadMore())}
						>
							{$_('search.load_more')}
						</button>
					{:else if !cursor && more.length}
						<span class="text-base-content/60 text-sm">{$_('search.end')}</span>
					{/if}
				</div>
			{:else}
				<SearchError search={data.options.query} />
			{/if}
		{:catch}
			<SearchError search={data.options.query} />
		{/await}
	</div>
</div>

{#snippet heading(count?: number)}
	<h2 class="flex items-center gap-2 text-xl font-semibold sm:text-2xl">
		{#if data.options.query}
			{#if count === undefined}
				<span class="skeleton h-7 w-32"></span>
			{:else}
				{$_('search.results', { values: { count } })}
			{/if}
		{:else}
			<Flame class="text-warning h-6 w-6" />
			{$_('search.trending')}
		{/if}
	</h2>
{/snippet}

{#snippet failure(providers: SearchProvider[])}
	<div role="alert" class="alert alert-warning alert-soft w-full text-sm">
		<TriangleAlert class="h-5 w-5 shrink-0" />
		<span>{$_('search.failed', { values: { providers: providerList(providers) } })}</span>
	</div>
{/snippet}

{#snippet results(isLoading: boolean, emotes: SearchEmote[] = [])}
	<div class="bg-base-100 rounded-lg p-4">
		<ImageGrid
			linkPrefix="emote"
			placeholderCount={36}
			items={emotes}
			logo={true}
			{isLoading}
		/>
	</div>
{/snippet}
