<script lang="ts">
	import type { ChannelData, Roles } from '#lib/types/common.ts';

	import { displayImage } from '#lib/utils/index.ts';
	import { Globe } from '@lucide/svelte';
	import { _, date } from 'svelte-i18n';
	import { resolve } from '$app/paths';

	import StreamButton from '#lib/components/channel/StreamButton.svelte';
	import Avatar from '#lib/components/Avatar.svelte';

	let { channel }: { channel: ChannelData } = $props();

	const user = $derived(channel.user);
	const providerName = $derived($_(`provider.${channel.provider}`));

	const roleLabels: [keyof Roles, string][] = [
		['isStaff', 'channel.staff'],
		['isPartner', 'channel.partner'],
		['isAffiliate', 'channel.affiliate']
	];

	const roles = $derived(roleLabels.filter(([role]) => user.roles[role]));

	let brokenIcons = $state<Record<string, boolean>>({});

	function checkIcon(event: Event, url: string) {
		const img = event.currentTarget as HTMLImageElement;
		if (img.naturalWidth <= 1 || img.naturalHeight <= 1) brokenIcons[url] = true;
	}
</script>

<div
	class="relative h-50 w-full rounded-sm bg-cover bg-center sm:h-70"
	style="{user.images.banner
		? `background-image: url('${displayImage(user.images.banner)}');`
		: ''} background-color: {user.backgroundColor}"
>
	<div
		class="absolute top-2 left-4 flex space-x-3 md:top-auto md:right-4 md:bottom-2 md:left-auto"
	>
		{#each user.socials as social (social.url)}
			<a
				class="flex h-8 w-8 items-center justify-center rounded-full bg-white/30 shadow hover:bg-white"
				rel="external noopener noreferrer"
				aria-label={social.title}
				title={social.title}
				target="_blank"
				href={social.url}
			>
				{#if brokenIcons[social.url]}
					<Globe class="h-5 w-5 text-gray-300" />
				{:else}
					<img
						draggable="false"
						src={social.icon}
						title={social.name}
						alt={social.name}
						class="h-5 w-5 rounded-xs"
						onload={(event) => checkIcon(event, social.url)}
						onerror={() => (brokenIcons[social.url] = true)}
					/>
				{/if}
			</a>
		{/each}
	</div>
</div>

<div class="container mx-auto -mt-14 px-4 md:px-8 lg:px-16">
	<div class="flex flex-col items-center md:flex-row">
		<div class="border-base-content relative rounded-sm border-3 backdrop-blur-md">
			<Avatar src={user.images.avatar} alt="Avatar" class="h-38 w-38" />
		</div>

		<div class="mt-0 ml-0 text-center md:ml-6 md:text-left">
			<h1
				class="truncate text-2xl font-bold md:text-3xl"
				style="color: color-mix(in srgb, var(--color-contrast) 25%, {user.color});"
			>
				{#if user.badge}
					<a
						href={resolve(
							`badge/${channel.provider}/${user.badge.id}/${user.badge.version}`
						)}
						class="inline-flex items-center gap-2"
						aria-label={user.badge.title}
					>
						<img
							class="inline-block h-5 w-5 align-text-bottom"
							draggable="false"
							title={user.badge.title}
							src={user.badge.image}
							alt={user.badge.title}
						/>
					</a>
				{/if}
				{user.username}
				{#each roles as [role, label] (role)}
					<img
						class="inline-block h-9 w-9 align-text-bottom"
						src={`/icons/${role}.svg`}
						title={$_(label)}
						alt={$_(label)}
						draggable="false"
					/>
				{/each}
			</h1>
			{#if user.createdAt}
				<p class="text-sm">
					{$date(new Date(user.createdAt), { dateStyle: 'long' })}
				</p>
			{/if}
			<p class="text-sm text-gray-500">
				{$_('channel.followers', { values: { count: user.followers } })}
			</p>
		</div>

		<div
			class="mt-2 ml-auto flex w-full items-center justify-between md:mt-8 md:w-auto md:flex-col md:space-y-5"
		>
			<div>
				<a
					class="drop-shadow-md/50 transition-opacity hover:opacity-80"
					aria-label={providerName}
					title={providerName}
					href={channel.source}
					rel="external noopener noreferrer"
					target="_blank"
				>
					<img
						src={`/logos/${channel.provider}.svg`}
						alt={providerName}
						draggable="false"
						class="h-12 w-12"
					/>
				</a>
			</div>
			<div>
				<StreamButton stream={user.stream} offline={user.offline} />
			</div>
		</div>
	</div>
	{#if user.bio}
		<p class="my-2 max-w-none text-center whitespace-pre-line md:text-left">{user.bio}</p>
	{/if}
</div>
