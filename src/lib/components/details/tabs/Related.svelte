<script lang="ts">
	import type { Badges, Emotes } from '#lib/types/common.ts';

	import TabContent from '#lib/components/TabContent.svelte';
	import Pagination from '#lib/components/Pagination.svelte';
	import ImageGrid from '#lib/components/ImageGrid.svelte';

	let {
		items,
		type,
		isActive
	}: {
		items: Emotes[] | Badges[];
		type: 'emote' | 'badge';
		isActive: boolean;
	} = $props();

	const itemsPerPage = 18;

	let currentPage = $state(1);

	const maxPage = $derived(Math.ceil(items.length / itemsPerPage));
	const pageItems = $derived(
		items.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
	);
</script>

<TabContent {isActive}>
	<Pagination
		{currentPage}
		totalItems={items.length}
		{itemsPerPage}
		{maxPage}
		onPrevPage={() => (currentPage = Math.max(1, currentPage - 1))}
		onNextPage={() => (currentPage = Math.min(maxPage, currentPage + 1))}
	/>

	<ImageGrid
		logo={true}
		linkPrefix={type}
		items={pageItems}
		nameKey={type === 'emote' ? 'name' : 'title'}
		versionKey={type === 'badge' ? 'version' : null}
	/>
</TabContent>
