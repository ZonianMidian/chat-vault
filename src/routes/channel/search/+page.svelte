<script lang="ts">
	import type { DropdownOption } from '#lib/components/OptionDropdown.svelte';
	import type { User } from '#lib/types/common.ts';
	import type {
		ChannelSearchOptions,
		ChannelSearchResult,
		ChannelPlatform,
		ChannelSort
	} from '#lib/channels/search.ts';

	import { getChannelInfo, isLink } from '#lib/channels/getChannelByLink.ts';
	import { debounce } from '#lib/utils/index.ts';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import { _ } from 'svelte-i18n';
	import {
		defaultChannelSearch,
		channelSearchParams,
		channelPlatforms
	} from '#lib/channels/search.ts';
	import {
		TriangleAlert,
		ArrowDown01,
		ArrowDown10,
		ArrowDownAZ,
		ArrowDownZA,
		RotateCcw,
		Sparkles,
		Search,
		Flame,
		Users
	} from '@lucide/svelte';

	import OptionDropdown from '#lib/components/OptionDropdown.svelte';
	import SearchError from '#lib/components/SearchError.svelte';
	import ImageGrid from '#lib/components/ImageGrid.svelte';
	import Seo from '#lib/components/Seo.svelte';

	let { data } = $props();

	// svelte-ignore state_referenced_locally
	let options = $state<ChannelSearchOptions>({ ...data.options });
	// svelte-ignore state_referenced_locally
	let requested = channelSearchParams(data.options).toString();

	const params = $derived(channelSearchParams(data.options).toString());
	const customized = $derived(channelSearchParams({ ...options, query: '' }).toString() !== '');

	const title = $derived(
		`${$_('channel.search')}${data.options.query ? `: ${data.options.query}` : ''}`
	);

	const sortOptions = $derived<DropdownOption<ChannelSort>[]>([
		{ value: 'relevance', label: $_('search.sort.relevance'), icon: Sparkles },
		{ value: 'name-asc', label: $_('search.sort.name-asc'), icon: ArrowDownAZ },
		{ value: 'name-desc', label: $_('search.sort.name-desc'), icon: ArrowDownZA },
		{
			value: 'followers-desc',
			label: $_('search.sort.followers-desc'),
			icon: Users,
			detail: ArrowDown10
		},
		{
			value: 'followers-asc',
			label: $_('search.sort.followers-asc'),
			icon: Users,
			detail: ArrowDown01
		}
	]);

	const keyOf = (channel: User) => `${channel.platform}:${channel.id ?? channel.username}`;

	let first = $state<User[]>([]);
	let more = $state<User[]>([]);
	let cursor = $state<string | null>(null);
	let loading = $state(false);
	let stalled = $state(false);
	let sentinel = $state<HTMLElement>();
	let generation = 0;

	$effect(() => {
		const current = data.result;
		const id = ++generation;

		first = [];
		more = [];
		cursor = null;
		stalled = false;

		Promise.resolve(current)
			.then((result) => {
				if (id !== generation) return;
				first = result.channels;
				cursor = result.next;
			})
			.catch(() => {});
	});

	async function loadMore() {
		if (loading || !cursor) return;

		const id = generation;
		const query = channelSearchParams(data.options);
		query.set('cursor', cursor);
		loading = true;

		try {
			const res = await fetch(`${resolve('/api/channel/search')}?${query}`);
			if (!res.ok) throw new Error(`Channel page answered ${res.status}`);

			const next: ChannelSearchResult = await res.json();
			if (id !== generation) return;

			const known = new Set([...first, ...more].map(keyOf));
			const fresh = next.channels.filter((channel) => !known.has(keyOf(channel)));

			more = [...more, ...fresh];
			cursor = next.next;
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

	function navigate() {
		const next = channelSearchParams(options).toString();
		if (next === requested) return;

		requested = next;
		goto(resolve(`/channel/search?${next}`), { replace: true, reset: false });
	}

	const submit = debounce(navigate, 600);

	function update(changes: Partial<ChannelSearchOptions>) {
		options = { ...options, ...changes };
		submit.cancel();
		navigate();
	}

	function cleanSearchText(text: string): string {
		return text.replace(/\s+/g, '').replace(/[^a-zA-Z0-9\-_.@]/g, '');
	}

	function handleInput(value: string) {
		const text = value.trim();
		const channel = isLink(text) ? getChannelInfo(text) : null;

		if (channel) {
			submit.cancel();
			goto(
				resolve('/channel/[provider]/[login]', {
					provider: channel.platform,
					login: channel.username
				})
			);
			return;
		}

		options.query = isLink(text) ? text : cleanSearchText(value);
		submit();
	}

	function togglePlatform(name: ChannelPlatform) {
		const selected = options.platforms.includes(name);
		if (selected && options.platforms.length === 1) return;

		update({
			platforms: selected
				? options.platforms.filter((platform) => platform !== name)
				: channelPlatforms.filter((p) => p === name || options.platforms.includes(p))
		});
	}

	function reset() {
		update({ ...defaultChannelSearch, platforms: [...channelPlatforms], query: options.query });
	}

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
	path="/channel/search"
	pageType={data.options.query ? 'SearchResultsPage' : 'CollectionPage'}
	description={$_('landing.features.channels.description')}
	breadcrumbs={[{ name: $_('navbar.channels') }]}
	noindex={!!params}
/>

<div class="container-general">
	<div class="bg-neutral mx-auto w-full max-w-7xl space-y-5 rounded-xl p-4 shadow-md sm:p-6">
		<h1 class="text-3xl font-bold sm:text-4xl">{$_('channel.search')}</h1>

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
						placeholder={$_('search.message')}
						value={options.query}
						oninput={(event) => handleInput(event.currentTarget.value)}
					/>
				</label>

				<OptionDropdown
					class="lg:w-56"
					label={$_('search.sort.label')}
					value={options.sort}
					options={sortOptions}
					onselect={(sort) => update({ sort })}
				/>
			</div>

			<div class="flex flex-wrap items-center gap-2">
				<div
					class="grid w-full grid-cols-3 gap-2 sm:flex sm:w-auto"
					role="group"
					aria-label={$_('search.filters.platforms')}
				>
					{#each channelPlatforms as name (name)}
						{@const selected = options.platforms.includes(name)}
						<button
							type="button"
							class="btn btn-sm"
							class:btn-primary={selected}
							class:btn-soft={!selected}
							aria-pressed={selected}
							onclick={() => togglePlatform(name)}
						>
							<img
								src={`/logos/${name}.svg`}
								alt=""
								class="h-4 w-4"
								draggable="false"
							/>
							{$_(`provider.${name}`)}
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
			{@render section(true)}
		{:then result}
			{#if result.failed.length}
				<div role="alert" class="alert alert-warning alert-soft text-sm">
					<TriangleAlert class="h-5 w-5 shrink-0" />
					<span>
						{$_('search.failed', {
							values: {
								providers: result.failed.map((p) => $_(`provider.${p}`)).join(', ')
							}
						})}
					</span>
				</div>
			{/if}

			{#if result.channels.length}
				{@render section(false, [...result.channels, ...more])}

				{#if !data.options.query}
					<div bind:this={sentinel} class="flex min-h-10 flex-col items-center gap-3">
						{#if loading}
							<span class="loading loading-dots loading-md text-primary"></span>
						{:else if stalled}
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
				{/if}
			{:else}
				<SearchError search={data.options.query} />
			{/if}
		{:catch}
			<SearchError search={data.options.query} />
		{/await}
	</div>
</div>

{#snippet section(isLoading: boolean, channels: User[] = [])}
	<section class="space-y-3">
		{#if !data.options.query}
			<h2 class="flex items-center gap-2 text-xl font-semibold sm:text-2xl">
				<Flame class="text-warning h-6 w-6" />
				{$_('search.trending')}
			</h2>
		{/if}

		<div class="bg-base-100 rounded-lg p-4">
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
	</section>
{/snippet}
