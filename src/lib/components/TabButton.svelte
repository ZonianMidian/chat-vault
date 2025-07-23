<script lang="ts">
	import { type IconProps } from '@lucide/svelte';
	import type { Component } from 'svelte';

	import { number } from 'svelte-i18n';

	export let icon: Component<IconProps> | null = null;
	export let changeTab: (id: string) => void;
	export let label: string | null = null;
	export let image: string | null = null;
	export let count: number | null = null;
	export let isLoading: boolean = false;
	export let isActive: boolean;
	export let id: string;
</script>

<label class="tab">
	<input type="radio" name="emote_tabs" checked={isActive} on:change={() => changeTab(id)} />
	<div class="flex items-center gap-2">
		{#if !icon && !image}
			<div class="skeleton inline-block h-4 w-4"></div>
		{:else}
			<svelte:component this={icon} class="size-4" />
			{#if image}
				<img src={image} alt={label} class="size-4" />
			{/if}
		{/if}
		<span class:hidden={!isActive} class:md:flex={!isActive} class="items-center">
			{#if !label}
				<div class="skeleton inline-block h-3 w-16"></div>
			{:else}
				{label}
			{/if}
			{#if (label && count === 0) || isLoading}
				(
				<div class="skeleton inline-block h-3 w-4"></div>
				)
			{:else if count !== null}
				({$number(count, { format: 'compactShort' })})
			{/if}
		</span>
	</div>
</label>
