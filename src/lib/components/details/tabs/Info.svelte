<script lang="ts">
	import type { Badge, Emote } from '$lib/types/common';

	import { _, date } from 'svelte-i18n';
	import {
		CalendarPlus,
		CheckCircle,
		CalendarX2,
		XCircle,
		Folder,
		Brush,
		Globe,
		Coins,
		Lock,
		LetterText,
		SquareMousePointer
	} from '@lucide/svelte';

	import MenuContent from '$lib/components/MenuContent.svelte';
	import TabContent from '$lib/components/TabContent.svelte';

	export let item: Emote | Badge | null;
	export let type: 'emote' | 'badge';
	export let deletedAt: Date | null;
	export let createdAt: Date | null;
	export let isLoading: boolean;
	export let isActive: boolean;

	let placeholderCount = 5;
</script>

<TabContent {isActive}>
	<ul class="menu menu-horizontal bg-base-100 w-full">
		{#if isLoading}
			{#each Array(placeholderCount) as _}
				<li>
					<div class="flex items-center gap-2">
						<div class="skeleton h-4 w-4 rounded"></div>
						<div class="skeleton h-4 w-32"></div>
					</div>
				</li>
			{/each}
		{:else}
			{#if type === 'emote' && item && (item as Emote)?.artist && 'artist' in item}
				<MenuContent
					icon={Brush}
					label="emote.info.artist"
					href={`/channel/${item.artist?.platform}/${item.artist?.username}`}
					content={item.artist?.username}
				/>
			{/if}

			{#if type === 'badge' && item && (item as Badge)?.cost && 'cost' in item}
				<MenuContent
					icon={Coins}
					label="badge.info.cost"
					content={$_('badge.bits', { values: { cost: item.cost } })}
				/>
			{/if}

			{#if createdAt}
				<MenuContent
					icon={CalendarPlus}
					label="common.info.created"
					content={$date(new Date(createdAt), { format: 'long' })}
				/>
			{/if}

			{#if deletedAt}
				<MenuContent
					icon={CalendarX2}
					label="common.info.removed"
					content={$date(new Date(deletedAt), { format: 'long' })}
				/>
			{/if}

			{#if type === 'badge' && item && (item as Badge)?.description && 'description' in item}
				<MenuContent
					icon={LetterText}
					label="badge.info.description"
					content={item.description}
				/>
			{/if}

			{#if type === 'badge' && item && (item as Badge)?.clickAction && 'clickAction' in item}
				<MenuContent
					icon={SquareMousePointer}
					label="badge.info.action.label"
					content={$_(`badge.info.action.${item.clickAction}`)}
					href={item.clickURL || null}
				/>
			{/if}

			{#if type === 'emote' && item && (item as Emote).public && 'public' in item}
				<MenuContent
					icon={item?.public ? Globe : Lock}
					label="emote.info.status.label"
					content={item?.public
						? $_('emote.info.status.public')
						: $_('emote.info.status.private')}
				/>
			{/if}

			{#if type === 'emote' && item && (item as Emote).public && 'approved' in item}
				<MenuContent
					icon={item?.approved ? CheckCircle : XCircle}
					label="emote.info.approved"
					content={item?.approved ? $_('common.yes') : $_('common.no')}
				/>
			{/if}

			{#if item?.setId}
				<MenuContent
					icon={Folder}
					label="emote.info.set"
					href={`/set/${item.provider}/${item.setId}`}
					content={item.setId}
				/>
			{/if}
		{/if}
	</ul>
</TabContent>
