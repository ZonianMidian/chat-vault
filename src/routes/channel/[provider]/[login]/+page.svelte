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
	import { page } from '$app/state';
	import { untrack } from 'svelte';
	import { _ } from 'svelte-i18n';

	import Providers from '$lib/components/channel/Providers.svelte';
	import Profile from '$lib/components/channel/Profile.svelte';
	import Error from '$lib/components/Error.svelte';

	const { data } = $props<{ data: ChannelPage }>();

	let providers = $state<ChannelProvider[] | null>(null);
	let isLoading = $state<boolean>(true);
	let fetchKey = $state<string>('');

	let content = $derived<ChannelContent | null>(data.channel?.content ?? null);
	let user = $derived<UserData | null>(data?.channel?.user ?? null);

	const pageTitle = $derived(`${$_('channel.label')}: ${user?.username ?? ''}`);
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
			fetchKey = currentKey;

			const result = await fetchEmotes('all', id, provider);

			if (fetchKey === currentKey) {
				providers = result as ChannelProvider[];
			}
		} catch (err) {
			if (fetchKey === currentKey) {
				console.error(err);
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
</script>

<svelte:head>
	<title>{`${pageTitle} | Chat Vault`}</title>
	<meta property="og:title" content={pageTitle} />

	{#if data.provider && user?.username}
		<meta
			property="og:url"
			content="{page.url.origin}/channel/{data.provider}/{user.username.toLowerCase()}"
		/>
		<link
			rel="canonical"
			href="{page.url.origin}/channel/{data.provider}/{user.username.toLowerCase()}"
		/>
	{/if}

	<meta property="og:image" content={data.pageImage} />
</svelte:head>

{#if !data || !user}
	<div class="container-general container-h">
		<Error error={$_('status.404')} />
	</div>
{:else}
	<div class="container-general">
		<div class="bg-neutral mx-auto w-full max-w-7xl space-y-6 rounded-xl p-6 shadow-md">
			<Profile {data} />
			<Providers {data} {providers} {providerData} {isLoading} />
		</div>
	</div>
{/if}
