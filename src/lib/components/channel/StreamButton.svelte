<script lang="ts">
	import type { StreamInfo } from '$lib/types/common';

	import { onDestroy, onMount, untrack } from 'svelte';
	import getFlag from '$lib/tools/langEmoji';
	import { getElapsed } from '$lib/utils';
	import { X } from '@lucide/svelte';
	import { _ } from 'svelte-i18n';

	let { stream = $bindable() }: { stream: StreamInfo | null } = $props();

	let timer = $state<ReturnType<typeof setInterval> | null>(null);
	let categoryLoaded = $state(false);
	let previewLoaded = $state(false);
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

	function openModal() {
		const modal = document.getElementById('streamModal') as HTMLDialogElement;
		modal?.showModal();
	}

	function closeModal() {
		const modal = document.getElementById('streamModal') as HTMLDialogElement;
		modal?.close();
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
		if (stream) {
			openModal();
		}
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

{#if stream}
	<dialog
		id="streamModal"
		class="modal modal-backdrop-blur inset-0 z-50 backdrop-brightness-50"
		onclick={closeModal}
	>
		<div
			class="modal-box m-4 max-w-fit p-4 sm:p-6 md:p-8"
			style="max-width: min(700px, calc(100vw - 2rem));"
			role="dialog"
			tabindex="0"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => {
				e.stopPropagation();
			}}
		>
			<form method="dialog">
				<button
					class="btn btn-sm btn-circle btn-ghost absolute top-3 right-3 z-10 text-white hover:text-gray-300"
				>
					<X class="h-5 w-5" />
				</button>
			</form>

			<figure class="mb-4">
				<div class="relative">
					<div class="skeleton h-90 w-160 rounded-sm" class:hidden={previewLoaded}></div>
					<img
						class="block h-auto w-full max-w-full rounded-sm"
						class:hidden={!previewLoaded}
						title={$_('channel.preview')}
						alt={$_('channel.preview')}
						src={stream.preview}
						draggable="false"
						onload={() => (previewLoaded = true)}
					/>
				</div>
			</figure>

			<div class="px-2">
				<h2 class="card-title mt-2 truncate text-xl md:text-2xl">{stream.title}</h2>
				<div class="mt-3 flex flex-wrap gap-3">
					{#if stream.category}
						<div class="relative flex-shrink-0">
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
					<div class="flex min-w-0 flex-1 flex-col justify-center space-y-1">
						{#if stream.category}
							<a
								class="link text-md text-secondary hover:link-secondary w-fit truncate md:text-xl"
								aria-label={$_('channel.category')}
								href={stream.category.url}
								rel="noopener noreferrer"
								target="_blank"
							>
								{stream.category.name}
							</a>
						{/if}
						<p class="md:text-md text-sm">
							{$_('channel.viewers', { values: { count: stream.viewers } })} ·
							{stream.language}
							{getFlag(stream.language)}
							{stream.isMature ? ` · 🔞 ${$_('channel.mature')}` : ''}
						</p>
						<p class="md:text-md text-sm text-gray-500">{elapsed}</p>
					</div>
				</div>
			</div>
		</div>
	</dialog>
{/if}
