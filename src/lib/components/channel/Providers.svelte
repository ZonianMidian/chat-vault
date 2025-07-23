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

	export let providers: ChannelProvider[] | null = null;
	export let providerData: boolean = false;
	export let isLoading: boolean = true;
	export let data: ChannelPage;

	let content: ChannelContent | null = data.channel?.content ?? null;
	let user: UserData | null = data?.channel?.user ?? null;
	let currentSets: Record<string, Set> = {};
	let searches: Record<string, string> = {};
	let activeTab: string = data.provider;
	let placeholderCount: number = 3;

	$: if (providers && Object.keys(currentSets).length === 0) {
		initializeCurrentSets();
	}

	$: if (providerData) {
		activeTab = data.provider;
	} else if (providers && providers.length > 0) {
		activeTab = providers[0].provider;
	}

	$: filteredEmotesByProvider = Object.fromEntries(
		Object.keys(searches).map((providerKey) => [
			providerKey,
			(() => {
				const currentSet = getCurrentSet(providerKey);
				const search = searches[providerKey] || '';
				const emotes = currentSet?.emotes || [];
				return filterEmotes(emotes, search);
			})()
		])
	);

	function getCurrentSet(providerKey: string): Set | null {
		return currentSets[providerKey] || null;
	}

	function initializeCurrentSets(): void {
		if (providers) {
			const newCurrentSets: Record<string, Set> = {};
			const newSearches: Record<string, string> = {};

			providers.forEach((provider) => {
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
	}

	function changeSet(providerKey: string, newSet: Set): void {
		currentSets = { ...currentSets, [providerKey]: newSet };
		searches = { ...searches, [providerKey]: '' };
	}

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
				{#each providers.filter((provider) => provider.sets && provider.sets.length > 0) as provider}
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
				{#each providers.filter((provider) => provider.sets && provider.sets.length > 0) as provider}
					{@const currentSet = currentSets[provider.provider]}
					{@const filteredEmotes = filteredEmotesByProvider[provider.provider] || []}
					<TabContent isActive={activeTab === provider.provider}>
						<div
							class="flex w-full flex-col items-center space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4"
						>
							<div class="flex flex-1 items-center gap-2">
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
								<a
									href="/set/{provider.provider}/{currentSet?.id}"
									class="link text-secondary hover:link-secondary text-2xl font-bold"
								>
									{currentSet?.name ??
										$_('set.title', {
											values: { user: user?.username }
										})}
								</a>
								<div class="dropdown dropdown-left sm:dropdown-right">
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
														on:click={() =>
															changeSet(provider.provider, set)}
													>
														<span class="font-medium">{set.name}</span>
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
