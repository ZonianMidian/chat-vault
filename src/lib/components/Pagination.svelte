<script lang="ts">
	export let onPrevPage: () => void;
	export let onNextPage: () => void;
	export let itemsPerPage: number;
	export let currentPage: number;
	export let totalItems: number;

	$: maxPage = Math.ceil(totalItems / itemsPerPage);
</script>

<div
	class="mx-auto mb-4 flex w-full justify-center sm:mx-auto sm:mb-4 sm:flex sm:w-full sm:justify-center md:absolute md:top-0 md:right-0 md:mx-0 md:mb-0 md:w-auto"
>
	<div class="join flex w-full md:inline-flex md:w-auto">
		<button
			class="join-item btn btn-sm w-full flex-1 md:w-auto md:flex-none"
			on:click={onPrevPage}
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
			on:click={onNextPage}
			disabled={currentPage >= maxPage}
		>
			»
		</button>
	</div>
</div>
