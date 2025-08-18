<script lang="ts">
	import { page } from '$app/state';

	let jsonLdElement: HTMLScriptElement;

	$: if (jsonLdElement && page.url.origin) {
		const jsonLd = {
			'@context': 'https://schema.org',
			'@type': 'WebSite',
			name: 'Chat Vault',
			url: `${page.url.origin}/`
		};
		jsonLdElement.textContent = JSON.stringify(jsonLd);
	}
</script>

<svelte:head>
	<meta property="og:image" content="{page.url.origin}/favicon.png" />
	<script bind:this={jsonLdElement} type="application/ld+json">
	</script>
</svelte:head>

<div class="box-border flex max-h-[90vh] justify-center p-8">
	<img src="/logo.svg" alt="Logo" class="max-h-full max-w-full object-contain" />
</div>
