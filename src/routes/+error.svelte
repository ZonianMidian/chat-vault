<script lang="ts">
	import { definedStatus } from '$lib/utils';
	import { page } from '$app/state';
	import { _ } from 'svelte-i18n';

	import Error from '$lib/components/Error.svelte';

	const message = $state(page.error?.message ?? $_('error.unknown'));
	const isDefined = definedStatus.includes(page.status ?? 0);
	const isCustom = $state(page.error?.custom ?? false);

	const error = isCustom
		? message
		: isDefined
			? $_(`status.${page.status}`)
			: $_('error.unknown');
</script>

<svelte:head>
	<title>{`${$_('common.error')} | Chat Vault`}</title>
	<meta property="og:title" content={$_('common.error')} />
	<meta property="og:image" content="{page.url.origin}/favicon.png" />
</svelte:head>

<div class="container-general container-h">
	<Error {error} />
</div>
