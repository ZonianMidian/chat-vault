<script lang="ts">
	import type {
		ChannelProvider,
		ChannelContent,
		ChannelPage,
		EmoteBadge,
		UserData
	} from '$lib/types/common';

	import { fetchEmotes } from '$lib/channels/fetchEmotes';
	import { browser } from '$app/environment';
	import { untrack } from 'svelte';
	import { _ } from 'svelte-i18n';

	import Providers from '$lib/components/channel/Providers.svelte';
	import Profile from '$lib/components/channel/Profile.svelte';
	import Error from '$lib/components/Error.svelte';

	const { data } = $props<{ data: ChannelPage }>();

	let content = $state<ChannelContent | null>(data.channel?.content ?? null);
	let user = $state<UserData | null>(data?.channel?.user ?? null);
	let providers = $state<ChannelProvider[] | null>(null);
	let error = $state<string | null>(data.error || null);
	let isLoading = $state<boolean>(true);

	let providerData = $derived(shouldTrigger(content));

	function shouldTrigger(content: ChannelContent | null): boolean {
		if (!content) return false;

		const hasItems = (t: EmoteBadge | null) =>
			(t?.emotes?.length ?? 0) + (t?.badges?.length ?? 0) > 0;

		return [content.follower, content.bits, content.sub, content.subT2, content.subT3].some(
			hasItems
		);
	}

	$effect(() => {
		if (!browser || !user) return;

		untrack(async () => {
			try {
				isLoading = true;
				providers = (await fetchEmotes('all', data.id, data.provider)) as ChannelProvider[];
			} catch (err) {
				console.error('Error fetching emotes:', err);
				error = 'Error loading emotes';
			} finally {
				isLoading = false;
			}
		});
	});

	$effect(() => {
		content = data.channel?.content ?? null;
		user = data?.channel?.user ?? null;
		error = data.error || null;
	});
</script>

<svelte:head>
	<title>{data.pageTitle}</title>
	<meta property="og:title" content={data.pageTitle} />
	<meta property="og:image" content={data.pageImage} />
</svelte:head>

<div class="flex min-h-[90vh] flex-col items-center justify-center px-3 py-5 2xl:px-0">
	{#if error || !data || !user}
		<Error error={error ?? $_('status.404')} />
	{:else}
		<div class="bg-neutral mx-auto w-full max-w-7xl space-y-6 rounded-xl p-6 shadow-md">
			<Profile {data} />
			<Providers {data} {providers} {providerData} {isLoading} />
		</div>
	{/if}
</div>
