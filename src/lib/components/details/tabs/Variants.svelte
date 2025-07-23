<script lang="ts">
	import type { Variant } from '$lib/types/common';

	import TabContent from '$lib/components/TabContent.svelte';
	import Pagination from '$lib/components/Pagination.svelte';
	import ImageGrid from '$lib/components/ImageGrid.svelte';

	export let variantImages: Map<string, string>;
	export let onPrevPage: () => void;
	export let onNextPage: () => void;
	export let itemsPerPage: number;
	export let currentPage: number;
	export let isLoading: boolean;
	export let isActive: boolean;
	export let emoteName: string;
	export let emoteId: string;

	$: variantItems = Array.from(variantImages.entries())
		.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
		.map(([variant, url]) => ({
			id: `${emoteId}${variant.length ? `_${variant}` : ''}`,
			image: url,
			name: `${emoteName.replace(/_[A-Z]{2}$/, '')}${variant.length ? `_${variant}` : ''}`,
			provider: 'twitch',
			variant
		})) as Variant[];
</script>

<TabContent {isActive}>
	<Pagination
		{currentPage}
		totalItems={variantImages.size}
		{itemsPerPage}
		{onPrevPage}
		{onNextPage}
	/>

	<ImageGrid {isLoading} items={variantItems} linkPrefix="emote" />
</TabContent>
