<script lang="ts">
	import type { Emote, Extras, Channel, Sizes, Badge } from '$lib/types/common';

	import { Info, Users, Images, WandSparkles, BookText } from '@lucide/svelte';
	import { _ } from 'svelte-i18n';

	import ChannelsTab from '$lib/components/details/tabs/Channels.svelte';
	import VariantsTab from '$lib/components/details/tabs/Variants.svelte';
	import RelatedTab from '$lib/components/details/tabs/Related.svelte';
	import OriginTab from '$lib/components/details/tabs/Origin.svelte';
	import InfoTab from '$lib/components/details/tabs/Info.svelte';
	import ImageList from '$lib/components/details/Images.svelte';
	import Owner from '$lib/components/details/Owner.svelte';
	import TabButton from '$lib/components/TabButton.svelte';
	import Error from '$lib/components/Error.svelte';
	import Tabs from '$lib/components/Tabs.svelte';

	let {
		data = null,
		extras = null,
		error = null,
		isLoading = {
			info: true,
			extras: true,
			variants: true,
			channels: true
		},
		provider = null,
		createdAt = null,
		deletedAt = null,
		tabPages = {},
		itemsPerPage = 18,
		channels = [],
		type = 'emote',
		darkBackground = $bindable(true),
		activeTab = $bindable('info'),
		variantCount = 0,
		variantImages = new Map(),
		imageSizes = new Map(),
		imageUrls = new Map(),
		nextPage = () => {},
		prevPage = () => {}
	} = $props<{
		data?: Emote | Badge | null;
		extras?: Extras | null;
		error?: string | null;
		isLoading?: {
			info: boolean;
			extras: boolean;
			variants?: boolean;
			channels?: boolean;
		};
		provider?: string | null;
		createdAt?: Date | null;
		deletedAt?: Date | null;
		tabPages?: { [key: string]: number };
		itemsPerPage?: number;
		channels?: Channel[];
		type?: 'emote' | 'badge';
		darkBackground?: boolean;
		activeTab?: string;
		variantCount?: number;
		variantImages?: Map<string, string>;
		imageSizes?: Map<string, Sizes>;
		imageUrls?: Map<string, string>;
		nextPage?: (totalItems: number) => void;
		prevPage?: () => void;
	}>();

	let shouldShowChannelsTab = $derived(() => {
		return (
			(type === 'emote' && ((data as Emote)?.channels?.total ?? 0) > 0) ||
			activeTab === 'channels'
		);
	});

	let shouldShowRelatedTab = $derived(() => {
		return (extras?.related?.total ?? 0) > 0 || activeTab === 'related';
	});

	let shouldShowVariantsTab = $derived(() => {
		return variantCount > 0 || activeTab === 'variants';
	});

	let shouldShowOriginTab = $derived(() => {
		return (extras?.origin?.length ?? 0) > 0 || activeTab === 'origin';
	});

	let channelsTotal = $derived(() => {
		return type === 'emote' ? ((data as Emote)?.channels?.total ?? 0) : 0;
	});

	let emoteTags = $derived(() => {
		return type === 'emote' ? (data as Emote)?.tags || [] : [];
	});

	let isEmoteZeroWidth = $derived(() => {
		return type === 'emote' && (data as Emote)?.zeroWidth;
	});

	let isEmoteGlobal = $derived(() => {
		return type === 'emote' && (data as Emote)?.global;
	});

	let isEmoteDeleted = $derived(() => {
		return type === 'emote' && (data as Emote)?.deleted;
	});
</script>

{#if error || !data}
	<div class="flex min-h-[90vh] flex-col items-center justify-center px-3 py-5 2xl:px-0">
		<Error error={error ?? $_('status.404')} />
	</div>
{:else}
	<div class="flex flex-col items-center justify-center px-3 py-5 xl:py-15 2xl:px-0">
		<div class="bg-neutral mx-auto w-full max-w-7xl space-y-6 rounded-xl p-6 shadow-md">
			<Owner
				owner={data?.owner ?? null}
				provider={provider ?? null}
				source={data?.source}
				isLoading={isLoading.info}
			/>

			<div class="text-center">
				{#if isLoading.info}
					<div class="skeleton mx-auto h-10 w-48"></div>
				{:else if data}
					<h2 class="text-base-content mt-2 text-3xl font-bold">{data.name}</h2>
				{/if}
				<div class="mt-2 flex justify-center gap-2">
					{#if isLoading.info}
						{#each Array(2) as _}
							<div class="skeleton h-4 w-16"></div>
						{/each}
					{:else if data && type === 'emote' && emoteTags.length > 0}
						{#each emoteTags() as tag}
							<div class="badge badge-sm">{tag}</div>
						{/each}
					{/if}
				</div>
			</div>

			<ImageList
				zeroWidth={isEmoteZeroWidth() ?? false}
				global={isEmoteGlobal() ?? false}
				images={data?.images || []}
				isLoading={isLoading.info}
				provider={provider ?? ''}
				name={data?.name || ''}
				{imageSizes}
				{imageUrls}
				{type}
				bind:darkBackground
			/>

			{#if type === 'emote' || (type === 'badge' && data.owner)}
				<Tabs bind:activeTab>
					<svelte:fragment slot="tabs" let:changeTab let:activeTab>
						<TabButton
							id="info"
							label={$_('common.info.label')}
							icon={Info}
							isActive={activeTab === 'info'}
							{changeTab}
						/>

						{#if shouldShowChannelsTab()}
							<TabButton
								id="channels"
								label={$_('emote.channels.label')}
								icon={Users}
								count={channelsTotal()}
								isActive={activeTab === 'channels'}
								{changeTab}
							/>
						{/if}

						{#if shouldShowRelatedTab()}
							<TabButton
								id="related"
								label={$_('common.info.related')}
								icon={Images}
								count={extras?.related?.total ?? 0}
								isActive={activeTab === 'related'}
								{changeTab}
							/>
						{/if}

						{#if shouldShowVariantsTab()}
							<TabButton
								id="variants"
								label={$_('emote.variants.label')}
								icon={WandSparkles}
								count={variantCount}
								isActive={activeTab === 'variants'}
								isLoading={isLoading.variants}
								{changeTab}
							/>
						{/if}

						{#if shouldShowOriginTab()}
							<TabButton
								id="origin"
								label={$_('emote.origin.label')}
								icon={BookText}
								isActive={activeTab === 'origin'}
								{changeTab}
							/>
						{/if}
					</svelte:fragment>

					<svelte:fragment slot="content">
						<InfoTab
							isActive={activeTab === 'info'}
							isLoading={isLoading.info}
							isDeleted={isEmoteDeleted() ?? false}
							item={data}
							{createdAt}
							{deletedAt}
							{type}
						/>

						{#if shouldShowChannelsTab()}
							<ChannelsTab
								isActive={activeTab === 'channels'}
								isLoading={!!isLoading?.channels}
								currentPage={tabPages.channels || 1}
								{provider}
								{channels}
								totalChannels={channelsTotal()}
								{itemsPerPage}
								onPrevPage={prevPage}
								onNextPage={() =>
									type === 'emote' && data && 'channels' in data && data.channels
										? nextPage((data as Emote).channels.total)
										: null}
							/>
						{/if}

						{#if shouldShowRelatedTab()}
							<RelatedTab
								isActive={activeTab === 'related'}
								isLoading={isLoading.extras}
								currentPage={tabPages[activeTab] || 1}
								relatedEmotes={extras?.related?.list ?? []}
								totalRelated={extras?.related?.total ?? 0}
								{itemsPerPage}
								{type}
								onPrevPage={prevPage}
								onNextPage={() =>
									extras?.related ? nextPage(extras.related.total) : null}
							/>
						{/if}

						{#if shouldShowVariantsTab()}
							<VariantsTab
								isActive={activeTab === 'variants'}
								isLoading={!!isLoading?.variants}
								currentPage={tabPages[activeTab] || 1}
								{variantImages}
								emoteName={data?.name || ''}
								emoteId={data?.id || ''}
								{itemsPerPage}
								onPrevPage={prevPage}
								onNextPage={() => nextPage(variantCount)}
							/>
						{/if}

						{#if shouldShowOriginTab()}
							<OriginTab
								isActive={activeTab === 'origin'}
								isLoading={isLoading.extras}
								origins={extras?.origin ?? []}
							/>
						{/if}
					</svelte:fragment>
				</Tabs>
			{/if}
		</div>
	</div>
{/if}
