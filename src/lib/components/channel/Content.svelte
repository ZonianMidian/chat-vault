<script lang="ts">
	import type { ChannelContent, EmoteBadge, SubTier, UserData } from '#lib/types/common.ts';

	import { UUID } from '#lib/utils/index.ts';
	import { _ } from 'svelte-i18n';

	import ImageGrid from '#lib/components/ImageGrid.svelte';

	let { content, userData }: { content: ChannelContent; userData: UserData } = $props();

	interface Section {
		key: string;
		value: EmoteBadge | SubTier | null;
		tier?: number;
	}

	const sections = $derived<Section[]>(
		[
			{ key: 'follower', value: content.follower },
			{ key: 'sub', value: content.sub, tier: 1 },
			{ key: 'subT2', value: content.subT2, tier: 2 },
			{ key: 'subT3', value: content.subT3, tier: 3 },
			{ key: 'bits', value: content.bits },
			{ key: 'special_events', value: content.special },
			{ key: 'campaign', value: content.campaign }
		].filter(({ value }) => value && (value.emotes.length > 0 || value.badges.length > 0))
	);

	const showPoints = $derived(
		!!content.points && (userData.roles.isAffiliate || userData.roles.isPartner)
	);

	function getTitle({ key, value, tier }: Section): string {
		if (value && 'title' in value && value.title !== null) {
			return `${$_('set.tier', { values: { tier: tier || 1 } })}: ${value.title}`;
		}
		return $_(`set.${key}`);
	}
</script>

<div class="channel-content">
	{#each sections as section (section.key)}
		{@const { value, tier } = section}

		{#if value}
			<div class="content-section mb-4">
				<h2 class="text-xl font-semibold">{getTitle(section)}</h2>

				<div class="space-y-2">
					{#if value.emotes.length > 0}
						<div>
							<h3 class="text-md mb-2 font-medium text-gray-500">
								{$_('navbar.emotes')}
							</h3>
							<ImageGrid items={value.emotes} linkPrefix="emote" />
						</div>
					{/if}

					{#if value.badges.length > 0}
						<div class="space-y-4">
							<h3 class="text-md mb-2 font-medium text-gray-500">
								{$_('navbar.badges')}
							</h3>
							{#if 'flair' in value && value.flair}
								<ImageGrid
									items={[
										{
											id: 'flair',
											image: value.flair,
											name: $_('common.flair'),
											owner: null,
											version: `${Number(tier) * 1000}/${userData.id}`,
											provider: 'twitch'
										}
									]}
									versionKey="version"
									linkPrefix="badge"
									nameKey="name"
								/>
							{/if}

							<ImageGrid
								items={value.badges}
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

	{#if showPoints && content.points}
		<div class="content-section mb-4">
			<h2 class="mb-2 text-xl font-semibold">{$_('channel.points')}</h2>

			<div class="space-y-2">
				<ImageGrid
					items={[
						{
							id: 'points',
							image: content.points.image,
							name: content.points.name,
							owner: null,
							version: `${content.points.image.match(UUID)}/${userData.id}`,
							provider: 'twitch'
						}
					]}
				/>
			</div>
		</div>
	{/if}
</div>
