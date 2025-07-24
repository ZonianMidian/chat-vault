<script lang="ts">
	import type { Sizes } from '$lib/types/common';

	import { onDestroy, onMount, untrack } from 'svelte';
	import { Sun, Moon, Layers2 } from '@lucide/svelte';
	import { inlineSvg } from '@svelte-put/inline-svg';
	import { isDarkMode } from '$lib/tools/isDarkMode';
	import { _ } from 'svelte-i18n';

	let {
		imageSizes = new Map(),
		imageUrls = new Map(),
		darkBackground = $bindable(true),
		provider = 'twitch',
		zeroWidth = false,
		isLoading = true,
		type = 'emote',
		images = [],
		name = ''
	}: {
		imageSizes?: Map<string, Sizes>;
		imageUrls?: Map<string, string>;
		darkBackground?: boolean;
		provider?: string;
		zeroWidth?: boolean;
		isLoading?: boolean;
		type?: string;
		images?: string[];
		name?: string;
	} = $props();

	const dimensions: {
		emote: Record<string, string[]>;
		badge: Record<string, string[]>;
	} = {
		emote: {
			'7tv': ['32x32', '64x64', '96x96', '128x128'],
			twitch: ['28x28', '56x56', '112x112'],
			youtube: ['24x24', '48x48', '96x96'],
			bttv: ['28x28', '56x56', '112x112'],
			kick: ['35x35', '70x70', '140x140'],
			ffz: ['32x32', '64x64', '128x128']
		},
		badge: {
			'7tv': ['18x18', '36x36', '54x54', '72x72'],
			twitch: ['18x18', '36x36', '72x72'],
			kick: ['18x18', '36x36', '72x72'],
			ffz: ['18x18', '36x36', '72x72']
		}
	};

	const defaultDimensions = {
		emote: ['32x32', '64x64', '128x128'],
		badge: ['18x18', '36x36', '72x72']
	};

	let imageError = $state<{ [idx: number]: boolean }>({});
	let imageLoaded = $state<{ [idx: number]: boolean }>({});

	const placeholderDimensions = $derived(
		dimensions[type as 'emote' | 'badge'][provider] ||
			defaultDimensions[type as 'emote' | 'badge']
	);

	$effect(() => {
		if (images) {
			untrack(() => {
				imageError = {};
				imageLoaded = {};
			});
		}
	});

	function onImgError(idx: number) {
		imageError = { ...imageError, [idx]: true };
	}

	function onImgLoad(idx: number) {
		imageLoaded = { ...imageLoaded, [idx]: true };
	}

	onMount(() => {
		const unsubscribe = isDarkMode.subscribe((value) => {
			untrack(() => {
				darkBackground = value;
			});
		});

		onDestroy(() => {
			unsubscribe();
		});
	});
</script>

<div
	class="relative flex min-h-50 justify-center rounded-xl p-4"
	class:bg-[#eff1f5]={!darkBackground && !isLoading}
	class:bg-[#0c0c16]={darkBackground && !isLoading}
	class:bg-(--color-solid)={isLoading}
>
	<div class="absolute top-2 left-2">
		{#if isLoading}
			<div class="skeleton h-6 w-6 rounded-full"></div>
		{:else if zeroWidth}
			<div
				aria-label={$_('common.zeroWidth')}
				class:text-[#ea76cb]={!darkBackground}
				class:text-[#f5c2e7]={darkBackground}
			>
				<Layers2 class="h-6 w-6" />
			</div>
		{/if}
	</div>
	<div class="absolute top-2 right-2">
		{#if isLoading}
			<div class="skeleton h-6 w-6 rounded-full"></div>
		{:else}
			<label class="swap swap-rotate drop-shadow-md transition-opacity hover:opacity-80">
				<input type="checkbox" class="theme-controller" bind:checked={darkBackground} />
				<Sun class="swap-off h-6 w-6 text-gray-400" />
				<Moon class="swap-on h-6 w-6 text-gray-400" />
			</label>
		{/if}
	</div>
	<div class="flex flex-wrap content-center items-baseline justify-center gap-x-10 gap-y-5">
		{#if isLoading}
			{#each placeholderDimensions as dimension}
				{@const [width, height] = dimension.split('x')}
				<div class="flex h-auto flex-col items-center justify-center">
					<div
						style="width: {width}px; height: {height}px;"
						class="flex items-center justify-center"
					>
						<div class="skeleton h-full w-full rounded"></div>
					</div>
					<div class="skeleton mt-1 h-4 w-12"></div>
					<div class="skeleton mt-1 h-3 w-10"></div>
				</div>
			{/each}
		{:else}
			{#each images as image, i}
				{@const data = imageSizes.get(image)}
				{@const size = data?.size ?? $_('common.unknown')}
				{@const width = data?.width ?? placeholderDimensions[i]?.split('x')[0]}
				{@const height = data?.height ?? placeholderDimensions[i]?.split('x')[1]}

				<div class="flex h-auto flex-col items-center justify-center">
					<div
						style="width: {width}px; height: {height}px;"
						class="flex items-center justify-center"
					>
						{#if imageError[i]}
							<svg
								{width}
								{height}
								use:inlineSvg={'/assets/error.svg'}
								class:text-[#0c0c16]={!darkBackground}
								class:text-[#eff1f5]={darkBackground}
							/>
						{:else if !imageLoaded[i]}
							<div class="skeleton h-full w-full rounded"></div>
							<img
								src={imageUrls.get(image) || image}
								alt={name}
								class="hidden"
								{width}
								{height}
								onload={() => onImgLoad(i)}
								onerror={() => onImgError(i)}
							/>
						{:else}
							<a href={image} target="_blank" rel="noopener noreferrer">
								<img
									src={imageUrls.get(image) || image}
									class="transition-opacity hover:opacity-80"
									class:shadow={!darkBackground}
									alt={name}
									{width}
									{height}
									onerror={() => onImgError(i)}
								/>
							</a>
						{/if}
					</div>
					<div class="text-center text-gray-600">
						<small class="text-[12px] font-bold">{width} x {height}</small>
						{#if !imageLoaded[i] && !imageError[i]}
							<div class="skeleton mt-1 h-3 w-10"></div>
						{:else}
							<div class="text-[8px] font-bold">{size}</div>
						{/if}
					</div>
				</div>
			{/each}
		{/if}
	</div>
</div>
