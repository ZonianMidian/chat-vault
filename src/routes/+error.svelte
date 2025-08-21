<script lang="ts">
	import { page } from '$app/state';
	import { _ } from 'svelte-i18n';

	import Error from '$lib/components/Error.svelte';
</script>

<svelte:head>
	<title>{`${$_('common.error')} | Chat Vault`}</title>
	<meta property="og:title" content={$_('common.error')} />
	<meta property="og:image" content="{page.url.origin}/favicon.png" />
</svelte:head>

<div class="container-general container-h">
	<Error error={$_('status.404')} />
</div>
