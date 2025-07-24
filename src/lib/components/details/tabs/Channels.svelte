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
		onNextPage
	}: {
		isActive: boolean;
		isLoading: boolean;
		currentPage: number;
		channels: Channel[];
		totalChannels: number;
		itemsPerPage: number;
		onPrevPage: () => void;
		onNextPage: () => void;
	} = $props();

	const paginatedChannels = $derived(
		channels.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
	);
</script>

<TabContent {isActive}>
	<Pagination {currentPage} totalItems={totalChannels} {itemsPerPage} {onPrevPage} {onNextPage} />

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
