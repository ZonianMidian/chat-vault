<script lang="ts">
	import ImageGrid from '#lib/components/ImageGrid.svelte';
</script>

<div class="container-general">
	<div class="bg-neutral mx-auto w-full max-w-7xl space-y-6 rounded-xl p-6 shadow-md">
		<div class="skeleton h-50 w-full rounded-sm sm:h-70"></div>

		<div class="container mx-auto -mt-14 px-4 md:px-8 lg:px-16">
			<div class="flex flex-col items-center md:flex-row">
				<div class="skeleton h-38 w-38 rounded-sm"></div>
				<div class="mt-2 ml-0 space-y-2 md:mt-10 md:ml-6">
					<div class="skeleton h-8 w-48"></div>
					<div class="skeleton h-4 w-32"></div>
					<div class="skeleton h-4 w-24"></div>
				</div>
			</div>
		</div>

		<div class="bg-base-100 rounded-lg p-4">
			<ImageGrid isLoading={true} placeholderCount={36} />
		</div>
	</div>
</div>
