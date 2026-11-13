<script lang="ts">
	import type { OfflineInfo, StreamInfo } from '#lib/types/common.ts';

	import { displayImage, getElapsed } from '#lib/utils/index.ts';
	import { getFlagEmoji } from '#lib/tools/language.ts';
	import { X } from '@lucide/svelte';
	import { onMount } from 'svelte';
	import { _ } from 'svelte-i18n';

	let {
		stream,
		offline = null
	}: {
		stream: StreamInfo | null;
		offline?: OfflineInfo | null;
	} = $props();

	const preview = $derived(stream ? stream.preview : (offline?.image ?? null));
	const title = $derived(stream ? stream.title : (offline?.title ?? null));
	const hasDetails = $derived(!!stream || !!preview || !!title);

	let modal = $state<HTMLDialogElement>();
	let previewImage = $state<HTMLImageElement>();
	let categoryImage = $state<HTMLImageElement>();
	let previewLoadedFor = $state<string | null>(null);
	let categoryLoadedFor = $state<string | null>(null);
	let elapsed = $state('');

	onMount(() => {
		const update = () => (elapsed = getElapsed(stream?.createdAt ?? null));

		update();
		if (previewImage?.complete && previewImage.naturalWidth > 0) {
			previewLoadedFor = preview;
		}
		if (categoryImage?.complete && categoryImage.naturalWidth > 0) {
			categoryLoadedFor = stream?.category?.boxArt ?? null;
		}
		const timer = setInterval(update, 1000);

		return () => clearInterval(timer);
	});
</script>

<button
	onclick={() => modal?.showModal()}
	disabled={!hasDetails}
	class="btn rounded-full font-semibold transition-colors duration-200 {stream
		? 'btn-error text-white'
		: hasDetails
			? 'btn-soft'
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

{#if hasDetails}
	<dialog
		bind:this={modal}
		class="modal modal-backdrop-blur inset-0 z-50 backdrop-brightness-50"
		onclick={(event) => {
			if (event.target === modal) modal?.close();
		}}
	>
		<div
			class="modal-box m-4 max-w-fit p-4 sm:p-6 md:p-8"
			style="max-width: min(700px, calc(100vw - 2rem));"
		>
			<form method="dialog">
				<button
					class="btn btn-sm btn-circle btn-ghost absolute top-3 right-3 z-10 text-white hover:text-gray-300"
				>
					<X class="h-5 w-5" />
				</button>
			</form>

			{#if preview}
				<figure class="mb-4">
					<div class="relative">
						{#if previewLoadedFor !== preview}
							<div class="skeleton absolute inset-0 z-0 h-90 w-160 rounded-sm"></div>
						{/if}
						<img
							bind:this={previewImage}
							class="relative z-10 block h-auto w-full max-w-full rounded-sm"
							title={$_('channel.preview')}
							alt={$_('channel.preview')}
							src={displayImage(preview)}
							draggable="false"
							loading="lazy"
							onload={() => (previewLoadedFor = preview)}
							onerror={() => (previewLoadedFor = preview)}
						/>
					</div>
				</figure>
			{/if}

			<div class="px-2">
				{#if title}
					<h2 class="card-title mt-2 truncate text-xl md:text-2xl">
						{title}
					</h2>
				{/if}
				{#if stream}
					<div class="mt-3 flex flex-wrap gap-3">
						{#if stream.category?.boxArt}
							<div class="relative shrink-0">
								{#if categoryLoadedFor !== stream.category.boxArt}
									<div
										class="skeleton absolute inset-0 z-0 h-20 w-15 rounded-sm"
									></div>
								{/if}
								<img
									bind:this={categoryImage}
									title={$_('channel.category')}
									src={displayImage(stream.category.boxArt)}
									alt={$_('channel.category')}
									class="relative z-10 h-20 w-15 rounded-sm"
									draggable="false"
									loading="lazy"
									onload={() =>
										(categoryLoadedFor = stream.category?.boxArt ?? null)}
									onerror={() =>
										(categoryLoadedFor = stream.category?.boxArt ?? null)}
								/>
							</div>
						{/if}
						<div class="flex min-w-0 flex-1 flex-col justify-center space-y-1">
							{#if stream.category}
								<a
									class="link text-md text-secondary hover:link-secondary w-fit truncate md:text-xl"
									aria-label={$_('channel.category')}
									href={stream.category.url}
									rel="external noopener noreferrer"
									target="_blank"
								>
									{stream.category.name}
								</a>
							{/if}
							<p class="md:text-md text-sm">
								{$_('channel.viewers', { values: { count: stream.viewers } })}
								{#if stream.language}
									· {stream.language}
									{getFlagEmoji(stream.language)}
								{/if}
								{stream.isMature ? ` · 🔞 ${$_('channel.mature')}` : ''}
							</p>
							{#if stream.createdAt}
								<p class="md:text-md text-sm text-gray-500">{elapsed}</p>
							{/if}
						</div>
					</div>
				{/if}
			</div>
		</div>
	</dialog>
{/if}
