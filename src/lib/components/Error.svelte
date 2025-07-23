<script lang="ts">
	import { _ } from 'svelte-i18n';

	export let error: string;
</script>

<div class="alert alert-error max-w-7xl space-y-6 rounded-xl p-6 text-center shadow-md">
	<div class="m-0 flex w-full flex-1 items-center justify-center">
		<img
			src="/assets/dank.svg"
			alt="FeelsDankMan"
			draggable="false"
			class="h-auto max-h-[60vh] w-full object-contain"
		/>
	</div>
	<div>
		<h1 class="text-6xl font-bold">{$_('common.error')}</h1>
		<span class="text-2xl">{error}</span>
	</div>
</div>
