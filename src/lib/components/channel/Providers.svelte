<script lang="ts">
	import type {
		ChannelProvider,
		ChannelContent,
		ChannelPage,
		UserData,
		Set
	} from '$lib/types/common';

	import { ChevronDown, Search } from '@lucide/svelte';
	import { browser } from '$app/environment';
	import { filterEmotes } from '$lib/utils';
	import { _ } from 'svelte-i18n';

	import Content from '$lib/components/channel/Content.svelte';
	import SearchError from '$lib/components/SearchError.svelte';
	import TabContent from '$lib/components/TabContent.svelte';
	import TabButton from '$lib/components/TabButton.svelte';
	import ImageGrid from '$lib/components/ImageGrid.svelte';
	import Tabs from '$lib/components/Tabs.svelte';

	const {
		providers = null,
		providerData = false,
		isLoading = true,
		data
	} = $props<{
		providers?: ChannelProvider[] | null;
		providerData?: boolean;
		isLoading?: boolean;
		data: ChannelPage;
	}>();

	let currentSets = $state<Record<string, Set>>({});
	let searches = $state<Record<string, string>>({});
	let activeTab = $state<string>(data.provider);
	let placeholderCount = $state<number>(3);
	let initKey = $state<string>('');

	let content = $derived<ChannelContent | null>(data.channel?.content ?? null);
	let user = $derived<UserData | null>(data?.channel?.user ?? null);

	let filteredEmotesByProvider = $derived(() => {
		const result: Record<string, any[]> = {};
		for (const [providerKey, search] of Object.entries(searches)) {
			const currentSet = currentSets[providerKey];
			const emotes = currentSet?.emotes || [];
			result[providerKey] = filterEmotes(emotes, search || '');
		}
		return result;
	});

	function getOptimalTab(): string {
		if (providerData) return data.provider;

		if (providers?.length) {
			const withEmotes = providers.find((p: ChannelProvider) =>
				p.sets?.some((set) => set.emotes?.length > 0)
			);
			return withEmotes?.provider || providers[0].provider;
		}

		return data.provider;
	}

	function parseHash(): { provider: string | null; setId: string | null } {
		if (!browser) return { provider: null, setId: null };

		const hash = window.location.hash.slice(1);
		if (!hash) return { provider: null, setId: null };

		const parts = hash.split('-');
		const provider = parts[0];
		const setId = parts.length > 1 ? parts.slice(1).join('-') : null;

		const availableProviders = providers?.map((p: ChannelProvider) => p.provider) || [];
		const validProvider = availableProviders.includes(provider) ? provider : null;

		return { provider: validProvider, setId };
	}

	function findSetInProvider(provider: ChannelProvider, setId: string): Set | null {
		return provider.sets?.find((set: Set) => set.id === setId) || null;
	}

	function getMainSet(provider: ChannelProvider): Set | null {
		if (!provider.sets?.length) return null;
		return provider.sets.find((set: Set) => set.mainSet) || provider.sets[0];
	}

	function updateUrlHash(tabId: string, setId?: string): void {
		if (!browser) return;

		const isProviderTab = providers?.some((p: ChannelProvider) => p.provider === tabId);

		if (isProviderTab) {
			const provider = providers?.find((p: ChannelProvider) => p.provider === tabId);
			const mainSet = provider ? getMainSet(provider) : null;

			if (setId && mainSet && setId !== mainSet.id) {
				window.history.replaceState(
					null,
					'',
					`${window.location.pathname}#${tabId}-${setId}`
				);
			} else {
				window.history.replaceState(null, '', `${window.location.pathname}#${tabId}`);
			}
		} else if (tabId === data.provider) {
			window.history.replaceState(null, '', window.location.pathname);
		}
	}

	function syncUrlWithCurrentState(): void {
		if (!browser) return;

		const currentSet = currentSets[activeTab];
		const provider = providers?.find((p: ChannelProvider) => p.provider === activeTab);
		const mainSet = provider ? getMainSet(provider) : null;

		if (activeTab === data.provider) {
			window.history.replaceState(null, '', window.location.pathname);
		} else if (provider) {
			if (currentSet && mainSet && currentSet.id !== mainSet.id) {
				window.history.replaceState(
					null,
					'',
					`${window.location.pathname}#${activeTab}-${currentSet.id}`
				);
			} else {
				window.history.replaceState(null, '', `${window.location.pathname}#${activeTab}`);
			}
		} else {
			const optimalTab = getOptimalTab();
			window.history.replaceState(
				null,
				'',
				optimalTab === data.provider
					? window.location.pathname
					: `${window.location.pathname}#${optimalTab}`
			);
		}
	}

	function initializeSets(): void {
		if (!providers) return;

		const key = providers
			.map((p: ChannelProvider) => `${p.provider}-${p.sets?.length || 0}`)
			.join('|');
		if (initKey === key) return;

		const newCurrentSets: Record<string, Set> = {};
		const newSearches: Record<string, string> = {};

		for (const provider of providers) {
			if (provider.sets?.length) {
				const mainSet = getMainSet(provider);
				if (mainSet) {
					newCurrentSets[provider.provider] = mainSet;
					newSearches[provider.provider] = searches[provider.provider] || '';
				}
			}
		}

		currentSets = newCurrentSets;
		searches = newSearches;
		initKey = key;

		const { provider: hashProvider, setId: hashSetId } = parseHash();
		let finalTab = hashProvider || getOptimalTab();

		if (hashProvider && hashSetId) {
			const provider = providers.find((p: ChannelProvider) => p.provider === hashProvider);
			if (provider) {
				const targetSet = findSetInProvider(provider, hashSetId);
				if (targetSet) {
					newCurrentSets[hashProvider] = targetSet;
					currentSets = { ...currentSets, ...newCurrentSets };
				}
			}
		}

		if (activeTab !== finalTab) {
			activeTab = finalTab;
		}

		syncUrlWithCurrentState();
	}

	function changeSet(providerKey: string, newSet: Set): void {
		currentSets = { ...currentSets, [providerKey]: newSet };
		searches = { ...searches, [providerKey]: '' };
		updateUrlHash(providerKey, newSet.id);
	}

	function handleTabChange(tabId: string): void {
		const currentSet = currentSets[tabId];
		updateUrlHash(tabId, currentSet?.id);
		activeTab = tabId;
	}

	$effect(() => {
		if (providers) {
			initializeSets();
		}

		if (browser) {
			const handleHashChange = (): void => {
				const { provider: hashProvider, setId: hashSetId } = parseHash();

				if (hashProvider) {
					if (activeTab !== hashProvider) {
						activeTab = hashProvider;
					}

					if (hashSetId) {
						const provider = providers?.find(
							(p: ChannelProvider) => p.provider === hashProvider
						);
						if (provider) {
							const targetSet = findSetInProvider(provider, hashSetId);
							if (targetSet && currentSets[hashProvider]?.id !== targetSet.id) {
								currentSets = { ...currentSets, [hashProvider]: targetSet };
							} else if (!targetSet) {
								const mainSet = getMainSet(provider);
								if (mainSet) {
									currentSets = { ...currentSets, [hashProvider]: mainSet };
								}
								syncUrlWithCurrentState();
							}
						}
					}
				} else {
					const optimalTab = getOptimalTab();
					if (activeTab !== optimalTab) {
						activeTab = optimalTab;
					}
					syncUrlWithCurrentState();
				}
			};

			window.addEventListener('hashchange', handleHashChange);
			return () => window.removeEventListener('hashchange', handleHashChange);
		}
	});
</script>

{#if isLoading}
	<Tabs {activeTab}>
		<svelte:fragment slot="tabs">
			{#each Array(placeholderCount) as _, i}
				<TabButton id="placeholder-{i}" isActive={i === 0} changeTab={() => {}} />
			{/each}
		</svelte:fragment>
		<svelte:fragment slot="content">
			{#each Array(placeholderCount) as _, i}
				<TabContent isActive={i === 0}>
					<ImageGrid isLoading={true} placeholderCount={36} />
				</TabContent>
			{/each}
		</svelte:fragment>
	</Tabs>
{:else if providerData || providers?.length}
	<Tabs bind:activeTab>
		<svelte:fragment slot="tabs" let:changeTab let:activeTab>
			{#if providerData}
				<TabButton
					id={data.provider}
					label={$_(`provider.${data.provider}`)}
					isActive={activeTab === data.provider}
					image={`/logos/${data.provider}.svg`}
					{isLoading}
					changeTab={handleTabChange}
				/>
			{/if}

			{#if providers}
				{#each providers.filter((p: ChannelProvider) => p.sets?.length) as provider}
					{@const currentSet = currentSets[provider.provider]}
					<TabButton
						id={provider.provider}
						label={$_(`provider.${provider.provider}`)}
						isActive={activeTab === provider.provider}
						image={`/logos/${provider.provider}.svg`}
						count={currentSet?.emotes?.length === 0 ? null : currentSet?.emotes?.length}
						{isLoading}
						changeTab={handleTabChange}
					/>
				{/each}
			{/if}
		</svelte:fragment>

		<svelte:fragment slot="content">
			{#if providerData && content}
				<TabContent isActive={activeTab === data.provider}>
					<Content {content} userData={user} />
				</TabContent>
			{/if}

			{#if providers}
				{#each providers.filter((p: ChannelProvider) => p.sets?.length) as provider}
					{@const currentSet = currentSets[provider.provider]}
					{@const filteredEmotes = filteredEmotesByProvider()[provider.provider] || []}
					<TabContent isActive={activeTab === provider.provider}>
						<div
							class="flex w-full flex-col items-center space-y-3 md:flex-row md:items-center md:space-y-0 md:space-x-4"
						>
							<div class="flex flex-1 flex-col items-center gap-2 md:flex-row">
								<a
									href={currentSet?.source}
									target="_blank"
									rel="noopener noreferrer"
									aria-label={$_(`provider.${provider.provider}`)}
								>
									<img
										src="/logos/{provider.provider}.svg"
										alt={$_(`provider.${provider.provider}`)}
										title={$_(`provider.${provider.provider}`)}
										class="h-8 w-8"
									/>
								</a>
								<h2 class="text-2xl font-bold">
									{$_('set.label')}:
								</h2>
								<div class="flex items-center gap-2">
									<a
										href="/set/{provider.provider}/{currentSet?.id}"
										class="link text-secondary hover:link-secondary text-2xl font-bold break-all"
									>
										{currentSet?.name ??
											$_('set.title', { values: { user: user?.username } })}
									</a>
									<div class="dropdown dropdown-end">
										<div
											tabindex="0"
											role="button"
											class="btn h-8 {provider.sets.length === 1
												? 'btn-disabled hidden'
												: ''}"
										>
											<ChevronDown class="h-4 w-4" />
										</div>
										{#if provider.sets.length > 1}
											<ul
												class="dropdown-content menu menu-horizontal bg-base-300 rounded-box z-[1] mt-10 max-h-60 w-full min-w-fit overflow-y-auto p-2 shadow-xl"
											>
												{#each provider.sets as set}
													<li class="w-full">
														<button
															class="btn btn-block mb-1 h-auto min-h-fit items-center justify-between gap-2 text-left transition-all duration-200 {currentSet?.id ===
															set.id
																? 'btn-active bg-info text-primary-content'
																: 'btn-ghost hover:bg-accent hover:text-accent-content'}"
															onclick={() =>
																changeSet(provider.provider, set)}
														>
															<span class="my-2 font-medium"
																>{set.name ??
																	$_('set.title', {
																		values: {
																			user: user?.username
																		}
																	})}</span
															>
															<span class="text-xs opacity-70"
																>({set.emotes?.length ?? 0})</span
															>
														</button>
													</li>
												{/each}
											</ul>
										{/if}
									</div>
								</div>
							</div>
							<label class="input ml-auto w-full md:max-w-3xs">
								<Search />
								<input
									type="search"
									required
									placeholder={$_('search.emote')}
									bind:value={searches[provider.provider]}
								/>
							</label>
						</div>
						<div class="divider my-4"></div>
						{#if filteredEmotes.length === 0}
							<SearchError search={searches[provider.provider]} />
						{:else}
							<ImageGrid
								items={filteredEmotes}
								placeholderCount={45}
								linkPrefix="emote"
								isLoading={false}
							/>
						{/if}
					</TabContent>
				{/each}
			{/if}
		</svelte:fragment>
	</Tabs>
{/if}
