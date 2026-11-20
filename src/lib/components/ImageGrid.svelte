<script lang="ts">
	import type { Badges, Channel, Emotes, Variant, User } from '#lib/types/common.ts';

	import { resolve } from '$app/paths';
	import { getCheerName } from '#lib/utils/index.ts';
	import { Layers2 } from '@lucide/svelte';
	import { _ } from 'svelte-i18n';

	import GridImage from '#lib/components/GridImage.svelte';

	type Item = Channel | Emotes | Badges | Variant | User;

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
	}: {
		items?: Item[];
		versionKey?: null | string;
		linkPrefix?: 'emote' | 'badge' | 'channel' | null;
		providerKey?: string;
		placeholderCount?: number;
		imageKey?: string;
		isLoading?: boolean;
		nameKey?: string;
		logo?: boolean;
		idKey?: string;
	} = $props();

	const field = (item: Item, key: string): string =>
		((item as unknown as Record<string, unknown>)[key] as string) ?? '';

	function getHref(item: Item): ReturnType<typeof resolve> {
		if (linkPrefix === 'channel' && 'platform' in item) {
			const login =
				item.platform === 'youtube' && 'id' in item && item.id
					? item.id
					: item.username?.toLocaleLowerCase();

			return login
				? resolve('/channel/[provider]/[login]', {
						provider: item.platform,
						login
					})
				: resolve('/channel/search');
		}

		const versionValue = versionKey ? field(item, versionKey) : '';
		const version = versionValue ? `/${versionValue}` : '';
		const provider = field(item, providerKey);
		const id = `${field(item, idKey)}${version}`;

		return linkPrefix === 'badge'
			? resolve('/badge/[provider]/[...id]', { provider, id })
			: resolve('/emote/[provider]/[...id]', { provider, id });
	}

	function getTitle(item: Item): string {
		const name = field(item, nameKey);

		if (linkPrefix === 'badge') {
			if (item.id === 'subscriber') return $_('channel.subscriber');
			if (item.id === 'bits') return getCheerName(name);
		}

		return name;
	}
</script>

{#snippet content(item: Item)}
	{@const title = getTitle(item)}

	<div class="absolute top-2 right-2 z-10 drop-shadow-md/50">
		{#if logo}
			<img
				src={`/logos/${field(item, providerKey)}.svg`}
				class="h-5 w-5 p-0.5"
				draggable="false"
				alt="Provider"
			/>
		{/if}
		{#if 'zero_width' in item && item.zero_width}
			<div aria-label={$_('common.zero_width')} class="text-[#ea76cb] dark:text-[#f5c2e7]">
				<Layers2 class="h-5 w-5 p-0.5" />
			</div>
		{/if}
	</div>

	<GridImage
		src={field(item, imageKey)}
		alt={title}
		fallback={linkPrefix === 'channel' ? '/assets/avatar.svg' : '/assets/error.svg'}
		framed={linkPrefix === 'channel'}
	/>

	<span class="mt-1 truncate text-center text-sm font-medium">{title}</span>

	{#if linkPrefix === 'emote' && 'owner' in item && item.owner}
		<small class="text-info/80 truncate text-xs">{item.owner}</small>
	{/if}
	{#if 'value' in item && item.value && linkPrefix}
		<small class="text-primary/80 truncate text-xs">{item.value}</small>
	{/if}
{/snippet}

<div class="grid grid-cols-3 gap-4 sm:grid-cols-5 lg:grid-cols-7 xl:grid-cols-9">
	{#if isLoading}
		{#each Array.from({ length: placeholderCount }, (_, i) => i) as index (index)}
			<div class="bg-base-200 flex flex-col items-center rounded-lg px-2 py-5">
				<div class="skeleton h-16 w-16 rounded-xs"></div>
				<div class="skeleton mt-2 h-4 w-16"></div>
			</div>
		{/each}
	{:else}
		{#each items as item, i (i)}
			{#if linkPrefix}
				<a
					href={getHref(item)}
					class="bg-base-300 relative flex h-full w-full flex-col items-center rounded-lg px-2 py-5 transition-opacity hover:opacity-80"
				>
					{@render content(item)}
				</a>
			{:else}
				<div
					class="bg-base-300 relative flex h-full w-full flex-col items-center rounded-lg px-2 py-5"
				>
					{@render content(item)}
				</div>
			{/if}
		{/each}
	{/if}
</div>
