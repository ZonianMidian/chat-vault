<script lang="ts">
	import type { Snippet } from 'svelte';

	let { tabs, content }: { tabs: Snippet; content: Snippet } = $props();
</script>

<div class="tabs tabs-lift relative">
	{@render tabs()}
	{@render content()}
</div>
