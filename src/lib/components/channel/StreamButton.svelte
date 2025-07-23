<script lang="ts">
	import type { StreamInfo } from '$lib/types/common';

	import { onDestroy, onMount } from 'svelte';
	import getFlag from '$lib/tools/langEmoji';
	import { getElapsed } from '$lib/utils';
	import { _ } from 'svelte-i18n';

	export let stream: StreamInfo | null = null;

	let timer: ReturnType<typeof setInterval>;
	let showPreview = false;

	let previewLoaded = false;
	let categoryLoaded = false;

	$: if (stream) {
		previewLoaded = false;
		categoryLoaded = false;
	}

	$: elapsed = '';

	function updateTimer() {
		const timeValue = stream?.createdAt ?? null;
		elapsed = getElapsed(timeValue);
		timer = setInterval(updateTimer, 1000);
	}

	function closePreview() {
		showPreview = false;
	}

	function onOverlayKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
			e.preventDefault();
			closePreview();
		}
	}

	onMount(() => {
		updateTimer();
	});

	onDestroy(() => {
		clearInterval(timer);
	});
</script>

<button
	on:click={() => {
		if (stream) showPreview = true;
	}}
	class="btn rounded-full font-semibold text-white transition-colors duration-200 {stream
		? 'btn-error'
		: 'btn-soft btn-disabled'}"
>
	{#if stream}
		<span class="flex items-center space-x-2">
			<span class="relative flex h-3 w-3">
				<span
					class="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75"
				></span>
				<span class="relative inline-flex h-full w-full rounded-full bg-white"></span>
			</span>
			<span>LIVE</span>
		</span>
	{:else}
		OFFLINE
	{/if}
</button>

{#if showPreview && stream}
	<div
		class="fixed inset-0 z-50 flex cursor-pointer items-center justify-center bg-black/50 p-4 backdrop-blur"
		role="button"
		tabindex="0"
		on:click={closePreview}
		on:keydown={onOverlayKeydown}
	>
		<div
			class="bg-base-200 relative max-h-[90vh] w-full max-w-fit cursor-auto overflow-y-auto rounded-lg p-2 shadow-lg md:p-5"
			role="presentation"
			on:click|stopPropagation
		>
			<button
				on:click={closePreview}
				class="absolute top-0 right-1 cursor-pointer text-2xl leading-none text-white hover:text-gray-300"
				aria-label="Close preview"
			>
				×
			</button>
			<figure>
				<div class="relative">
					<div class="skeleton h-90 w-160 rounded-sm" class:hidden={previewLoaded}></div>
					<img
						class="block h-90 w-160 max-w-full rounded-sm"
						class:hidden={!previewLoaded}
						title={$_('channel.preview')}
						alt={$_('channel.preview')}
						src={stream.preview}
						draggable="false"
						on:load={() => (previewLoaded = true)}
					/>
				</div>
			</figure>

			<div>
				<h2 class="card-title mt-2 truncate text-2xl">{stream.title}</h2>
				<div class="flex flex-wrap gap-3">
					{#if stream.category}
						<div class="relative">
							<div
								class="skeleton h-20 w-15 rounded-sm"
								class:hidden={categoryLoaded}
							></div>
							<img
								title={$_('channel.category')}
								class:hidden={!categoryLoaded}
								src={stream.category.boxArt}
								alt={$_('channel.category')}
								class="h-20 w-15 rounded-sm"
								draggable="false"
								on:load={() => (categoryLoaded = true)}
							/>
						</div>
					{/if}
					<div class="flex flex-1 flex-col justify-center space-y-1">
						{#if stream.category}
							<a
								class="link text-md text-secondary hover:link-secondary"
								aria-label={$_('channel.category')}
								href={stream.category.url}
								rel="noopener noreferrer"
								target="_blank"
							>
								{stream.category.name}
							</a>
						{/if}
						<p class="text-md">
							{$_('channel.viewers', { values: { count: stream.viewers } })} ·
							{stream.language}
							{getFlag(stream.language)}
							{stream.isMature ? ` · 🔞 ${$_('channel.mature')}` : ''}
						</p>
						<p class="text-md text-gray-500">{elapsed}</p>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}
