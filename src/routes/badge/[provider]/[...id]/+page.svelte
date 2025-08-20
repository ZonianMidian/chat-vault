<script lang="ts">
	import type { BadgePage, Extras, Sizes, Badge } from '$lib/types/common';

	import { fetchExtras } from '$lib/badges/fetchExtras';
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import { getImageInfo } from '$lib/utils';
	import { page } from '$app/state';
	import { untrack } from 'svelte';
	import { _ } from 'svelte-i18n';

	import Details from '$lib/components/Details.svelte';

	const { data } = $props<{ data: BadgePage }>();

	let imageSizes = $state(new Map<string, Sizes>());
	let imageUrls = $state(new Map<string, string>());

	let darkBackground = $state(true);
	let activeTab = $state('info');

	let createdAt = $state<Date | null>(null);
	let deletedAt = $state<Date | null>(null);
	let itemsPerPage = $state(18);
	let variantCount = $state(0);

	type TabPageMap = {
		[key: string]: number;
	};
	let tabPages = $state<TabPageMap>({});

	let error = $state<string | null>(data.error || null);
	let badge = $state<Badge | null>(data.badge);
	let badgeProvider = $state(data.provider);
	let extras = $state<Extras | null>(null);

	let isLoading = $state({
		info: true,
		extras: true
	});

	let currentBadgeKey = $derived(`${data.provider}-${data.id}`);

	function getTabPage(tabId: string): number {
		return tabPages[tabId] || 1;
	}

	function initializeBadgeData() {
		if (!badge) return;

		createdAt = badge.createdAt ?? null;

		loadExtrasData();
		loadImageSizes();
	}

	async function loadExtrasData() {
		if (!badge) return;

		try {
			extras = await fetchExtras(
				badge.provider,
				`${badge.id}${badge.version ? `/${badge.version}` : ''}`
			);

			if (extras?.createdAt && !createdAt) {
				createdAt = extras.createdAt;
			}

			if (extras?.deletedAt) {
				deletedAt = extras.deletedAt;
			}

			extras.related = badge.related || [];

			isLoading.extras = false;
		} catch (err) {
			console.warn(`[${$_('badge.label')}] Extras:`, err);
			isLoading.extras = false;
		} finally {
			isLoading.info = false;
		}
	}

	async function loadImageSizes() {
		if (!badge?.images) return;

		await Promise.all(
			badge.images.map(async (image) => {
				try {
					const size = await getImageInfo(image, ['kick'].includes(data.provider));
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
		const maxPage = Math.ceil(totalItems / itemsPerPage);
		const currentTabPage = getTabPage(activeTab);

		if (currentTabPage >= maxPage) return;

		tabPages = {
			...tabPages,
			[activeTab]: currentTabPage + 1
		};
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

	function resetState() {
		activeTab = 'info';
		createdAt = null;
		variantCount = 0;
		extras = null;

		isLoading = {
			info: true,
			extras: true
		};

		for (const url of imageUrls.values()) {
			if (url.startsWith('blob:')) {
				URL.revokeObjectURL(url);
			}
		}

		imageSizes.clear();
		imageUrls.clear();
		tabPages = {};
	}

	let previousBadgeKey = $state('');

	$effect(() => {
		const newBadgeKey = currentBadgeKey;
		if (newBadgeKey !== previousBadgeKey) {
			previousBadgeKey = newBadgeKey;

			untrack(() => {
				resetState();

				badge = data.badge;
				error = data.error || null;
				badgeProvider = data.provider;

				if (badge && browser) {
					initializeBadgeData();
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
	<title>{data.pageTitle}</title>
	<meta property="og:title" content={data.pageTitle} />

	<meta
		property="og:url"
		content="{page.url.origin}/badge/{data.provider}/{badge?.id.toLowerCase()}{badge?.version
			? `/${badge?.version}`
			: ''}"
	/>
	<link
		rel="canonical"
		href="{page.url.origin}/badge/{data.provider}/{badge?.id.toLowerCase()}{badge?.version
			? `/${badge?.version}`
			: ''}"
	/>

	<meta property="og:image" content={data.pageImage} />
</svelte:head>

<Details
	provider={badgeProvider}
	data={badge}
	type="badge"
	bind:darkBackground
	bind:activeTab
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
