<script lang="ts">
	import { inlineSvg } from '@svelte-put/inline-svg';
	import { displayImage } from '#lib/utils/index.ts';
	import { untrack } from 'svelte';

	let {
		src,
		alt,
		fallback,
		framed = false
	}: {
		src: string;
		alt: string;
		fallback: string;
		framed?: boolean;
	} = $props();

	const shown = $derived(displayImage(src));

	let element = $state<HTMLImageElement>();
	let status = $state<'loading' | 'loaded' | 'error'>('loading');

	$effect(() => {
		const url = shown;

		untrack(() => {
			const img = element;

			if (img?.complete && img.naturalWidth > 0) {
				status = 'loaded';
				return;
			}

			status = 'loading';

			if (img?.complete) {
				img.src = url;
			}
		});
	});
</script>

{#if status === 'error'}
	<div class:rounded-xs={framed} class:bg-base-100={framed}>
		<svg class="h-16 w-16 object-contain" use:inlineSvg={fallback} />
	</div>
{:else}
	<div class="relative h-16 w-16">
		{#if status === 'loading'}
			<div class="absolute inset-0 flex items-center justify-center">
				<div class="skeleton h-16 w-16 rounded-xs"></div>
			</div>
		{/if}

		<img
			bind:this={element}
			class="relative h-16 w-16 rounded-xs object-contain transition-opacity duration-200"
			class:opacity-0={status !== 'loaded'}
			src={shown}
			{alt}
			onerror={() => (status = 'error')}
			onload={() => (status = 'loaded')}
			loading="lazy"
		/>
	</div>
{/if}
