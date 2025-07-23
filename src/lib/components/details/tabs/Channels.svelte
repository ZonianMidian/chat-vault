<script lang="ts">
	import type { Channel } from '$lib/types/common';

	import TabContent from '$lib/components/TabContent.svelte';
	import Pagination from '$lib/components/Pagination.svelte';
	import ImageGrid from '$lib/components/ImageGrid.svelte';

	export let isActive: boolean;
	export let isLoading: boolean;
	export let currentPage: number;
	export let channels: Channel[];
	export let totalChannels: number;
	export let itemsPerPage: number;
	export let onPrevPage: () => void;
	export let onNextPage: () => void;

	$: paginatedChannels = channels.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage
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
