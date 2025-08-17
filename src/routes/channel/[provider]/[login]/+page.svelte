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

	let providers = $state<ChannelProvider[] | null>(null);
	let error = $state<string | null>(data.error || null);
	let isLoading = $state<boolean>(true);
	let fetchKey = $state<string>('');

	let content = $derived<ChannelContent | null>(data.channel?.content ?? null);
	let user = $derived<UserData | null>(data?.channel?.user ?? null);

	let providerData = $derived(shouldTrigger(content));

	function shouldTrigger(content: ChannelContent | null): boolean {
		if (!content) return false;

		const hasItems = (t: EmoteBadge | null) =>
			(t?.emotes?.length ?? 0) + (t?.badges?.length ?? 0) > 0;

		return [content.follower, content.bits, content.sub, content.subT2, content.subT3].some(
			hasItems
		);
	}

	async function loadEmotes(id: string, provider: string): Promise<void> {
		if (!browser || !user) return;

		const currentKey = `${id}-${provider}`;
		if (fetchKey === currentKey) return;

		try {
			isLoading = true;
			error = null;
			fetchKey = currentKey;

			const result = await fetchEmotes('all', id, provider);

			if (fetchKey === currentKey) {
				providers = result as ChannelProvider[];
			}
		} catch (err) {
			if (fetchKey === currentKey) {
				console.error('Error fetching emotes:', err);
				error = 'Error loading emotes';
				providers = null;
			}
		} finally {
			if (fetchKey === currentKey) {
				isLoading = false;
			}
		}
	}

	$effect(() => {
		const currentProvider = data.provider;
		const currentId = data.id;
		const currentUser = user;

		if (currentUser && currentId && currentProvider) {
			untrack(() => {
				loadEmotes(currentId, currentProvider);
			});
		}
	});

	$effect(() => {
		error = data.error || null;
	});
</script>

<svelte:head>
	<title>{data.pageTitle}</title>
	<meta property="og:title" content={data.pageTitle} />
	<meta property="og:image" content={data.pageImage} />
</svelte:head>

{#if error || !data || !user}
	<div class="flex min-h-[90vh] flex-col items-center justify-center px-3 py-5 2xl:px-0">
		<Error error={error ?? $_('status.404')} />
	</div>
{:else}
	<div class="flex flex-col items-center justify-center px-3 py-5 xl:py-10 2xl:px-0">
		<div class="bg-neutral mx-auto w-full max-w-7xl space-y-6 rounded-xl p-6 shadow-md">
			<Profile {data} />
			<Providers {data} {providers} {providerData} {isLoading} />
		</div>
	</div>
{/if}
