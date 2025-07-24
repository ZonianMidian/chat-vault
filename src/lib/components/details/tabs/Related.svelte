<script lang="ts">
	import type { Badges, Emotes } from '$lib/types/common';

	import TabContent from '$lib/components/TabContent.svelte';
	import Pagination from '$lib/components/Pagination.svelte';
	import ImageGrid from '$lib/components/ImageGrid.svelte';

	let {
		relatedEmotes = [],
		type,
		totalRelated,
		itemsPerPage,
		currentPage,
		isLoading,
		isActive,
		onPrevPage,
		onNextPage
	}: {
		relatedEmotes?: Emotes[] | Badges[];
		type: 'emote' | 'badge';
		totalRelated: number;
		itemsPerPage: number;
		currentPage: number;
		isLoading: boolean;
		isActive: boolean;
		onPrevPage: () => void;
		onNextPage: () => void;
	} = $props();

	const paginatedEmotes = $derived(
		relatedEmotes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
	);
</script>

<TabContent {isActive}>
	<Pagination {currentPage} totalItems={totalRelated} {itemsPerPage} {onPrevPage} {onNextPage} />

	<ImageGrid
		{isLoading}
		logo={true}
		linkPrefix={type}
		placeholderCount={9}
		items={paginatedEmotes}
		nameKey={type === 'emote' ? 'name' : 'title'}
		versionKey={type === 'badge' ? 'version' : null}
	/>
</TabContent>
