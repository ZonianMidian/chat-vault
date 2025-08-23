<script lang="ts">
	import type { User } from '$lib/types/common';
	import { onDestroy, onMount } from 'svelte';
	import { _ } from 'svelte-i18n';

	export let isLoading = false;
	export let owner: User | null = null;
	export let source: string | null = null;
	export let provider: string | null = null;

	let imageLoading = true;

	function handleAvatarError(event: Event) {
		const img = event.target as HTMLImageElement;
		img.classList.add('bg-base-200');
		img.src = '/assets/avatar.svg';
		imageLoading = false;
	}

	onMount(() => {
		const img = document.querySelector<HTMLImageElement>(`#avatar`);
		if (img?.complete && img.naturalWidth !== 0) {
			imageLoading = false;
		}
	});
</script>

<div class="flex items-center gap-2">
	{#if isLoading}
		<div class="skeleton h-7 w-7 rounded-sm"></div>
		<div class="skeleton h-5 w-25"></div>
		<div class="ml-auto">
			<div class="skeleton h-12 w-12"></div>
		</div>
	{:else}
		{#if owner}
			<a
				href={`/channel/${owner.platform}/${owner.username}#${provider}`}
				class="flex items-center gap-2 transition-opacity hover:opacity-80"
				aria-label="{$_(`provider.owner.platform`)}: {owner.username}"
			>
				<div>
					<div class="flex items-center justify-center" class:hidden={!imageLoading}>
						<div class="skeleton h-7 w-7 rounded-sm"></div>
					</div>
					<img
						id="avatar"
						src={owner.avatar}
						alt={owner.username}
						class="h-7 w-7 rounded-sm"
						class:hidden={imageLoading}
						on:error={handleAvatarError}
						on:load={() => {
							imageLoading = false;
						}}
					/>
				</div>
				<h2 class="text-base-content text-xl font-medium">
					{owner.username}
				</h2>
			</a>
		{/if}

		<div class="ml-auto">
			<a
				class="flex items-center gap-3 hover:opacity-80"
				aria-label={$_(`provider.${provider}`)}
				rel="noopener noreferrer"
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
