<script lang="ts">
	import type { Badge, Emote } from '$lib/types/common';

	import { _, date, format } from 'svelte-i18n';
	import {
		SquareMousePointer,
		CalendarPlus,
		CheckCircle,
		CalendarX2,
		LetterText,
		Shredder,
		XCircle,
		Folder,
		Brush,
		Coins,
		Lock,
		Tags,
		Eye
	} from '@lucide/svelte';

	import MenuContent from '$lib/components/MenuContent.svelte';
	import TabContent from '$lib/components/TabContent.svelte';
	import { emoteVariants } from '$lib/utils';

	export let item: Emote | Badge | null;
	export let type: 'emote' | 'badge';
	export let deletedAt: Date | null;
	export let createdAt: Date | null;
	export let isLoading: boolean;
	export let isDeleted: boolean;
	export let isActive: boolean;

	let placeholderCount = 5;

	const getEmoteLabel = (type: string | null): string => {
		switch (type) {
			case 'BITS_BADGE_TIERS':
				return $format('set.bits');
			case 'MEGA_COMMERCE':
				return $format('emote.info.type.hype_train');
			case 'SUBSCRIPTIONS':
				return $format('set.sub');
			case 'LIMITED_TIME':
				return $format('emote.info.type.limited_time');
			case 'HYPE_TRAIN':
				return $format('emote.info.type.hype_train');
			case 'TWO_FACTOR':
				return $format('emote.info.type.2fa');
			case 'FOLLOWER':
				return $format('set.follower');
			case 'ARCHIVE':
				return $format('emote.info.type.archive');
			case 'SMILIES':
				return $format('emote.info.type.smilies');
			case 'GLOBALS':
				return $format('set.global');
			case 'CHANNEL':
				return $format('channel.label');
			case 'PRIME':
				return $format('emote.info.type.prime');
			case 'TURBO':
				return $format('emote.info.type.turbo');
			default:
				return $format('common.unknown');
		}
	};
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
			{#if type === 'emote' && item && 'public' in item}
				<MenuContent
					icon={isDeleted || deletedAt ? Shredder : item?.public ? Eye : Lock}
					label="emote.info.status.label"
					content={isDeleted || deletedAt
						? $_('emote.info.status.deleted')
						: item?.public
							? $_('emote.info.status.public')
							: $_('emote.info.status.private')}
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

			{#if type === 'emote' && item && (item as Emote)?.artist && 'artist' in item}
				<MenuContent
					icon={Brush}
					label="emote.info.artist"
					href={`/channel/${item.artist?.platform}/${item.artist?.username}`}
					content={item.artist?.username}
				/>
			{/if}

			{#if type === 'emote' && item && (item as Emote)?.type && 'type' in item}
				<MenuContent
					icon={Tags}
					label="emote.info.type.label"
					content={getEmoteLabel(item.type)}
				/>
			{/if}

			{#if item && (item as Badge)?.cost && 'cost' in item}
				<MenuContent
					icon={Coins}
					label="badge.info.cost"
					content={$_('badge.bits', { values: { cost: item.cost } })}
				/>
			{/if}

			{#if type === 'emote' && item && (item as Emote)?.tier && 'tier' in item}
				<MenuContent icon={Coins} label="emote.info.tier" content={String(item.tier)} />
			{/if}

			{#if type === 'badge' && item && 'description' in item}
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

			{#if type === 'emote' && item && 'approved' in item && !isDeleted && !deletedAt && !['GLOBALS', 'SMILIES'].includes(item?.type ?? '')}
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
