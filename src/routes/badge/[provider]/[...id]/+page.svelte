<script lang="ts">
	import { _ } from 'svelte-i18n';

	import BadgeView from '#lib/components/badge/BadgeView.svelte';
	import LoadError from '#lib/components/LoadError.svelte';
	import Details from '#lib/components/Details.svelte';
	import Seo from '#lib/components/Seo.svelte';

	let { data } = $props();
</script>

{#key `${data.provider}/${data.id}`}
	{#await data.badge}
		<Seo title={$_('badge.label')} noindex />
		<Details type="badge" provider={data.provider} />
	{:then badge}
		<BadgeView {badge} extras={data.extras} />
	{:catch error}
		<LoadError {error} />
	{/await}
{/key}
