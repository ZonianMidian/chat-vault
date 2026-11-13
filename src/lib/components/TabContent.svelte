<script lang="ts">
	import type { Snippet } from 'svelte';

	let { isActive, children }: { isActive: boolean; children: Snippet } = $props();
</script>

<div
	class="tab-content bg-base-100 border-base-300 p-4"
	style="display: {isActive ? 'block' : 'none'}"
>
	{@render children()}
</div>
