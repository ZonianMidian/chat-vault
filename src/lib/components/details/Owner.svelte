<script lang="ts">
	import type { User } from '#lib/types/common.ts';

	import { resolve } from '$app/paths';
	import { _ } from 'svelte-i18n';

	import Avatar from '#lib/components/Avatar.svelte';

	let {
		provider,
		owner = null,
		source = null,
		isLoading = false
	}: {
		provider: string;
		owner?: User | null;
		source?: string | null;
		isLoading?: boolean;
	} = $props();

	function ownerHref(owner: User): ReturnType<typeof resolve> {
		const login =
			owner.platform === 'youtube' && owner.id
				? owner.id
				: (owner.username?.toLocaleLowerCase() ?? '');

		return owner.id
			? resolve('/channel/[provider]/[login]', { provider: owner.platform, login })
			: resolve('/channel/search');
	}
</script>

<div class="flex items-center gap-2">
	{#if isLoading}
		<div class="skeleton h-12 w-12 rounded-sm"></div>
		<div class="skeleton h-8 w-32"></div>
		<div class="ml-auto">
			<div class="skeleton h-12 w-12"></div>
		</div>
	{:else}
		{#if owner}
			<a
				href={ownerHref(owner)}
				class="flex items-center gap-2 transition-opacity hover:opacity-80"
				aria-label="{$_(`provider.${owner.platform}`)}: {owner.username}"
			>
				<Avatar src={owner.avatar} alt={owner.username ?? ''} class="h-12 w-12" />
				<h2 class="text-base-content text-2xl font-medium">
					{owner.username}
				</h2>
			</a>
		{/if}

		<div class="ml-auto">
			{#if source}
				<a
					class="drop-shadow-md/50 transition-opacity hover:opacity-80"
					aria-label={$_(`provider.${provider}`)}
					title={$_(`provider.${provider}`)}
					rel="external noopener noreferrer"
					target="_blank"
					href={source}
				>
					<img
						src={`/logos/${provider}.svg`}
						alt={$_(`provider.${provider}`)}
						draggable="false"
						class="h-12 w-12"
					/>
				</a>
			{:else}
				<img
					src={`/logos/${provider}.svg`}
					alt={$_(`provider.${provider}`)}
					class="h-12 w-12 drop-shadow-md/50"
					draggable="false"
				/>
			{/if}
		</div>
	{/if}
</div>
