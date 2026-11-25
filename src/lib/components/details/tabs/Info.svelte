<script lang="ts">
	import { typeLabels, type Badge, type Emote } from '#lib/types/common.ts';

	import { resolve } from '$app/paths';
	import { _, date } from 'svelte-i18n';
	import {
		SquareMousePointer,
		CircleCheckBig,
		CalendarPlus,
		TextInitial,
		CalendarX2,
		Shredder,
		CircleX,
		Folder,
		Brush,
		Coins,
		Lock,
		Tags,
		Eye
	} from '@lucide/svelte';

	import MenuContent from '#lib/components/MenuContent.svelte';
	import TabContent from '#lib/components/TabContent.svelte';

	let {
		item,
		type,
		isActive,
		createdAt = null,
		deletedAt = null
	}: {
		item: Emote | Badge | null;
		type: 'emote' | 'badge';
		isActive: boolean;
		createdAt?: Date | string | null;
		deletedAt?: Date | string | null;
	} = $props();

	const placeholderCount = 5;

	const emote = $derived(type === 'emote' ? (item as Emote | null) : null);
	const badge = $derived(type === 'badge' ? (item as Badge | null) : null);

	const isDeleted = $derived(!!emote?.deleted || !!deletedAt);

	function artistHref(artist: NonNullable<Emote['artist']>): ReturnType<typeof resolve> {
		const login =
			artist.platform === 'youtube' && artist.id
				? artist.id
				: (artist.username?.toLocaleLowerCase() ?? '');

		return login
			? resolve('/channel/[provider]/[login]', { provider: artist.platform, login })
			: resolve('/channel/search');
	}
</script>

<TabContent {isActive}>
	<ul class="menu menu-horizontal bg-base-100 w-full">
		{#if !item}
			{#each { length: placeholderCount }}
				<li>
					<div class="flex items-center gap-2">
						<div class="skeleton h-4 w-4 rounded"></div>
						<div class="skeleton h-4 w-32"></div>
					</div>
				</li>
			{/each}
		{:else}
			{#if emote}
				<MenuContent
					icon={isDeleted ? Shredder : emote.public ? Eye : Lock}
					label="emote.info.status.label"
					content={isDeleted
						? $_('emote.info.status.deleted')
						: emote.public
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

			{#if emote?.artist}
				<MenuContent
					icon={Brush}
					label="emote.info.artist"
					internalHref={artistHref(emote.artist)}
					content={emote.artist.username}
				/>
			{/if}

			{#if item.type}
				<MenuContent
					icon={Tags}
					label="emote.info.type.label"
					content={$_(typeLabels[item.type] ?? 'common.unknown')}
				/>
			{/if}

			{#if item.cost}
				<MenuContent
					icon={Coins}
					label="badge.info.cost"
					content={$_('badge.bits', { values: { cost: item.cost } })}
				/>
			{/if}

			{#if item.tier}
				<MenuContent icon={Coins} label="emote.info.tier" content={String(item.tier)} />
			{/if}

			{#if badge?.description}
				<MenuContent
					icon={TextInitial}
					label="badge.info.description"
					content={badge.description}
				/>
			{/if}

			{#if badge?.clickAction}
				<MenuContent
					icon={SquareMousePointer}
					label="badge.info.action.label"
					content={$_(`badge.info.action.${badge.clickAction.toLowerCase()}`)}
					externalHref={badge.clickURL || null}
				/>
			{/if}

			{#if emote && !isDeleted && !['GLOBALS', 'SMILIES'].includes(emote.type ?? '')}
				<MenuContent
					icon={emote.approved ? CircleCheckBig : CircleX}
					label="emote.info.approved"
					content={emote.approved ? $_('common.yes') : $_('common.no')}
				/>
			{/if}

			{#if item.setId}
				<MenuContent
					icon={Folder}
					label="emote.info.set"
					internalHref={resolve('/set/[provider]/[id]', {
						provider: item.provider,
						id: item.setId
					})}
					content={item.setId}
				/>
			{/if}
		{/if}
	</ul>
</TabContent>
