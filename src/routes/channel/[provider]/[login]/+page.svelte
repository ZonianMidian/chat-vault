<script lang="ts">
	import { _ } from 'svelte-i18n';

	import ChannelSkeleton from '#lib/components/channel/ChannelSkeleton.svelte';
	import ChannelView from '#lib/components/channel/ChannelView.svelte';
	import LoadError from '#lib/components/LoadError.svelte';
	import Seo from '#lib/components/Seo.svelte';

	let { data } = $props();
</script>

{#key `${data.provider}/${data.login}`}
	{#await data.channel}
		<Seo title={$_('channel.label')} noindex />
		<ChannelSkeleton />
	{:then channel}
		<ChannelView {channel} providers={data.providers} />
	{:catch error}
		<LoadError {error} />
	{/await}
{/key}
