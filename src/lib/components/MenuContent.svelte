<script lang="ts">
	import type { IconProps } from '@lucide/svelte';
	import type { Component } from 'svelte';

	import { _ } from 'svelte-i18n';

	export let icon: Component<IconProps, {}, ''> | null = null;
	export let content: string | null = null;
	export let href: string | null = null;
	export let label: string;
</script>

<li class="w-fit {href ? '' : 'pointer-events-none'}">
	<div>
		{#if icon}
			<svelte:component this={icon} class="h-4 w-4" />
		{/if}

		<svelte:element this={href ? 'a' : 'span'} {...href ? { href } : {}}>
			{$_(label)}:
			<span class={href ? 'text-secondary link' : 'text-primary'}>
				<slot>{content}</slot>
			</span>
		</svelte:element>
	</div>
</li>
