<script module lang="ts">
	import type { Sparkles } from '@lucide/svelte';

	type Icon = typeof Sparkles;

	export interface DropdownOption<V extends string> {
		value: V;
		label: string;
		icon: Icon;
		detail?: Icon;
	}
</script>

<script lang="ts" generics="T extends string">
	import { ChevronDown } from '@lucide/svelte';

	let {
		label,
		value,
		options,
		onselect,
		class: className = ''
	}: {
		label: string;
		value: T;
		options: DropdownOption<T>[];
		onselect: (value: T) => void;
		class?: string;
	} = $props();

	const current = $derived(options.find((option) => option.value === value) ?? options[0]);

	function choose(option: T) {
		onselect(option);
		(document.activeElement as HTMLElement | null)?.blur();
	}
</script>

<div class="dropdown dropdown-end {className}">
	<div
		tabindex="0"
		role="button"
		class="btn bg-base-100 border-base-content/10 w-full justify-between font-normal"
		aria-label={`${label}: ${current.label}`}
		title={label}
	>
		<span class="flex min-w-0 items-center gap-2">
			{@render icons(current, 'text-primary')}
			<span class="truncate">{current.label}</span>
		</span>
		<ChevronDown class="h-4 w-4 shrink-0 opacity-60" />
	</div>

	<ul
		tabindex="-1"
		class="dropdown-content menu bg-base-200 rounded-box border-base-content/10 z-30 mt-1 w-56 border p-2 shadow-lg"
	>
		<li class="menu-title">{label}</li>
		{#each options as option (option.value)}
			<li>
				<button
					type="button"
					class:menu-active={option.value === value}
					aria-current={option.value === value}
					onclick={() => choose(option.value)}
				>
					{@render icons(option)}
					{option.label}
				</button>
			</li>
		{/each}
	</ul>
</div>

{#snippet icons(option: DropdownOption<string>, color = '')}
	<span class="flex shrink-0 items-center gap-0.5 {color}">
		<option.icon class="h-4 w-4" />
		{#if option.detail}
			<option.detail class="h-3.5 w-3.5 opacity-70" />
		{/if}
	</span>
{/snippet}
