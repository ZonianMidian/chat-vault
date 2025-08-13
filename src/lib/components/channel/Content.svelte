<script lang="ts">
	import type { ChannelContent, EmoteBadge, SubTier, UserData } from '$lib/types/common';

	import { UUID } from '$lib/utils';
	import { _ } from 'svelte-i18n';

	import ImageGrid from '$lib/components/ImageGrid.svelte';

	export let userData: UserData | null;
	export let content: ChannelContent;

	function getTitle(item: EmoteBadge | SubTier | null, key: string, tier?: number): string {
		if (item && 'title' in item && item.title !== null) {
			return `${$_('set.tier', { values: { tier: tier || 1 } })}: ${item.title}`;
		}
		return $_(`set.${key}`);
	}

	function tabExists(item: EmoteBadge | SubTier | null): boolean {
		if (!item) return false;
		return item.emotes.length > 0 || item.badges.length > 0;
	}

	const entries: Array<{
		key: string;
		tier?: number;
		value: EmoteBadge | SubTier | null;
	}> = [
		{ key: 'follower', value: content.follower },
		{ key: 'sub', value: content.sub, tier: 1 },
		{ key: 'subT2', value: content.subT2, tier: 2 },
		{ key: 'subT3', value: content.subT3, tier: 3 },
		{ key: 'bits', value: content.bits }
	];
</script>

<div class="channel-content">
	{#each entries as { key, value, tier }}
		{#if value && tabExists(value)}
			<div class="content-section mb-4">
				<h2 class="text-xl font-semibold">
					{getTitle(value, key, tier)}
				</h2>

				<div class="space-y-2">
					{#if value.emotes.length > 0}
						<div id="emotes">
							<h2 class="text-md mb-2 font-medium text-gray-500">
								{$_('navbar.emotes')}
							</h2>
							<ImageGrid
								items={value.emotes}
								placeholderCount={18}
								linkPrefix="emote"
							/>
						</div>
					{/if}

					{#if value.badges.length > 0}
						<div id="badges" class="space-y-4">
							<h2 class="text-md mb-2 font-medium text-gray-500">
								{$_('navbar.badges')}
							</h2>
							{#if 'flair' in value && value.flair}
								{@const flairItem = [
									{
										id: 'flair',
										image: value.flair,
										name: $_('common.flair'),
										owner: null,
										version: `${Number(tier) * 1000}/${userData?.id ?? ''}`,
										provider: 'twitch'
									}
								]}

								<ImageGrid
									items={flairItem}
									placeholderCount={1}
									versionKey="version"
									linkPrefix="badge"
									nameKey="name"
								/>
							{/if}

							<ImageGrid
								items={value.badges}
								placeholderCount={18}
								versionKey="version"
								linkPrefix="badge"
								nameKey="title"
							/>
						</div>
					{/if}
				</div>
			</div>
		{/if}
	{/each}

	{#if content.points && (userData?.roles.isAffiliate || userData?.roles.isPartner)}
		{@const pointsItem = [
			{
				id: 'points',
				image: content.points.image,
				name: content.points.name,
				owner: null,
				version: `${content.points.image.match(UUID)}/${userData?.id ?? ''}`,
				provider: 'twitch'
			}
		]}

		<div class="content-section mb-4">
			<h2 class="mb-2 text-xl font-semibold">
				{$_('channel.points')}
			</h2>

			<div class="space-y-2">
				<ImageGrid items={pointsItem} placeholderCount={1} />
			</div>
		</div>
	{/if}
</div>
