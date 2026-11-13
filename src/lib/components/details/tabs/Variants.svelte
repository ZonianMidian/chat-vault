<script lang="ts">
	import type { Variant } from '#lib/types/common.ts';

	import TabContent from '#lib/components/TabContent.svelte';
	import Pagination from '#lib/components/Pagination.svelte';
	import ImageGrid from '#lib/components/ImageGrid.svelte';

	let { variants, isActive }: { variants: Variant[]; isActive: boolean } = $props();

	const itemsPerPage = 18;

	let currentPage = $state(1);

	const maxPage = $derived(Math.ceil(variants.length / itemsPerPage));
	const pageItems = $derived(
		variants.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
	);
</script>

<TabContent {isActive}>
	<Pagination
		{currentPage}
		totalItems={variants.length}
		{itemsPerPage}
		{maxPage}
		onPrevPage={() => (currentPage = Math.max(1, currentPage - 1))}
		onNextPage={() => (currentPage = Math.min(maxPage, currentPage + 1))}
	/>

	<ImageGrid items={pageItems} linkPrefix="emote" />
</TabContent>
