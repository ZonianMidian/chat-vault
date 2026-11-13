<script lang="ts">
	import type { ChannelData, ChannelProvider } from '#lib/types/common.ts';

	import { pending } from '#lib/tools/pending.svelte.ts';
	import { channelSchema } from '#lib/seo.ts';
	import { page } from '$app/state';
	import { _ } from 'svelte-i18n';

	import Providers from '#lib/components/channel/Providers.svelte';
	import Profile from '#lib/components/channel/Profile.svelte';
	import Seo from '#lib/components/Seo.svelte';

	let {
		channel,
		providers: providersSource
	}: {
		channel: ChannelData;
		providers: Promise<ChannelProvider[]> | ChannelProvider[];
	} = $props();

	const providers = pending<ChannelProvider[]>(() => providersSource, []);

	const user = $derived(channel.user);

	const description = $derived(
		user.bio ||
			[
				`[${$_(`provider.${channel.provider}`)}]`,
				$_('channel.followers', { values: { count: user.followers } })
			].join(' · ')
	);

	const schema = $derived(
		channelSchema(channel, page.url.origin, page.url.origin + page.url.pathname)
	);
</script>

<Seo
	title={`${$_('channel.label')}: ${user.username}`}
	path={page.url.pathname}
	image={user.images.avatar}
	type="profile"
	breadcrumbs={[
		{ name: $_('navbar.channels'), path: '/channel/search' },
		{ name: user.username }
	]}
	{description}
	{schema}
/>

<div class="container-general">
	<div class="bg-neutral mx-auto w-full max-w-7xl space-y-6 rounded-xl p-6 shadow-md">
		<Profile {channel} />
		<Providers {channel} providers={providers.value} isLoading={providers.loading} />
	</div>
</div>
