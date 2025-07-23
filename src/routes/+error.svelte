<script lang="ts">
	import { page } from '$app/state';
	import { _ } from 'svelte-i18n';

	import Error from '$lib/components/Error.svelte';
</script>

<svelte:head>
	<title>{`Chat Vault | ${$_('common.error')}`}</title>
	<meta property="og:title" content={`Chat Vault | ${$_('common.error')}`} />
	<meta property="og:image" content="{page.url.origin}/favicon.png" />
</svelte:head>

<div class="flex min-h-[90vh] flex-col items-center justify-center px-3 py-5 2xl:px-0">
	<Error error={$_('status.404')} />
</div>
