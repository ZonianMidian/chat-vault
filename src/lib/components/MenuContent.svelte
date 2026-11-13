<script lang="ts">
	import type { ResolvedPathname } from '$app/types';
	import type { Component } from 'svelte';

	import { _ } from 'svelte-i18n';

	let {
		label,
		content = null,
		icon: Icon = null,
		internalHref = null,
		externalHref = null
	}: {
		label: string;
		content?: string | null;
		icon?: Component<{ class?: string }> | null;
		internalHref?: ResolvedPathname | null;
		externalHref?: string | null;
	} = $props();
</script>

{#snippet body()}
	{#if Icon}
		<Icon class="h-4 w-4" />
	{/if}

	<div>
		{$_(label)}:
		<span class={internalHref || externalHref ? 'text-secondary link' : 'text-primary'}>
			{content}
		</span>
	</div>
{/snippet}

<li class="w-fit {internalHref || externalHref ? '' : 'pointer-events-none'}">
	{#if internalHref}
		<a href={internalHref}>
			{@render body()}
		</a>
	{:else if externalHref}
		<a href={externalHref} target="_blank" rel="external noopener noreferrer">
			{@render body()}
		</a>
	{:else}
		<span>{@render body()}</span>
	{/if}
</li>
