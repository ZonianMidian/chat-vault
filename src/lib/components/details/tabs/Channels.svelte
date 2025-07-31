<script lang="ts">
	import type { Channel } from '$lib/types/common';

	import TabContent from '$lib/components/TabContent.svelte';
	import Pagination from '$lib/components/Pagination.svelte';
	import ImageGrid from '$lib/components/ImageGrid.svelte';

	let {
		isActive,
		isLoading,
		currentPage,
		channels,
		totalChannels,
		itemsPerPage,
		onPrevPage,
		onNextPage,
		provider
	}: {
		isActive: boolean;
		isLoading: boolean;
		currentPage: number;
		channels: Channel[];
		totalChannels: number;
		itemsPerPage: number;
		onPrevPage: () => void;
		onNextPage: () => void;
		provider: string | null;
	} = $props();

	const paginatedChannels = $derived(
		channels.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
	);

	const maxPage = $derived(provider === '7tv' ? 10 : Math.ceil(totalChannels / itemsPerPage));
</script>

<TabContent {isActive}>
	<Pagination
		{currentPage}
		totalItems={totalChannels}
		{itemsPerPage}
		{onPrevPage}
		{onNextPage}
		{maxPage}
	/>

	<ImageGrid
		items={paginatedChannels}
		providerKey="platform"
		linkPrefix="channel"
		nameKey="username"
		imageKey="avatar"
		idKey="username"
		{isLoading}
	/>
</TabContent>
