<script lang="ts">
	import { getChannelInfo, isLink } from '#lib/channels/getChannelByLink.ts';
	import { debounce } from '#lib/utils/index.ts';
	import { Search, Info } from '@lucide/svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import { _ } from 'svelte-i18n';

	import SearchError from '#lib/components/SearchError.svelte';
	import ImageGrid from '#lib/components/ImageGrid.svelte';
	import Seo from '#lib/components/Seo.svelte';

	let { data } = $props();

	// svelte-ignore state_referenced_locally
	let search = $state(data.query);
	// svelte-ignore state_referenced_locally
	let requested = data.query;

	const title = $derived(`${$_('channel.search')}${data.query ? `: ${data.query}` : ''}`);

	const submit = debounce((term: string) => {
		requested = term;

		const channel = isLink(term) ? getChannelInfo(term) : null;
		const target = channel
			? resolve('/channel/[provider]/[login]', {
					provider: channel.platform,
					login: channel.username
				})
			: resolve(`channel/search${term ? `?q=${encodeURIComponent(term)}` : '?'}`);

		goto(target, { replace: !channel, reset: false });
	}, 600);

	function cleanSearchText(text: string): string {
		return text.replace(/\s+/g, '').replace(/[^a-zA-Z0-9\-_.@]/g, '');
	}

	function handleInput(value: string) {
		const term = isLink(value.trim()) ? value.trim() : cleanSearchText(value);

		search = term;
		submit(term);
	}

	$effect(() => {
		if (data.query !== requested) {
			requested = data.query;
			search = data.query;
		}
	});

	onMount(() => submit.cancel);
</script>

<Seo
	{title}
	path="/channel/search"
	pageType={data.query ? 'SearchResultsPage' : 'WebPage'}
	description={$_('landing.features.channels.description')}
	breadcrumbs={[{ name: $_('navbar.channels') }]}
	noindex={!!data.query}
/>

<div class="container-general">
	<div class="bg-neutral mx-auto w-full max-w-7xl space-y-6 rounded-xl p-6 shadow-md">
		<h1 class="text-4xl font-bold sm:text-left">{$_('channel.search')}</h1>

		<form
			class="flex"
			method="get"
			onsubmit={(event) => (event.preventDefault(), submit.flush())}
		>
			<label class="input w-full max-w-md">
				<Search />
				<input
					type="search"
					name="q"
					required
					autocomplete="off"
					placeholder={$_('search.channel')}
					value={search}
					oninput={(event) => handleInput(event.currentTarget.value)}
				/>
			</label>
		</form>

		{#if data.query}
			{#await data.channels}
				{@render results(true)}
			{:then channels}
				{#if channels.length}
					{@render results(false, channels)}
				{:else}
					<SearchError search={data.query} />
				{/if}
			{:catch}
				<SearchError search={data.query} />
			{/await}
		{:else}
			<div class="alert alert-dash max-sm:alert-vertical alert-warning text-sm font-medium">
				<div class="flex items-center justify-center gap-3">
					<Info class="h-5 w-5 shrink-0" />
					<span class="text-xl">
						{$_('search.message')}
					</span>
				</div>
			</div>
		{/if}
	</div>
</div>

{#snippet results(isLoading: boolean, channels: Awaited<typeof data.channels> = [])}
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
{/snippet}
