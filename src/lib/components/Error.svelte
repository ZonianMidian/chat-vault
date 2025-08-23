<script lang="ts">
	import { _ } from 'svelte-i18n';

	export let error: string;
</script>

<div
	class="alert alert-error flex max-w-7xl justify-center space-y-6 rounded-xl p-6 text-center shadow-md"
>
	<div>
		<img
			src="/assets/dank.svg"
			alt="FeelsDankMan"
			draggable="false"
			class="h-70 w-full object-contain"
		/>
	</div>
	<div>
		<h1 class="text-6xl font-bold">{$_('common.error')}</h1>
		<span class="text-2xl">{error}</span>
	</div>
</div>
