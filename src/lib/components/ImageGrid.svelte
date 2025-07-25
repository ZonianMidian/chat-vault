<script lang="ts">
	import type { Badges, Channel, Emotes, Variant } from '$lib/types/common';

	import { inlineSvg } from '@svelte-put/inline-svg';
	import { getCheerName } from '$lib/utils';
	import { onMount, untrack } from 'svelte';
	import { Layers2 } from '@lucide/svelte';
	import { _ } from 'svelte-i18n';

	type Item = Channel | Emotes | Badges | Variant;

	const {
		items = [],
		versionKey = null,
		linkPrefix = null,
		providerKey = 'provider',
		placeholderCount = 18,
		imageKey = 'image',
		isLoading = false,
		nameKey = 'name',
		logo = false,
		idKey = 'id'
	} = $props<{
		items?: Item[];
		versionKey?: null | string;
		linkPrefix?: null | string;
		providerKey?: string;
		placeholderCount?: number;
		imageKey?: string;
		isLoading?: boolean;
		nameKey?: string;
		logo?: boolean;
		idKey?: string;
	}>();

	let imageLoaded = $state<Record<string, boolean>>({});
	let imageError = $state<Record<string, string>>({});
	let permanentImageCache = $state<Record<string, boolean>>({});

	let getHref = $derived((): ((item: Item) => string | null) => {
		return (item: Item): string | null =>
			linkPrefix
				? `/${linkPrefix}/${(item[providerKey as keyof Item] as string) || ''}/${(item[idKey as keyof Item] as string) || ''}${versionKey ? `/${item[versionKey as keyof Item] as string}` : ''}`
				: null;
	});

	function getItemKey(item: Item): string {
		const id: string = item[idKey as keyof Item] as string;
		const provider: string = item[providerKey as keyof Item] as string;
		return `${provider}-${id}`;
	}

	function getImageUrl(item: Item): string {
		return item[imageKey as keyof Item] as string;
	}

	function getItemTitle(item: Item): string {
		if (linkPrefix === 'badge') {
			const name: string = item[nameKey as keyof Item] as string;
			return (item as any).id === 'subscriber'
				? $_('channel.subscriber')
				: (item as any).id === 'bits'
					? getCheerName(name)
					: name;
		}
		return item[nameKey as keyof Item] as string;
	}

	function onImgError(itemKey: string): void {
		imageError[itemKey] = linkPrefix === 'channel' ? '/assets/avatar.svg' : '/assets/error.svg';
		imageLoaded[itemKey] = true;
	}

	function onImgLoad(itemKey: string, imageUrl: string): void {
		imageLoaded[itemKey] = true;
		permanentImageCache[imageUrl] = true;
	}

	function isImageCached(imageUrl: string): boolean {
		if (permanentImageCache[imageUrl]) {
			return true;
		}

		const img: HTMLImageElement = new Image();
		img.src = imageUrl;
		const isCached: boolean = img.complete && img.naturalWidth > 0;

		if (isCached) {
			permanentImageCache[imageUrl] = true;
		}

		return isCached;
	}

	function updateImageStates(): void {
		const previousImageLoaded: Record<string, boolean> = { ...imageLoaded };
		const previousImageError: Record<string, string> = { ...imageError };

		const newImageLoaded: Record<string, boolean> = {};
		const newImageError: Record<string, string> = {};

		items.forEach((item: Item): void => {
			const itemKey: string = getItemKey(item);
			const imageUrl: string = getImageUrl(item);

			if (previousImageError[itemKey]) {
				newImageError[itemKey] = previousImageError[itemKey];
				newImageLoaded[itemKey] = true;
			} else if (previousImageLoaded[itemKey] === true) {
				newImageLoaded[itemKey] = true;
				permanentImageCache[imageUrl] = true;
			} else if (isImageCached(imageUrl)) {
				newImageLoaded[itemKey] = true;
			} else {
				newImageLoaded[itemKey] = false;
			}
		});

		imageLoaded = newImageLoaded;
		imageError = newImageError;
	}

	$effect((): void => {
		if (items.length > 0) {
			untrack((): void => {
				updateImageStates();
			});
		}
	});

	$effect((): (() => void) => {
		return (): void => {
			const currentKeys: Set<string> = new Set(
				items.map((item: Item): string => getItemKey(item))
			);
			const currentUrls: Set<string> = new Set(
				items.map((item: Item): string => getImageUrl(item))
			);

			Object.keys(imageLoaded).forEach((key: string): void => {
				if (!currentKeys.has(key)) {
					delete imageLoaded[key];
					delete imageError[key];
				}
			});

			Object.keys(permanentImageCache).forEach((url: string): void => {
				if (!currentUrls.has(url)) {
					delete permanentImageCache[url];
				}
			});
		};
	});

	onMount((): void => {
		items.forEach((item: Item): void => {
			const itemKey: string = getItemKey(item);
			const imageUrl: string = getImageUrl(item);
			const img: HTMLImageElement | null = document.querySelector<HTMLImageElement>(
				`img[data-key="${itemKey}"]`
			);

			if (img?.complete && img.naturalWidth > 0) {
				imageLoaded[itemKey] = true;
				permanentImageCache[imageUrl] = true;
			}
		});
	});
</script>

{#snippet itemImage(item: Item, itemKey: string)}
	{#if imageError[itemKey]}
		<div
			class:rounded-xs={linkPrefix === 'channel'}
			class:bg-base-100={linkPrefix === 'channel'}
		>
			<svg class="h-16 w-16 object-contain" use:inlineSvg={imageError[itemKey]} />
		</div>
	{:else}
		<div class="relative h-16 w-16">
			<div
				class="absolute inset-0 flex items-center justify-center"
				class:hidden={imageLoaded[itemKey]}
			>
				<div class="skeleton h-16 w-16 rounded-xs"></div>
			</div>

			<img
				data-key={itemKey}
				class="relative h-16 w-16 rounded-xs object-contain transition-opacity duration-200"
				class:opacity-0={!imageLoaded[itemKey]}
				class:opacity-100={imageLoaded[itemKey]}
				src={getImageUrl(item)}
				alt={getItemTitle(item)}
				onerror={() => onImgError(itemKey)}
				onload={() => onImgLoad(itemKey, getImageUrl(item))}
				loading="lazy"
			/>
		</div>
	{/if}
{/snippet}

{#snippet itemLabels(item: Item)}
	<div class="absolute top-2 right-2 z-10 drop-shadow-md/50">
		{#if logo}
			<img
				src={`/logos/${item[providerKey as keyof Item] as string}.svg`}
				class="h-5 w-5 p-0.5"
				draggable="false"
				alt="Provider"
			/>
		{/if}
		{#if (item as any)['zeroWidth']}
			<div aria-label={$_('common.zeroWidth')} class="text-[#ea76cb] dark:text-[#f5c2e7]">
				<Layers2 class="h-5 w-5 p-0.5" />
			</div>
		{/if}
	</div>
{/snippet}

<div class="grid grid-cols-3 gap-4 sm:grid-cols-5 lg:grid-cols-7 xl:grid-cols-9">
	{#if isLoading}
		{#each Array(placeholderCount) as _, i}
			<div class="bg-base-200 flex flex-col items-center rounded-lg p-5">
				<div class="skeleton h-16 w-16 rounded-xs"></div>
				<div class="skeleton mt-2 h-4 w-16"></div>
			</div>
		{/each}
	{:else}
		{#each items as item, idx}
			{@const itemKey = getItemKey(item)}

			<svelte:element
				this={linkPrefix ? 'a' : 'button'}
				{...linkPrefix
					? { href: getHref()(item) }
					: { type: 'button', 'aria-label': getItemTitle(item) }}
				class="bg-base-300 relative flex h-full w-full flex-col items-center rounded-lg p-5 transition-opacity"
				class:hover:opacity-80={linkPrefix}
			>
				{@render itemLabels(item)}
				{@render itemImage(item, itemKey)}

				<span class="mt-1 truncate text-center text-sm font-medium">
					{getItemTitle(item)}
				</span>
				{#if linkPrefix === 'emote' && (item as any)['owner']}
					<small class="text-info/80 truncate text-xs">
						{(item as any)['owner']}
					</small>
				{/if}
				{#if linkPrefix === 'badge' && (item as any)['value']}
					<small class="text-info/80 truncate text-xs">
						{(item as any)['value']}
					</small>
				{/if}
			</svelte:element>
		{/each}
	{/if}
</div>
