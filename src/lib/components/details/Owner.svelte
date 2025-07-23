<script lang="ts">
	import type { User } from '$lib/types/common';
	import { _ } from 'svelte-i18n';

	export let provider: string | null = null;
	export let source: string | null = null;
	export let owner: User | null = null;
	export let isLoading = false;

	let imageLoading = true;

	function handleAvatarError(event: Event) {
		const img = event.target as HTMLImageElement;
		img.classList.add('bg-base-200');
		img.src = '/assets/avatar.svg';
		imageLoading = false;
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
				href={`/channel/${owner.platform}/${owner.username}`}
				class="flex items-center gap-2 transition-opacity hover:opacity-80"
				aria-label="{$_(`provider.owner.platform`)}: {owner.username}"
			>
				<div>
					<div class="flex items-center justify-center" class:hidden={!imageLoading}>
						<div class="skeleton h-12 w-12 rounded-sm"></div>
					</div>
					<img
						src={owner.avatar}
						alt={owner.username}
						class="h-12 w-12 rounded-sm"
						class:hidden={imageLoading}
						on:error={handleAvatarError}
						on:load={() => {
							imageLoading = false;
						}}
					/>
				</div>
				<h1 class="text-base-content text-2xl font-medium">
					{owner.username}
				</h1>
			</a>
		{/if}

		<div class="ml-auto">
			{#if source}
				<a
					class="drop-shadow-md/50 transition-opacity hover:opacity-80"
					aria-label={$_(`provider.${provider}`)}
					title={$_(`provider.${provider}`)}
					rel="noopener noreferrer"
					target="_blank"
					href={source}
				>
					<img
						src={`/logos/${provider}.svg`}
						alt={$_(`provider.${provider}`)}
						title={$_(`provider.${provider}`)}
						draggable="false"
						class="h-12 w-12"
					/>
				</a>
			{:else}
				<img
					src={`/logos/${provider}.svg`}
					alt={provider}
					class="h-12 w-12 drop-shadow-md/50"
					draggable="false"
				/>
			{/if}
		</div>
	{/if}
</div>
