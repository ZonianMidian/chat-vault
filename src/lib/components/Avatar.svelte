<script lang="ts">
	import { displayImage } from '#lib/utils/index.ts';
	import { untrack } from 'svelte';

	let {
		src,
		alt,
		class: size = 'h-12 w-12'
	}: {
		src: string | undefined;
		alt: string;
		class?: string;
	} = $props();

	const fallback = '/assets/avatar.svg';
	const shown = $derived(src && displayImage(src));

	let element = $state<HTMLImageElement>();
	let loaded = $state(false);
	let failed = $state(false);

	$effect(() => {
		const url = shown;

		untrack(() => {
			failed = !url;
			loaded = failed || (!!element?.complete && element.naturalWidth > 0);

			if (!loaded && element?.complete && url) {
				element.src = url;
			}
		});
	});
</script>

<div class="relative {size} shrink-0">
	{#if !loaded}
		<div class="skeleton absolute inset-0 rounded-sm"></div>
	{/if}
	<img
		bind:this={element}
		src={failed ? fallback : shown}
		{alt}
		class="{size} rounded-sm"
		class:opacity-0={!loaded}
		class:bg-base-200={failed}
		onload={() => (loaded = true)}
		onerror={() => {
			failed = true;
			loaded = true;
		}}
	/>
</div>
