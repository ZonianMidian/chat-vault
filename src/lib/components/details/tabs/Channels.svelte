<script lang="ts">
	import type { Channel, Channels } from '#lib/types/common.ts';

	import { onMount } from 'svelte';

	import TabContent from '#lib/components/TabContent.svelte';
	import Pagination from '#lib/components/Pagination.svelte';
	import ImageGrid from '#lib/components/ImageGrid.svelte';

	let {
		isActive,
		provider,
		emoteId,
		initial
	}: {
		isActive: boolean;
		provider: string;
		emoteId: string;
		initial: Channels;
	} = $props();

	const itemsPerPage = 18;
	const pageLimit = $derived(provider === '7tv' ? 10 : Infinity);

	// svelte-ignore state_referenced_locally
	let channels = $state.raw<Channel[]>(initial.list);
	let isLoading = $state(false);
	let currentPage = $state(1);

	const requestedPages: Record<number, boolean> = {};

	const maxPage = $derived(Math.min(pageLimit, Math.ceil(initial.total / itemsPerPage)));
	const pageChannels = $derived(
		channels.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
	);

	async function loadMore() {
		const page = currentPage;
		if (requestedPages[page]) return;

		requestedPages[page] = true;
		isLoading = true;

		try {
			let query = `provider=${provider}&id=${encodeURIComponent(emoteId)}&page=${page}`;

			const cursor = channels.at(-1)?.posId;
			if (cursor) query += `&before=${encodeURIComponent(cursor)}`;

			const res = await fetch(`/api/emote/channels?${query}`);
			if (!res.ok) throw new Error(`Request failed: ${res.status}`);

			const { list }: Channels = await res.json();
			const known = new Set(channels.map((channel) => channel.id));

			channels = [...channels, ...list.filter((channel) => !known.has(channel.id))];
		} catch (err) {
			requestedPages[page] = false;
			console.error('[Emote] Channels:', err);
		} finally {
			isLoading = false;
		}
	}

	async function nextPage() {
		if (currentPage >= maxPage) return;

		currentPage++;

		if (channels.length < initial.total) {
			await loadMore();
		}
	}

	function prevPage() {
		if (currentPage > 1) currentPage--;
	}

	onMount(() => {
		if (initial.total > 0 && channels.length === 0) {
			loadMore();
		}
	});
</script>

<TabContent {isActive}>
	<Pagination
		{currentPage}
		totalItems={initial.total}
		{itemsPerPage}
		onPrevPage={prevPage}
		onNextPage={nextPage}
		{maxPage}
	/>

	<ImageGrid
		items={pageChannels}
		providerKey="platform"
		linkPrefix="channel"
		nameKey="username"
		imageKey="avatar"
		idKey="username"
		{isLoading}
	/>
</TabContent>
