<script lang="ts">
	import type { Sizes } from '#lib/types/common.ts';

	import { displayImage, getImageInfo } from '#lib/utils/index.ts';
	import { inlineSvg } from '@svelte-put/inline-svg';
	import { untrack } from 'svelte';
	import { _ } from 'svelte-i18n';

	let {
		image,
		name,
		fallbackSize,
		keepSize = false,
		proxy = false,
		dark = null
	}: {
		image: string;
		name: string;
		fallbackSize: { width: number; height: number };
		keepSize?: boolean;
		proxy?: boolean;
		dark?: boolean | null;
	} = $props();

	let element = $state<HTMLImageElement>();
	let info = $state<Sizes | null>(null);
	let loaded = $state(false);
	let directFailed = $state(false);
	let blobFailed = $state(false);

	const blob = $derived(info?.objectUrl.startsWith('blob:') ? info.objectUrl : null);
	const failed = $derived(blobFailed || (directFailed && info !== null && !blob));

	const shown = $derived(displayImage(image));
	const source = $derived(directFailed && blob ? blob : shown);

	function handleError() {
		if (source === shown) directFailed = true;
		else blobFailed = true;
	}

	const width = $derived(keepSize ? fallbackSize.width : (info?.width ?? fallbackSize.width));
	const height = $derived(keepSize ? fallbackSize.height : (info?.height ?? fallbackSize.height));

	$effect(() => {
		const url = image;
		const visible = shown;
		let objectUrl: string | null = null;
		let active = true;

		const release = (target: string | null) => {
			if (target?.startsWith('blob:')) URL.revokeObjectURL(target);
		};

		untrack(() => {
			info = null;
			directFailed = false;
			blobFailed = false;
			loaded = !!element?.complete && element.naturalWidth > 0;

			if (!loaded && element?.complete) {
				element.src = visible;
			}
		});

		getImageInfo(url, proxy).then((result) => {
			if (!active) return release(result.objectUrl);

			objectUrl = result.objectUrl;
			info = result;
		});

		return () => {
			active = false;
			release(objectUrl);
		};
	});
</script>

<div class="flex h-auto flex-col items-center justify-center">
	<div style="width: {width}px; height: {height}px;" class="flex items-center justify-center">
		<div class="relative flex h-full w-full items-center justify-center">
			{#if !loaded && !failed}
				<div class="skeleton absolute inset-0 z-0 h-full w-full rounded"></div>
			{/if}
			<a
				href={image}
				target="_blank"
				rel="external noopener noreferrer"
				class="relative z-10 transition-opacity hover:opacity-80"
				aria-label={name}
			>
				{#if failed}
					<svg
						{width}
						{height}
						use:inlineSvg={'/assets/error.svg'}
						class:text-base-content={dark === null}
						class:text-[#0c0c16]={dark === false}
						class:text-[#eff1f5]={dark === true}
					/>
				{:else}
					<img
						bind:this={element}
						src={source}
						class:shadow={dark === false}
						alt={name}
						{width}
						{height}
						onload={() => (loaded = true)}
						onerror={handleError}
					/>
				{/if}
			</a>
		</div>
	</div>
	<div class="text-center text-gray-600">
		<small class="text-[12px] font-bold">{width} x {height}</small>
		{#if !loaded && !failed}
			<div class="skeleton mt-1 h-3 w-10"></div>
		{:else}
			<div class="text-[8px] font-bold">{info?.size ?? $_('common.unknown')}</div>
		{/if}
	</div>
</div>
