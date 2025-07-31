<script lang="ts">
	const { onPrevPage, onNextPage, itemsPerPage, currentPage, totalItems, maxPage } = $props<{
		onPrevPage: () => void;
		onNextPage: () => void;
		itemsPerPage: number;
		currentPage: number;
		totalItems: number;
		maxPage?: number;
	}>();

	const calculatedMaxPage = $derived(maxPage ?? Math.ceil(totalItems / itemsPerPage));
</script>

<div
	class="mx-auto mb-4 flex w-full justify-center sm:mx-auto sm:mb-4 sm:flex sm:w-full sm:justify-center md:absolute md:top-0 md:right-0 md:mx-0 md:mb-0 md:w-auto"
>
	<div class="join flex w-full md:inline-flex md:w-auto">
		<button
			class="join-item btn btn-sm w-full flex-1 md:w-auto md:flex-none"
			onclick={onPrevPage}
			disabled={currentPage === 1}
		>
			«
		</button>
		<button
			class="join-item btn btn-sm btn-disabled w-full flex-1 text-xs sm:text-sm md:w-auto md:flex-none"
		>
			{currentPage}
		</button>
		<button
			class="join-item btn btn-sm w-full flex-1 md:w-auto md:flex-none"
			onclick={onNextPage}
			disabled={currentPage >= calculatedMaxPage}
		>
			»
		</button>
	</div>
</div>
