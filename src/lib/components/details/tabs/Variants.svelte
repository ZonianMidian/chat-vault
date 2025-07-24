<script lang="ts">
	import type { Variant } from '$lib/types/common';

	import TabContent from '$lib/components/TabContent.svelte';
	import Pagination from '$lib/components/Pagination.svelte';
	import ImageGrid from '$lib/components/ImageGrid.svelte';

	let {
		variantImages,
		onPrevPage,
		onNextPage,
		itemsPerPage,
		currentPage,
		isLoading,
		isActive,
		emoteName,
		emoteId
	}: {
		variantImages: Map<string, string>;
		onPrevPage: () => void;
		onNextPage: () => void;
		itemsPerPage: number;
		currentPage: number;
		isLoading: boolean;
		isActive: boolean;
		emoteName: string;
		emoteId: string;
	} = $props();

	const variantItems = $derived(() => {
		return Array.from(variantImages.entries())
			.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
			.map(([variant, url]) => ({
				id: `${emoteId}${variant.length ? `_${variant}` : ''}`,
				image: url,
				name: `${emoteName.replace(/_[A-Z]{2}$/, '')}${variant.length ? `_${variant}` : ''}`,
				provider: 'twitch',
				variant
			})) as Variant[];
	});
</script>

<TabContent {isActive}>
	<Pagination
		{currentPage}
		totalItems={variantImages.size}
		{itemsPerPage}
		{onPrevPage}
		{onNextPage}
	/>

	<ImageGrid {isLoading} items={variantItems()} linkPrefix="emote" />
</TabContent>
