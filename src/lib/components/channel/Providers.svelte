<script lang="ts">
	import type { ChannelData, ChannelProvider, EmoteBadge, Set } from '#lib/types/common.ts';

	import { ChevronDown, Search } from '@lucide/svelte';
	import { filterEmotes } from '#lib/utils/index.ts';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { untrack } from 'svelte';
	import { _ } from 'svelte-i18n';

	import Content from '#lib/components/channel/Content.svelte';
	import SearchError from '#lib/components/SearchError.svelte';
	import TabContent from '#lib/components/TabContent.svelte';
	import TabButton from '#lib/components/TabButton.svelte';
	import ImageGrid from '#lib/components/ImageGrid.svelte';
	import Tabs from '#lib/components/Tabs.svelte';

	let {
		channel,
		providers = [],
		isLoading = false
	}: {
		channel: ChannelData;
		providers?: ChannelProvider[];
		isLoading?: boolean;
	} = $props();

	const placeholderCount = 3;

	const user = $derived(channel.user);
	const native = $derived(channel.content);

	const available = $derived(providers.filter((provider) => provider.sets?.length));

	const hasNative = $derived(
		[native.follower, native.bits, native.sub, native.subT2, native.subT3].some(
			(tier: EmoteBadge | null) => (tier?.emotes.length ?? 0) + (tier?.badges.length ?? 0) > 0
		)
	);

	// svelte-ignore state_referenced_locally
	let activeTab = $state<string>(channel.provider);
	let currentSets = $state.raw<Record<string, Set>>({});
	let searches = $state<Record<string, string>>({});

	const setTitle = (set: Set | undefined): string =>
		set?.name ?? $_('set.title', { values: { user: user.username } });

	function getMainSet(provider: ChannelProvider): Set | null {
		return provider.sets.find((set) => set.mainSet) || provider.sets[0] || null;
	}

	function getDefaultTab(): string {
		if (hasNative) return channel.provider;

		const withEmotes = available.find((provider) =>
			provider.sets.some((set) => set.emotes?.length > 0)
		);

		return (withEmotes ?? available[0])?.provider ?? channel.provider;
	}

	function parseHash(): {
		provider: ChannelProvider | null;
		setId: string | null;
		query: string;
	} {
		const [hashPart = '', queryPart = ''] = window.location.hash.slice(1).split('?');
		const [name, ...setParts] = hashPart.split('-');

		return {
			provider: available.find((provider) => provider.provider === name) ?? null,
			setId: setParts.length ? setParts.join('-') : null,
			query: new URLSearchParams(queryPart).get('q') ?? ''
		};
	}

	function updateUrl(): void {
		const provider = available.find((item) => item.provider === activeTab);
		const login = page.params.login;
		if (!login) return;

		let url = resolve('/channel/[provider]/[login]', {
			provider: channel.provider,
			login
		});

		if (provider) {
			const set = currentSets[activeTab];
			const query = searches[activeTab]?.trim();

			url += `#${activeTab}`;
			if (set && set.id !== getMainSet(provider)?.id) url += `-${set.id}`;
			if (query) url += `?q=${encodeURIComponent(query)}`;
		}

		try {
			goto(url, { shallow: true, replace: true });
		} catch {
			// ignore
		}
	}

	function applyHash(): void {
		const hash = parseHash();

		const sets: Record<string, Set> = {};
		const queries: Record<string, string> = {};

		for (const provider of available) {
			const selected =
				provider === hash.provider
					? provider.sets.find((set) => set.id === hash.setId)
					: currentSets[provider.provider];

			const set = selected ?? getMainSet(provider);
			if (!set) continue;

			sets[provider.provider] = set;
			queries[provider.provider] =
				provider === hash.provider ? hash.query : (searches[provider.provider] ?? '');
		}

		currentSets = sets;
		searches = queries;
		activeTab = hash.provider?.provider ?? getDefaultTab();

		updateUrl();
	}

	function changeSet(providerKey: string, newSet: Set): void {
		currentSets = { ...currentSets, [providerKey]: newSet };
		searches[providerKey] = '';
		updateUrl();
	}

	function changeTab(tabId: string): void {
		activeTab = tabId;
		updateUrl();
	}

	$effect(() => {
		void available;
		if (isLoading) return;

		untrack(applyHash);
	});

	$effect(() => {
		const onHashChange = () => {
			if (!isLoading) applyHash();
		};

		window.addEventListener('hashchange', onHashChange);
		return () => window.removeEventListener('hashchange', onHashChange);
	});
</script>

{#if isLoading && !hasNative}
	<Tabs>
		{#snippet tabs()}
			{#each { length: placeholderCount }, i}
				<TabButton id="placeholder-{i}" isActive={i === 0} changeTab={() => {}} />
			{/each}
		{/snippet}
		{#snippet content()}
			<TabContent isActive={true}>
				<ImageGrid isLoading={true} placeholderCount={36} />
			</TabContent>
		{/snippet}
	</Tabs>
{:else if hasNative || available.length}
	<Tabs>
		{#snippet tabs()}
			{#if hasNative}
				<TabButton
					label={$_(`provider.${channel.provider}`)}
					isActive={activeTab === channel.provider}
					image={`/logos/${channel.provider}.svg`}
					id={channel.provider}
					{changeTab}
				/>
			{/if}

			{#each available as provider (provider.provider)}
				<TabButton
					count={currentSets[provider.provider]?.emotes?.length || null}
					label={$_(`provider.${provider.provider}`)}
					isActive={activeTab === provider.provider}
					image={`/logos/${provider.provider}.svg`}
					id={provider.provider}
					{changeTab}
				/>
			{/each}

			{#if isLoading}
				{#each { length: placeholderCount - 1 }, i}
					<TabButton id="placeholder-{i}" isActive={false} changeTab={() => {}} />
				{/each}
			{/if}
		{/snippet}

		{#snippet content()}
			{#if hasNative}
				<TabContent isActive={activeTab === channel.provider}>
					<Content content={native} userData={user} />
				</TabContent>
			{/if}

			{#each available as provider (provider.provider)}
				{@const name = provider.provider}
				{@const currentSet = currentSets[name]}
				{@const emotes = filterEmotes(currentSet?.emotes ?? [], searches[name] ?? '')}

				<TabContent isActive={activeTab === name}>
					<div
						class="flex w-full flex-col items-center space-y-3 md:flex-row md:items-center md:space-y-0 md:space-x-4"
					>
						<div class="flex flex-1 flex-col items-center gap-2 md:flex-row">
							<a
								target="_blank"
								href={currentSet?.source}
								rel="external noopener noreferrer"
								aria-label={$_(`provider.${name}`)}
							>
								<img
									src="/logos/{name}.svg"
									alt={$_(`provider.${name}`)}
									title={$_(`provider.${name}`)}
									class="h-8 w-8"
								/>
							</a>
							<h2 class="text-2xl font-bold">
								{$_('set.label')}:
							</h2>
							<div class="flex items-center gap-2">
								<a
									href={currentSet
										? resolve('/set/[provider]/[id]', {
												provider: name,
												id: currentSet.id
											})
										: undefined}
									class="link text-secondary hover:link-secondary text-2xl font-bold break-all"
								>
									{setTitle(currentSet)}
								</a>
								{#if provider.sets.length > 1}
									<div class="dropdown dropdown-end">
										<div tabindex="0" role="button" class="btn h-8">
											<ChevronDown class="h-4 w-4" />
										</div>
										<ul
											class="dropdown-content menu menu-horizontal bg-base-300 rounded-box z-1 mt-10 max-h-60 w-full min-w-fit overflow-y-auto p-2 shadow-xl"
										>
											{#each provider.sets as set (set.id)}
												<li class="w-full">
													<button
														class="btn btn-block mb-1 h-auto min-h-fit items-center justify-between gap-2 text-left transition-all duration-200 {currentSet?.id ===
														set.id
															? 'btn-active bg-info text-primary-content'
															: 'btn-ghost hover:bg-accent hover:text-accent-content'}"
														onclick={() => changeSet(name, set)}
													>
														<span class="my-2 font-medium">
															{setTitle(set)}
														</span>
														<span class="text-xs opacity-70">
															({set.emotes?.length ?? 0})
														</span>
													</button>
												</li>
											{/each}
										</ul>
									</div>
								{/if}
							</div>
						</div>
						<label class="input ml-auto w-full md:max-w-3xs">
							<Search />
							<input
								type="search"
								required
								placeholder={$_('search.emote')}
								value={searches[name] ?? ''}
								oninput={(event) => {
									searches[name] = event.currentTarget.value;
									updateUrl();
								}}
							/>
						</label>
					</div>
					<div class="divider my-4"></div>
					{#if emotes.length === 0}
						<SearchError search={searches[name]} />
					{:else}
						<ImageGrid items={emotes} linkPrefix="emote" />
					{/if}
				</TabContent>
			{/each}
		{/snippet}
	</Tabs>
{/if}
