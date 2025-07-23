<script lang="ts">
	import { fade } from 'svelte/transition';

	export let logo: string | undefined = undefined;
	export let onToggle: () => void = () => {};
	export let isLoading: boolean = false;
	export let hide: boolean = false;
	export let open: boolean = true;
	export let title: string = '';
</script>

{#if !hide}
	<div class="bg-base-100 collapse-arrow collapse {open ? 'collapse-open' : ''}">
		<button
			type="button"
			class="collapse-title relative flex w-full cursor-pointer items-center gap-3 text-left select-none"
			on:click={onToggle}
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
			style="padding-bottom: {open ? '1rem' : '0'}; max-height: {open ? '1000px' : '0'};"
		>
			<div class="divider m-0"></div>
			{#if open}
				<div transition:fade class="mt-4">
					<slot />
				</div>
			{/if}
		</div>
	</div>
{/if}
