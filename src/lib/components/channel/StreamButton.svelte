<script lang="ts">
	import type { StreamInfo } from '$lib/types/common';

	import { onDestroy, onMount, untrack } from 'svelte';
	import getFlag from '$lib/tools/langEmoji';
	import { getElapsed } from '$lib/utils';
	import { _ } from 'svelte-i18n';

	let { stream = $bindable() }: { stream: StreamInfo | null } = $props();

	let timer = $state<ReturnType<typeof setInterval> | null>(null);
	let showPreview = $state(false);
	let previewLoaded = $state(false);
	let categoryLoaded = $state(false);
	let elapsed = $state('');

	$effect(() => {
		if (stream) {
			untrack(() => {
				previewLoaded = false;
				categoryLoaded = false;
			});
		}
	});

	function updateTimer() {
		untrack(() => {
			const timeValue = stream?.createdAt ?? null;
			elapsed = getElapsed(timeValue);
		});
	}

	function startTimer() {
		updateTimer();
		timer = setInterval(updateTimer, 1000);
	}

	function stopTimer() {
		if (timer) {
			clearInterval(timer);
			timer = null;
		}
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
		startTimer();
	});

	onDestroy(() => {
		stopTimer();
	});
</script>

<button
	onclick={() => {
		if (stream) showPreview = true;
	}}
	class="btn rounded-full font-semibold transition-colors duration-200 {stream
		? 'btn-error text-white'
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
		onclick={closePreview}
		onkeydown={onOverlayKeydown}
	>
		<div
			class="bg-base-200 relative max-h-[90vh] w-full max-w-fit cursor-auto overflow-y-auto rounded-lg p-2 shadow-lg md:p-5"
			role="presentation"
			onclick={(e) => e.stopPropagation()}
		>
			<button
				onclick={closePreview}
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
						onload={() => (previewLoaded = true)}
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
								onload={() => (categoryLoaded = true)}
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
