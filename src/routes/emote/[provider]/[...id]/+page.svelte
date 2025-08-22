<script lang="ts">
	import type { Emote, EmotePage, Extras, Channel, Sizes } from '$lib/types/common';

	import { emoteVariants, checkVariantExists, getImageInfo } from '$lib/utils';
	import { fetchChannels } from '$lib/emotes/fetchChannels';
	import { fetchExtras } from '$lib/emotes/fetchExtras';
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import { untrack } from 'svelte';
	import { _ } from 'svelte-i18n';

	import Details from '$lib/components/Details.svelte';

	const { data } = $props<{ data: EmotePage }>();

	let variantImages = $state(new Map<string, string>());
	let imageSizes = $state(new Map<string, Sizes>());
	let imageUrls = $state(new Map<string, string>());
	let visitedPages = $state(new Set<number>());

	let darkBackground = $state(true);
	let activeTab = $state('info');
	let isVariant = $state(false);

	let createdAt = $state<Date | null>(null);
	let deletedAt = $state<Date | null>(null);
	let channels = $state<Channel[]>([]);
	let itemsPerPage = $state(18);
	let variantCount = $state(0);

	type TabPageMap = {
		[key: string]: number;
	};
	let tabPages = $state<TabPageMap>({});

	let error = $state<string | null>(data.error || null);
	let emote = $state<Emote | null>(data.emote);
	let emoteProvider = $state(data.provider);
	let extras = $state<Extras | null>(null);

	let isLoading = $state({
		info: true,
		extras: true,
		variants: true,
		channels: false
	});

	const pageTitle = $derived(`${$_('emote.label')}: ${emote?.name ?? ''}`);
	let currentEmoteKey = $derived(`${data.provider}-${data.id}`);

	function getTabPage(tabId: string): number {
		return tabPages[tabId] || 1;
	}

	function initializeEmoteData() {
		if (!emote) return;

		channels = emote.channels.list;
		if (emote.channels.total > 0 && !channels.length) {
			loadMoreChannels();
		}
		createdAt = emote.createdAt ?? null;

		let emoteVariant = null;
		const emoteMatch = data.id.match(/_([A-Z]{2})$/);
		if (emoteMatch) {
			emoteVariant = emoteMatch?.[1] ?? '';
			emote.id = data.id.slice(0, -3);
			isVariant = true;
		}

		loadExtrasData();

		if (emote.provider === 'twitch') {
			loadTwitchVariants(emoteVariant);
		} else {
			isLoading.variants = false;
		}

		loadImageSizes();
	}

	async function loadExtrasData() {
		if (!emote) return;

		try {
			extras = await fetchExtras(
				emote.owner?.id ?? null,
				emote.provider,
				emote.id,
				emote.name
			);

			if (!createdAt && extras?.createdAt) {
				createdAt = extras.createdAt;
			}

			if (extras?.deletedAt) {
				deletedAt = extras.deletedAt;
			}

			if (!emote.artist && extras?.artist) {
				emote.artist = extras.artist;
			}

			if (extras?.type && !emote.type) {
				emote.type = extras.type;
			}

			if (extras?.tier && !emote.tier && emote.type === 'SUBSCRIPTIONS') {
				emote.tier = extras.tier;
			}

			if (extras?.cost && !emote.cost && emote.type === 'BITS_BADGE_TIERS') {
				emote.cost = extras.cost;
			}

			isLoading.extras = false;
		} catch (err) {
			console.warn(`[${$_('emote.label')}] Extras:`, err);
			isLoading.extras = false;
		} finally {
			isLoading.info = false;
		}
	}

	async function loadTwitchVariants(emoteVariant: string | null) {
		try {
			let variants = emoteVariants;
			let baseUrl = `https://static-cdn.jtvnw.net/emoticons/v2/${emote?.id}/default/dark/2.0`;

			if (isVariant) {
				const variantUrl = emote?.images[1].replace(/_[A-Z]{2}?\/default/, `/default`);

				variantImages.set('', emote?.altImage || variantUrl || '');
				variantCount++;

				variants = emoteVariants.filter((variant) => variant !== emoteVariant);
			}

			const checks = variants.map(async (variant) => {
				const variantUrl = baseUrl.replace(/(_[A-Z]{2})?\/default/, `_${variant}/default`);
				try {
					const exists = await checkVariantExists(variantUrl);
					if (!exists) return null;

					variantImages.set(variant, variantUrl);
					variantCount++;

					return { variant, variantUrl };
				} catch (err) {
					console.warn(`[Emote Variant] ${variant}:`, err);
					return null;
				}
			});

			await Promise.all(checks);
			variantImages = new Map(variantImages);
		} catch (err) {
			console.warn('[Emote Variants]:', err);
		} finally {
			isLoading.variants = false;
		}
	}

	async function loadImageSizes() {
		if (!emote?.images) return;

		await Promise.all(
			emote.images.map(async (image) => {
				try {
					const size = await getImageInfo(
						image,
						['kick', 'youtube', 'bttv'].includes(data.provider)
					);
					imageSizes.set(image, size);
					imageUrls.set(image, size.objectUrl);

					imageSizes = new Map(imageSizes);
					imageUrls = new Map(imageUrls);
				} catch (err) {
					console.warn(`[Image] ${image}:`, err);
				}
			})
		);
	}

	const nextPage = async (totalItems: number) => {
		const maxPage = emoteProvider === '7tv' ? 10 : Math.ceil(totalItems / itemsPerPage);
		const currentTabPage = getTabPage(activeTab);

		if (currentTabPage >= maxPage) return;

		tabPages = {
			...tabPages,
			[activeTab]: currentTabPage + 1
		};

		if (
			activeTab === 'channels' &&
			!visitedPages.has(getTabPage('channels')) &&
			channels.length < totalItems
		) {
			await loadMoreChannels();
		}
	};

	const prevPage = () => {
		const currentTabPage = getTabPage(activeTab);
		if (currentTabPage > 1) {
			tabPages = {
				...tabPages,
				[activeTab]: currentTabPage - 1
			};
		}
	};

	async function loadMoreChannels() {
		isLoading.channels = true;

		try {
			const lastChannel = channels[channels.length - 1];
			const before = lastChannel?.posId || null;

			const newChannels = await fetchChannels(
				data?.provider || '',
				data?.id || '',
				getTabPage('channels'),
				before
			);

			const existingIds = new Set(channels.map((c) => c.id));
			const uniqueNewChannels = newChannels.list.filter(
				(channel: { id: string }) => !existingIds.has(channel.id)
			);

			channels = [...channels, ...uniqueNewChannels];
			visitedPages.add(getTabPage('channels'));
		} catch (err) {
			console.error(`[${$_('emote.label')}]: ${$_('navbar.channels')}`, err);
		} finally {
			isLoading.channels = false;
		}
	}

	function resetState() {
		activeTab = 'info';
		isVariant = false;
		createdAt = null;
		deletedAt = null;
		variantCount = 0;
		extras = null;

		isLoading = {
			info: true,
			extras: true,
			variants: true,
			channels: false
		};

		for (const url of imageUrls.values()) {
			if (url.startsWith('blob:')) {
				URL.revokeObjectURL(url);
			}
		}

		variantImages.clear();
		imageSizes.clear();
		imageUrls.clear();
		channels = [];
		tabPages = {};
		visitedPages.clear();
	}

	let previousEmoteKey = $state('');

	$effect(() => {
		const newEmoteKey = currentEmoteKey;
		if (newEmoteKey !== previousEmoteKey) {
			previousEmoteKey = newEmoteKey;

			untrack(() => {
				resetState();

				emote = data.emote;
				error = data.error || null;
				emoteProvider = data.provider;

				if (emote && browser) {
					initializeEmoteData();
				}
			});
		}
	});

	onMount(() => {
		onDestroy(() => {
			for (const url of imageUrls.values()) {
				if (url.startsWith('blob:')) {
					URL.revokeObjectURL(url);
				}
			}
		});
	});
</script>

<svelte:head>
	<title>{`${error ? $_('common.error') : pageTitle} | Chat Vault`}</title>
	<meta property="og:title" content={error ? $_('common.error') : pageTitle} />

	<meta property="og:url" content="{page.url.origin}/{data.provider}/{data.emote.id}" />
	<link rel="canonical" href="{page.url.origin}/{data.provider}/{data.emote.id}" />

	<meta property="og:image" content={data.pageImage} />
</svelte:head>

<Details
	provider={emoteProvider}
	{channels}
	data={emote}
	type="emote"
	bind:darkBackground
	bind:activeTab
	{variantImages}
	{itemsPerPage}
	{variantCount}
	{imageSizes}
	{isLoading}
	{createdAt}
	{deletedAt}
	{imageUrls}
	{tabPages}
	{prevPage}
	{nextPage}
	{extras}
	{error}
/>
