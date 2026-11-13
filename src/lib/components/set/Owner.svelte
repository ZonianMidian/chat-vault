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

	function ownerHref(owner: User, provider: string): ReturnType<typeof resolve> {
		const login = owner.platform === 'youtube' && owner.id ? owner.id : (owner.username ?? '');

		return login
			? resolve(`/channel/[provider]/[login]#${provider}`, {
					provider: owner.platform,
					login
				})
			: resolve('/channel/search');
	}
</script>

<div class="flex items-center gap-2">
	{#if isLoading}
		<div class="skeleton h-7 w-7 rounded-sm"></div>
		<div class="skeleton h-5 w-25"></div>
		<div class="ml-auto">
			<div class="skeleton h-7 w-25"></div>
		</div>
	{:else}
		{#if owner}
			<a
				href={ownerHref(owner, provider)}
				class="flex items-center gap-2 transition-opacity hover:opacity-80"
				aria-label="{$_(`provider.${owner.platform}`)}: {owner.username}"
			>
				<Avatar src={owner.avatar} alt={owner.username ?? ''} class="h-7 w-7" />
				<h2 class="text-base-content text-xl font-medium">
					{owner.username}
				</h2>
			</a>
		{/if}

		<div class="ml-auto">
			<a
				class="flex items-center gap-3 hover:opacity-80"
				aria-label={$_(`provider.${provider}`)}
				rel="external noopener noreferrer"
				draggable="false"
				target="_blank"
				href={source}
			>
				<h2 class="flex-1 text-xl font-bold">{$_(`provider.${provider}`)}</h2>
				<img
					src={`/logos/${provider}.svg`}
					alt={$_(`provider.${provider}`)}
					title={$_(`provider.${provider}`)}
					class="h-7 w-7"
					draggable="false"
				/>
			</a>
		</div>
	{/if}
</div>
