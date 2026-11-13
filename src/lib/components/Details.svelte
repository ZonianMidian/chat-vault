<script lang="ts">
	import type { Badge, Badges, Emote, Emotes, Origin, Variant } from '#lib/types/common.ts';

	import { Info, Users, Images, WandSparkles, BookText } from '@lucide/svelte';
	import { _ } from 'svelte-i18n';

	import ChannelsTab from '#lib/components/details/tabs/Channels.svelte';
	import VariantsTab from '#lib/components/details/tabs/Variants.svelte';
	import RelatedTab from '#lib/components/details/tabs/Related.svelte';
	import OriginTab from '#lib/components/details/tabs/Origin.svelte';
	import InfoTab from '#lib/components/details/tabs/Info.svelte';
	import ImageList from '#lib/components/details/Images.svelte';
	import Owner from '#lib/components/details/Owner.svelte';
	import TabButton from '#lib/components/TabButton.svelte';
	import Tabs from '#lib/components/Tabs.svelte';

	let {
		type,
		provider,
		item = null,
		createdAt = null,
		deletedAt = null,
		related = [],
		variants = [],
		origins = [],
		relatedLoading = false,
		variantsLoading = false,
		originLoading = false
	}: {
		type: 'emote' | 'badge';
		provider: string;
		item?: Emote | Badge | null;
		createdAt?: Date | string | null;
		deletedAt?: Date | string | null;
		related?: Emotes[] | Badges[];
		variants?: Variant[];
		origins?: Origin[];
		relatedLoading?: boolean;
		variantsLoading?: boolean;
		originLoading?: boolean;
	} = $props();

	let activeTab = $state('info');

	const emote = $derived(type === 'emote' ? (item as Emote | null) : null);
	const channelsTotal = $derived(emote?.channels?.total ?? 0);

	const showChannels = $derived(channelsTotal > 0);
	const showRelated = $derived(related.length > 0);
	const showVariants = $derived(variants.length > 0);
	const showOrigin = $derived(origins.length > 0);

	const changeTab = (id: string) => (activeTab = id);
</script>

<div class="container-general">
	<div class="bg-neutral mx-auto w-full max-w-7xl space-y-6 rounded-xl p-6 shadow-md">
		<Owner owner={item?.owner ?? null} {provider} source={item?.source} isLoading={!item} />

		<div class="text-center">
			{#if !item}
				<div class="skeleton mx-auto h-10 w-48"></div>
			{:else}
				<h1 class="text-base-content mt-2 text-3xl font-bold">{item.name}</h1>
			{/if}
			<div class="mt-2 flex justify-center gap-2">
				{#if !item}
					{#each [0, 1] as index (index)}
						<div class="skeleton h-4 w-16"></div>
					{/each}
				{:else}
					{#each emote?.tags ?? [] as tag, i (i)}
						<div class="badge badge-sm">{tag}</div>
					{/each}
				{/if}
			</div>
		</div>

		<ImageList
			zero_width={emote?.zero_width ?? false}
			global={item?.global ?? false}
			images={item?.images ?? []}
			name={item?.name ?? ''}
			isLoading={!item}
			{provider}
			{type}
		/>

		<Tabs>
			{#snippet tabs()}
				<TabButton
					id="info"
					label={$_('common.info.label')}
					icon={Info}
					isActive={activeTab === 'info'}
					{changeTab}
				/>

				{#if showChannels}
					<TabButton
						id="channels"
						label={$_('navbar.channels')}
						icon={Users}
						count={channelsTotal}
						isActive={activeTab === 'channels'}
						{changeTab}
					/>
				{/if}

				{#if showRelated}
					<TabButton
						id="related"
						label={$_('common.info.related')}
						icon={Images}
						count={related.length}
						isActive={activeTab === 'related'}
						{changeTab}
					/>
				{:else if item && relatedLoading}
					<TabButton id="placeholder-related" isActive={false} changeTab={() => {}} />
				{/if}

				{#if showVariants}
					<TabButton
						id="variants"
						label={$_('emote.variants.label')}
						icon={WandSparkles}
						count={variants.length}
						isActive={activeTab === 'variants'}
						{changeTab}
					/>
				{:else if item && variantsLoading}
					<TabButton id="placeholder-variants" isActive={false} changeTab={() => {}} />
				{/if}

				{#if showOrigin}
					<TabButton
						id="origin"
						label={$_('emote.origin.label')}
						icon={BookText}
						isActive={activeTab === 'origin'}
						{changeTab}
					/>
				{:else if item && originLoading}
					<TabButton id="placeholder-origin" isActive={false} changeTab={() => {}} />
				{/if}
			{/snippet}

			{#snippet content()}
				<InfoTab isActive={activeTab === 'info'} {item} {createdAt} {deletedAt} {type} />

				{#if showChannels && emote}
					<ChannelsTab
						isActive={activeTab === 'channels'}
						emoteId={emote.id}
						initial={emote.channels}
						{provider}
					/>
				{/if}

				{#if showRelated}
					<RelatedTab isActive={activeTab === 'related'} items={related} {type} />
				{/if}

				{#if showVariants}
					<VariantsTab isActive={activeTab === 'variants'} {variants} />
				{/if}

				{#if showOrigin}
					<OriginTab isActive={activeTab === 'origin'} {origins} />
				{/if}
			{/snippet}
		</Tabs>
	</div>
</div>
