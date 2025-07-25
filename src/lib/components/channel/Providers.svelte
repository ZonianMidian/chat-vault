<script lang="ts">
	import type {
		ChannelProvider,
		ChannelContent,
		ChannelPage,
		UserData,
		Set
	} from '$lib/types/common';

	import { ChevronDown, Search } from '@lucide/svelte';
	import { filterEmotes } from '$lib/utils';
	import { onMount } from 'svelte';
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

	let content = $derived<ChannelContent | null>(data.channel?.content ?? null);
	let user = $derived<UserData | null>(data?.channel?.user ?? null);

	let computedActiveTab = $derived(() => {
		if (providerData) {
			return data.provider;
		} else if (providers && providers.length > 0) {
			const withEmotes = providers.find(
				(p: ChannelProvider) =>
					p.sets && p.sets.some((set) => set.emotes && set.emotes.length > 0)
			);
			if (withEmotes) {
				return withEmotes.provider;
			}
			return providers[0].provider;
		}
		return data.provider;
	});

	$effect(() => {
		activeTab = computedActiveTab();
	});

	let filteredEmotesByProvider = $derived(() => {
		const result: Record<string, any[]> = {};

		Object.keys(searches).forEach((providerKey) => {
			const currentSet = getCurrentSet(providerKey);
			const search = searches[providerKey] || '';
			const emotes = currentSet?.emotes || [];
			result[providerKey] = filterEmotes(emotes, search);
		});

		return result;
	});

	function getCurrentSet(providerKey: string): Set | null {
		return currentSets[providerKey] || null;
	}

	function initializeCurrentSets(): void {
		if (!providers) return;

		const newCurrentSets: Record<string, Set> = {};
		const newSearches: Record<string, string> = {};

		providers.forEach((provider: ChannelProvider) => {
			if (provider.sets && provider.sets.length > 0) {
				const mainSet =
					provider.sets.find((set) => set.mainSet === true) || provider.sets[0];
				newCurrentSets[provider.provider] = mainSet;
				newSearches[provider.provider] = '';
			}
		});

		currentSets = newCurrentSets;
		searches = newSearches;
	}

	function changeSet(providerKey: string, newSet: Set): void {
		currentSets = { ...currentSets, [providerKey]: newSet };
		searches = { ...searches, [providerKey]: '' };
	}

	$effect(() => {
		if (providers && Object.keys(currentSets).length === 0) {
			initializeCurrentSets();
		}
	});

	onMount(() => {
		initializeCurrentSets();
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
{:else if providerData || (providers && providers.length > 0)}
	<Tabs bind:activeTab>
		<svelte:fragment slot="tabs" let:changeTab let:activeTab>
			{#if providerData}
				<TabButton
					id={data.provider}
					label={$_(`provider.${data.provider}`)}
					isActive={activeTab === data.provider}
					image={`/logos/${data.provider}.svg`}
					{isLoading}
					{changeTab}
				/>
			{/if}

			{#if providers && providers.length > 0}
				{#each providers.filter((provider: ChannelProvider) => provider.sets && provider.sets.length > 0) as provider}
					{@const currentSet = currentSets[provider.provider]}
					<TabButton
						id={provider.provider}
						label={$_(`provider.${provider.provider}`)}
						isActive={activeTab === provider.provider}
						image={`/logos/${provider.provider}.svg`}
						count={currentSet?.emotes?.length === 0 ? null : currentSet?.emotes?.length}
						{isLoading}
						{changeTab}
					/>
				{/each}
			{/if}
		</svelte:fragment>

		<svelte:fragment slot="content">
			{#if providerData && content}
				<TabContent isActive={activeTab === data.provider}>
					<Content {content} />
				</TabContent>
			{/if}

			{#if providers && providers.length > 0}
				{#each providers.filter((provider: ChannelProvider) => provider.sets && provider.sets.length > 0) as provider}
					{@const currentSet = currentSets[provider.provider]}
					{@const filteredEmotes = filteredEmotesByProvider()[provider.provider] || []}
					<TabContent isActive={activeTab === provider.provider}>
						<div
							class="flex w-full flex-col items-center space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4"
						>
							<div class="flex flex-1 flex-col items-center gap-2 sm:flex-row">
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
										class="link text-secondary hover:link-secondary text-2xl font-bold"
									>
										{currentSet?.name ??
											$_('set.title', {
												values: { user: user?.username }
											})}
									</a>
									<div class="dropdown dropdown-end sm:dropdown-start">
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
												class="dropdown-content menu bg-base-100 rounded-box z-[1] mt-1 max-h-60 w-full min-w-fit overflow-y-auto p-2 shadow"
											>
												{#each provider.sets as set}
													<li>
														<button
															class="flex w-full items-center justify-between rounded p-2 text-left {currentSet?.id ===
															set.id
																? 'bg-primary text-primary-content btn-disabled'
																: 'hover:bg-base-200'}"
															onclick={() =>
																changeSet(provider.provider, set)}
														>
															<span class="font-medium"
																>{set.name}</span
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
							<label class="input ml-auto w-full sm:max-w-3xs">
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
