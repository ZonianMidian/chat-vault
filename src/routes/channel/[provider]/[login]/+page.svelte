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

	import { onMount } from 'svelte';
	import { _ } from 'svelte-i18n';

	import Providers from '$lib/components/channel/Providers.svelte';
	import Profile from '$lib/components/channel/Profile.svelte';
	import Error from '$lib/components/Error.svelte';

	export let data: ChannelPage;

	let content: ChannelContent | null = data.channel?.content ?? null;
	let user: UserData | null = data?.channel?.user ?? null;
	let providers: ChannelProvider[] | null = null;
	let error: string | null = data.error || null;
	let isLoading: boolean = true;

	let providerData: boolean = false;

	function shouldTrigger(content: ChannelContent | null): boolean {
		if (!content) return false;

		const hasItems = (t: EmoteBadge | null) =>
			(t?.emotes?.length ?? 0) + (t?.badges?.length ?? 0) > 0;

		return [content.follower, content.bits, content.sub, content.subT2, content.subT3].some(
			hasItems
		);
	}

	onMount(async () => {
		if (browser && user) {
			providerData = shouldTrigger(content);

			providers = (await fetchEmotes('all', data.id, data.provider)) as ChannelProvider[];

			isLoading = false;
		}
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
