<script lang="ts">
	import { Sun, Moon, Layers2, Globe } from '@lucide/svelte';
	import { getImageSizes } from '#lib/utils/images.ts';
	import { isDarkMode } from '#lib/tools/theme.ts';
	import { onMount } from 'svelte';
	import { _ } from 'svelte-i18n';

	import ImagePreview from '#lib/components/details/ImagePreview.svelte';

	let {
		type,
		provider,
		images = [],
		name = '',
		zero_width = false,
		global = false,
		isLoading = false
	}: {
		type: 'emote' | 'badge';
		provider: string;
		images?: string[];
		name?: string;
		zero_width?: boolean;
		global?: boolean;
		isLoading?: boolean;
	} = $props();

	const proxied = { emote: ['kick', 'youtube', 'bttv'], badge: ['kick', 'youtube'] };

	const sizes = $derived(getImageSizes(type, provider));

	let darkBackground = $state<boolean | null>(null);

	onMount(() =>
		isDarkMode.subscribe((value) => {
			darkBackground = value;
		})
	);
</script>

<div
	class="relative flex min-h-50 justify-center rounded-xl p-4"
	class:bg-[#eff1f5]={darkBackground === false}
	class:bg-[#0c0c16]={darkBackground === true}
	class:bg-(--color-solid)={darkBackground === null}
>
	<div class="absolute top-2 left-2">
		{#if isLoading}
			<div class="skeleton h-6 w-6 rounded-full"></div>
		{:else}
			<div class="flex h-6 w-6">
				{#if global}
					<div
						aria-label={$_('global.label')}
						class="mr-1"
						class:text-accent={darkBackground === null}
						class:text-[#1e66f5]={darkBackground === false}
						class:text-[#89b4fa]={darkBackground === true}
						title={$_('global.label')}
					>
						<Globe />
					</div>
				{/if}
				{#if zero_width}
					<div
						aria-label={$_('common.zero_width')}
						class:text-[#ea76cb]={!darkBackground}
						class:text-[#f5c2e7]={darkBackground === true}
						title={$_('common.zero_width')}
					>
						<Layers2 />
					</div>
				{/if}
			</div>
		{/if}
	</div>
	<div class="absolute top-2 right-2">
		{#if isLoading || darkBackground === null}
			<div class="skeleton h-6 w-6 rounded-full"></div>
		{:else}
			<label class="swap swap-rotate drop-shadow-md transition-opacity hover:opacity-80">
				<input
					type="checkbox"
					checked={darkBackground}
					onchange={(event) => (darkBackground = event.currentTarget.checked)}
				/>
				<Sun class="swap-off h-6 w-6 text-gray-400" />
				<Moon class="swap-on h-6 w-6 text-gray-400" />
			</label>
		{/if}
	</div>
	<div class="flex flex-wrap content-center items-baseline justify-center gap-x-10 gap-y-5">
		{#if isLoading}
			{#each sizes as { width, height }, i (i)}
				<div class="flex h-auto flex-col items-center justify-center">
					<div style="width: {width}px; height: {height}px;">
						<div class="skeleton h-full w-full rounded"></div>
					</div>
					<div class="skeleton mt-1 h-4 w-12"></div>
					<div class="skeleton mt-1 h-3 w-10"></div>
				</div>
			{/each}
		{:else}
			{#each images as image, i (i)}
				<ImagePreview
					{image}
					{name}
					fallbackSize={sizes[i] ?? sizes[sizes.length - 1]}
					keepSize={provider === 'kick'}
					proxy={proxied[type].includes(provider)}
					dark={darkBackground}
				/>
			{/each}
		{/if}
	</div>
</div>
