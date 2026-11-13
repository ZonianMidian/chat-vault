<script lang="ts">
	import type { Snippet } from 'svelte';

	import { fade } from 'svelte/transition';

	let {
		title = '',
		logo = undefined,
		open = true,
		isLoading = false,
		onToggle = () => {},
		children
	}: {
		title?: string;
		logo?: string;
		open?: boolean;
		isLoading?: boolean;
		onToggle?: () => void;
		children: Snippet;
	} = $props();
</script>

<div class="bg-base-100 collapse-arrow collapse {open ? 'collapse-open' : ''}">
	<button
		type="button"
		class="collapse-title relative flex w-full cursor-pointer items-center gap-3 text-left select-none"
		onclick={onToggle}
		aria-expanded={open}
	>
		{#if isLoading}
			<div class="skeleton h-5 w-25"></div>
		{:else}
			{#if logo}
				<img src={logo} alt="logo" class="h-7 w-7" />
			{/if}
			{#if title}
				<h2 class="flex-1 text-xl" class:font-bold={open}>{title}</h2>
			{/if}
		{/if}
	</button>
	<div
		class="collapse-content overflow-hidden transition-all duration-300"
		style="padding-bottom: {open ? '1rem' : '0'}; max-height: {open ? '100%' : '0'};"
	>
		<div class="divider m-0"></div>
		{#if open}
			<div transition:fade class="mt-4">
				{@render children()}
			</div>
		{/if}
	</div>
</div>
