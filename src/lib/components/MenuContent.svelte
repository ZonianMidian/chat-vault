<script lang="ts">
	import type { IconProps } from '@lucide/svelte';
	import type { Component } from 'svelte';

	import { _ } from 'svelte-i18n';

	export let icon: Component<IconProps, {}, ''> | null = null;
	export let content: string | null = null;
	export let href: string | null = null;
	export let external: boolean = false;
	export let label: string;

	const blank = {
		rel: 'noopener noreferrer',
		target: '_blank'
	};
</script>

<li class="w-fit {href ? '' : 'pointer-events-none'}">
	<svelte:element
		this={href ? 'a' : 'span'}
		{...href ? { href, ...(external ? blank : {}) } : {}}
	>
		{#if icon}
			<svelte:component this={icon} class="h-4 w-4" />
		{/if}

		<div>
			{$_(label)}:
			<span class={href ? 'text-secondary link' : 'text-primary'}>
				<slot>{content}</slot>
			</span>
		</div>
	</svelte:element>
</li>
