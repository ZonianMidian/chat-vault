<script lang="ts">
	import { page } from '$app/state';
</script>

<svelte:head>
	<meta property="og:image" content="{page.url.origin}/favicon.png" />
</svelte:head>

<div class="box-border flex max-h-[90vh] justify-center p-8">
	<img src="/logo.svg" alt="Logo" class="max-h-full max-w-full object-contain" />
</div>
