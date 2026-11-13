<script lang="ts">
	import { describeError } from '#lib/utils/index.ts';
	import { _ } from 'svelte-i18n';

	import Error from '#lib/components/Error.svelte';
	import Seo from '#lib/components/Seo.svelte';

	let { error, status }: { error: unknown; status?: number } = $props();
</script>

<Seo title={$_('common.error')} noindex />

<div class="container-general container-h">
	<Error error={describeError(error, $_, status)} />
</div>
