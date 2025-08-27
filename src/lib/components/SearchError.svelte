<script lang="ts">
	import { _ } from 'svelte-i18n';

	export let search: string;
</script>

<div
	class="alert alert-info flex max-w-7xl flex-col justify-center rounded-xl p-6 text-center shadow-md sm:flex-row"
>
	<div>
		<img
			src="/assets/dank.svg"
			alt="FeelsDankMan"
			draggable="false"
			class="h-30 w-full object-contain sm:h-70"
		/>
	</div>
	<div>
		<h1 class="text-3xl font-bold sm:text-6xl">{$_('common.no_results')}</h1>
		<span class="text-md break-all sm:text-2xl sm:break-normal"
			>{search?.length ? `"${search}"` : ''}</span
		>
	</div>
</div>
