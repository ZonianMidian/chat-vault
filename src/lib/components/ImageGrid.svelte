<script lang="ts">
	import type { Badges, Channel, Emotes, Variant } from '$lib/types/common';

	import { inlineSvg } from '@svelte-put/inline-svg';
	import { onDestroy, onMount } from 'svelte';
	import { Layers2 } from '@lucide/svelte';
	import { _ } from 'svelte-i18n';
	import { getCheerName } from '$lib/utils';

	export let items: Channel[] | Emotes[] | Badges[] | Variant[] = [];
	export let versionKey: null | string = null;
	export let linkPrefix: null | string = null;
	export let providerKey = 'provider';
	export let placeholderCount = 18;
	export let imageKey = 'image';
	export let isLoading = false;
	export let nameKey = 'name';
	export let logo = false;
	export let idKey = 'id';

	let imageError: Record<number, string> = {};
	let imageLoaded: Record<number, boolean> = {};

	$: if (items) {
		imageError = {};
		imageLoaded = {};
	}

	const getHref = (item: Channel | Emotes | Badges | Variant) =>
		linkPrefix
			? `/${linkPrefix}/${item[providerKey as keyof typeof item] || ''}/${item[idKey as keyof typeof item] || ''}${versionKey ? `/${item[versionKey as keyof typeof item]}` : ''}`
			: null;

	function onImgError(idx: number) {
		imageError[idx] = linkPrefix === 'channel' ? '/assets/avatar.svg' : '/assets/error.svg';
	}

	function onImgLoad(idx: number) {
		imageLoaded[idx] = true;
	}

	onMount(() => {
		items.forEach((_, idx) => {
			const img = document.querySelector<HTMLImageElement>(`img[data-idx="${idx}"]`);
			if (img?.complete && img.naturalWidth !== 0) {
				imageLoaded[idx] = true;
			}
		});
	});
</script>

<div class="grid grid-cols-3 gap-4 sm:grid-cols-5 lg:grid-cols-7 xl:grid-cols-9">
	{#if isLoading}
		{#each Array(placeholderCount) as _}
			<div class="bg-base-200 flex flex-col items-center rounded-lg p-5">
				<div class="skeleton h-16 w-16 rounded-xs"></div>
				<div class="skeleton mt-2 h-4 w-16"></div>
			</div>
		{/each}
	{:else}
		{#each items as item, idx}
			<svelte:element
				this={linkPrefix ? 'a' : 'button'}
				{...linkPrefix
					? { href: getHref(item) }
					: { type: 'button', 'aria-label': item[nameKey as keyof typeof item] }}
				class="bg-base-300 relative flex flex-col items-center rounded-lg p-5 transition-opacity"
				class:hover:opacity-80={linkPrefix}
			>
				<div class="absolute top-2 right-2 drop-shadow-md/50">
					{#if logo}
						<img
							src={`/logos/${item[providerKey as keyof typeof item]}.svg`}
							class="h-5 w-5 p-0.5"
							draggable="false"
							alt="Provider"
							style="z-index:2"
						/>
					{/if}
					{#if item['zeroWidth' as keyof typeof item]}
						<div
							aria-label={$_('common.zeroWidth')}
							class="text-[#ea76cb] dark:text-[#f5c2e7]"
						>
							<Layers2 class="h-5 w-5 p-0.5" />
						</div>
					{/if}
				</div>

				{#if imageError[idx]}
					<div
						class:rounded-xs={linkPrefix === 'channel'}
						class:bg-base-100={linkPrefix === 'channel'}
					>
						<svg class="h-16 w-16 object-contain" use:inlineSvg={imageError[idx]} />
					</div>
				{:else}
					<div
						class="absolute flex items-center justify-center"
						class:hidden={imageLoaded[idx]}
					>
						<div class="skeleton h-16 w-16 rounded-xs"></div>
					</div>
					<img
						data-idx={idx}
						src={item[imageKey as keyof typeof item]}
						alt={item[nameKey as keyof typeof item]}
						class="h-16 w-16 rounded-xs object-contain"
						loading="lazy"
						on:error={() => onImgError(idx)}
						on:load={() => onImgLoad(idx)}
					/>
				{/if}

				<span class="mt-1 truncate text-center text-sm font-medium">
					{#if linkPrefix === 'badge'}
						{@const name = item[nameKey as keyof typeof item]}
						{@const title =
							item.id === 'subscriber'
								? $_('channel.subscriber')
								: item.id === 'bits'
									? getCheerName(name)
									: name}
						{title}
					{:else}
						{item[nameKey as keyof typeof item]}
					{/if}
				</span>
				{#if linkPrefix === 'emote' && item['owner' as keyof typeof item]}
					<small class="text-info/80 truncate text-xs">
						{item['owner' as keyof typeof item]}
					</small>
				{/if}
				{#if linkPrefix === 'badge' && item['value' as keyof typeof item]}
					<small class="text-info/80 truncate text-xs">
						{item['value' as keyof typeof item]}
					</small>
				{/if}
			</svelte:element>
		{/each}
	{/if}
</div>
