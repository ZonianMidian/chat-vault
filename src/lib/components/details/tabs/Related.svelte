<script lang="ts">
	import type { Badges, Emotes } from '$lib/types/common';

	import TabContent from '$lib/components/TabContent.svelte';
	import Pagination from '$lib/components/Pagination.svelte';
	import ImageGrid from '$lib/components/ImageGrid.svelte';

	export let relatedEmotes: Emotes[] | Badges[] = [];
	export let type: 'emote' | 'badge';
	export let totalRelated: number;
	export let itemsPerPage: number;
	export let currentPage: number;
	export let isLoading: boolean;
	export let isActive: boolean;

	export let onPrevPage: () => void;
	export let onNextPage: () => void;

	$: paginatedEmotes = relatedEmotes.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage
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
