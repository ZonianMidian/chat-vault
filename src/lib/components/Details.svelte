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

	export let data: Emote | Badge | null = null;
	export let extras: Extras | null = null;
	export let error: string | null = null;

	export let isLoading: {
		info: boolean;
		extras: boolean;
		variants?: boolean;
		channels?: boolean;
	} = {
		info: true,
		extras: true,
		variants: true,
		channels: true
	};

	export let provider: string | null = null;
	export let createdAt: Date | null = null;
	export let deletedAt: Date | null = null;

	export let tabPages: { [key: string]: number } = {};
	export let itemsPerPage: number = 18;
	export let channels: Channel[] = [];

	export let type: 'emote' | 'badge' = 'emote';
	export let darkBackground: boolean = true;
	export let activeTab: string = 'info';

	export let variantCount: number = 0;
	export let variantImages: Map<string, string> = new Map();

	export let imageSizes: Map<string, Sizes> = new Map();
	export let imageUrls: Map<string, string> = new Map();

	export let nextPage: (totalItems: number) => void = () => {};
	export let prevPage: () => void = () => {};
</script>

<div class="flex min-h-[90vh] flex-col items-center justify-center px-3 py-5 2xl:px-0">
	{#if error || !data}
		<Error error={error ?? $_('status.404')} />
	{:else}
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
					{:else if data && type === 'emote' && (data as Emote).tags}
						{#each (data as Emote).tags as tag}
							<div class="badge badge-sm">{tag}</div>
						{/each}
					{/if}
				</div>
			</div>

			<ImageList
				zeroWidth={(type === 'emote' && (data as Emote)?.zeroWidth) ?? false}
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

						{#if (type === 'emote' && ((data as Emote)?.channels?.total ?? 0) > 0) || activeTab === 'channels'}
							<TabButton
								id="channels"
								label={$_('emote.channels.label')}
								icon={Users}
								count={type === 'emote'
									? ((data as Emote)?.channels?.total ?? 0)
									: 0}
								isActive={activeTab === 'channels'}
								{changeTab}
							/>
						{/if}

						{#if (extras?.related?.total ?? 0) > 0 || activeTab === 'related'}
							<TabButton
								id="related"
								label={$_('common.info.related')}
								icon={Images}
								count={extras?.related?.total ?? 0}
								isActive={activeTab === 'related'}
								{changeTab}
							/>
						{/if}

						{#if variantCount > 0 || activeTab === 'variants'}
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

						{#if (extras?.origin?.length ?? 0) > 0 || activeTab === 'origin'}
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
							item={data}
							{createdAt}
							{deletedAt}
							{type}
						/>

						{#if (type === 'emote' && ((data as Emote)?.channels?.total ?? 0) > 0) || activeTab === 'channels'}
							<ChannelsTab
								isActive={activeTab === 'channels'}
								isLoading={!!isLoading?.channels}
								currentPage={tabPages.channels || 1}
								{channels}
								totalChannels={type === 'emote'
									? ((data as Emote)?.channels?.total ?? 0)
									: 0}
								{itemsPerPage}
								onPrevPage={prevPage}
								onNextPage={() =>
									type === 'emote' && data && 'channels' in data && data.channels
										? nextPage((data as Emote).channels.total)
										: null}
							/>
						{/if}

						{#if (extras?.related?.total ?? 0) > 0 || activeTab === 'related'}
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

						{#if variantCount > 0 || activeTab === 'variants'}
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

						{#if (extras?.origin?.length ?? 0) > 0 || activeTab === 'origin'}
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
	{/if}
</div>
