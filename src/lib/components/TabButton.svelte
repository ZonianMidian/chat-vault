<script lang="ts">
	import type { Component } from 'svelte';

	import { number } from 'svelte-i18n';

	let {
		id,
		isActive,
		changeTab,
		icon: Icon = null,
		label = null,
		image = null,
		count = null,
		isLoading = false
	}: {
		id: string;
		isActive: boolean;
		changeTab: (id: string) => void;
		icon?: Component<{ class?: string }> | null;
		label?: string | null;
		image?: string | null;
		count?: number | null;
		isLoading?: boolean;
	} = $props();

	const isPlaceholder = $derived(!label && !Icon && !image);
</script>

<label class="tab" class:cursor-progress={isPlaceholder} aria-busy={isPlaceholder || undefined}>
	<input
		type="radio"
		name="tabs"
		checked={isActive}
		onclick={(event) => {
			if (isPlaceholder && !isActive) event.preventDefault();
		}}
		onchange={() => changeTab(id)}
	/>
	<div class="flex items-center gap-2">
		{#if Icon}
			<Icon class="size-4" />
		{:else if image}
			<img src={image} alt={label} class="size-4" />
		{:else}
			<div class="skeleton inline-block h-4 w-4"></div>
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
