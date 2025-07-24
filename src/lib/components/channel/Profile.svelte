<script lang="ts">
	import type { ChannelPage, UserData } from '$lib/types/common';

	import { onDestroy, onMount, untrack } from 'svelte';
	import { isDarkMode } from '$lib/tools/isDarkMode';
	import { getBadges } from '$lib/utils';
	import { Globe } from '@lucide/svelte';
	import { _, date } from 'svelte-i18n';

	import StreamButton from '$lib/components/channel/StreamButton.svelte';

	let { data = $bindable() }: { data: ChannelPage } = $props();

	let socialsIcon = $state<Record<number, boolean>>({});
	let imageLoading = $state(true);

	let user = $derived<UserData | null>(data?.channel?.user ?? null);
	let darkSchema = $derived(true);

	function handleSocialIconLoad(event: Event, idx: number) {
		const img = event.target as HTMLImageElement;
		if (img.naturalWidth === 1 && img.naturalHeight === 1) {
			socialsIcon[idx] = true;
		}
	}

	$effect(() => {
		if (!user) return;

		untrack(() => {
			const socialIcons = document.querySelectorAll<HTMLImageElement>(`[id^="social-icon-"]`);
			const newSocialsIcon: Record<number, boolean> = {};

			socialIcons.forEach((icon, idx) => {
				if (icon.complete && icon.naturalWidth !== 0) {
					newSocialsIcon[idx] = true;
				}
			});

			socialsIcon = newSocialsIcon;

			const img = document.querySelector<HTMLImageElement>(`#avatar`);
			if (img?.complete && img.naturalWidth !== 0) {
				imageLoading = false;
			}
		});
	});

	onMount(() => {
		const unsubscribe = isDarkMode.subscribe((value) => {
			untrack(() => {
				darkSchema = value;
			});
		});

		onDestroy(() => {
			unsubscribe();
		});
	});
</script>

{#if user}
	<div
		class="relative h-50 w-full rounded-sm bg-cover bg-center sm:h-70"
		style="background-image: url('{user.images
			.banner}'); background-color: {user.backgroundColor}"
	>
		<div class="absolute right-4 bottom-2 flex space-x-3">
			{#each user.socials as soc, idx}
				<a
					class="flex h-8 w-8 items-center justify-center rounded-full bg-white/30 shadow hover:bg-white"
					rel="noopener noreferrer"
					aria-label={soc.title}
					title={soc.title}
					target="_blank"
					href={soc.url}
				>
					{#if socialsIcon[idx]}
						<Globe class="h-5 w-5 text-gray-300" />
					{:else}
						<img
							id={`social-icon-${idx}`}
							draggable="false"
							src={soc.icon}
							title={soc.name}
							alt={soc.name}
							class="h-5 w-5 rounded-xs"
							onload={(e) => handleSocialIconLoad(e, idx)}
						/>
					{/if}
				</a>
			{/each}
		</div>
	</div>

	<div class="container mx-auto mt-[-3.5rem] px-4 md:px-8 lg:px-16">
		<div class="flex flex-col items-center md:flex-row">
			<div class="avatar border-base-content h-38 w-38 rounded-sm border-3 backdrop-blur-md">
				<div class="skeleton" class:hidden={!imageLoading}></div>
				<img
					class:hidden={imageLoading}
					src={user.images.avatar}
					draggable="false"
					title="Avatar"
					alt="Avatar"
					id="avatar"
					onload={() => {
						imageLoading = false;
					}}
				/>
			</div>

			<div class="mt-0 ml-0 text-center md:ml-6 md:text-left">
				<h1
					class="truncate text-2xl font-bold md:text-3xl"
					style="color: {darkSchema
						? `color-mix(in srgb, white 25%, ${user.color})`
						: `color-mix(in srgb, black 25%, ${user.color})`};"
				>
					{#if user.badge}
						<a
							href={`/badge/${data.provider}/${user.badge.id}/${user.badge.version}`}
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
					{#each getBadges(user.roles) as badge}
						<img
							class="inline-block h-9 w-9 align-text-bottom"
							title={badge.title}
							draggable="false"
							src={badge.src}
							alt={badge.alt}
						/>
					{/each}
				</h1>
				<p class="text-sm">
					{$date(new Date(user.createdAt), { dateStyle: 'long' })}
				</p>
				<p class="text-sm text-gray-500">
					{$_('channel.followers', { values: { count: user.followers } })}
				</p>
			</div>

			<div
				class="mt-2 ml-auto flex w-full items-center justify-between md:mt-[2rem] md:w-auto md:flex-col md:space-y-5"
			>
				<div>
					<a
						class="drop-shadow-md/50 transition-opacity hover:opacity-80"
						aria-label={$_(`provider.${data.provider}`)}
						title={$_(`provider.${data.provider}`)}
						href={data.channel?.source}
						rel="noopener noreferrer"
						target="_blank"
					>
						<img
							src={`/logos/${data.provider}.svg`}
							alt={$_(`provider.${data.provider}`)}
							title={$_(`provider.${data.provider}`)}
							draggable="false"
							class="h-12 w-12"
						/>
					</a>
				</div>
				<div>
					<StreamButton stream={user.stream} />
				</div>
			</div>
		</div>
		{#if user.bio}
			<p class="prose dark:prose-invert my-2 max-w-none text-center md:text-left">
				{@html user.bio}
			</p>
		{/if}
	</div>
{/if}
