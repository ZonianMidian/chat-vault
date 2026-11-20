<script lang="ts">
	import { typeLabels, type Badge, type Extras } from '#lib/types/common.ts';

	import { badgeSchema, largestImage } from '#lib/seo.ts';
	import { pending } from '#lib/tools/pending.svelte.ts';
	import { resizeImageUrl } from '#lib/utils/index.ts';
	import { getChannelPath } from '#lib/utils/text.ts';
	import { page } from '$app/state';
	import { _ } from 'svelte-i18n';

	import Details from '#lib/components/Details.svelte';
	import Seo from '#lib/components/Seo.svelte';

	let {
		badge,
		extras: extrasSource
	}: {
		badge: Badge;
		extras: Promise<Extras | null> | Extras | null;
	} = $props();

	const extras = pending<Extras | null>(() => extrasSource, null);

	const createdAt = $derived(badge.createdAt ?? extras.value?.createdAt ?? null);
	const deletedAt = $derived(extras.value?.deletedAt ?? null);

	const image = $derived.by(() => {
		const source = badge.images[2] ?? badge.images[1] ?? badge.images[0];
		if (!source) return null;

		return resizeImageUrl(source.startsWith('/') ? `${page.url.origin}${source}` : source, 72);
	});

	const description = $derived(
		badge.global
			? `🌍 [${$_(`provider.${badge.provider}`)}] · ${badge.description}`
			: [
					`[${$_(`provider.${badge.provider}`)}]`,
					`👤 ${badge.owner?.username}`,
					`🏷️ ${badge.type == null ? $_('common.unknown') : $_(typeLabels[badge.type] ?? 'common.unknown')}`,
					badge.cost ? `💰 ${$_('badge.bits', { values: { cost: badge.cost } })}` : null,
					badge.tier ? `🧾 ${$_('set.tier', { values: { tier: badge.tier } })}` : null
				]
					.filter(Boolean)
					.join(' · ')
	);

	const url = $derived(page.url.origin + page.url.pathname);
	const schema = $derived(
		badgeSchema(badge, {
			origin: page.url.origin,
			credit: $_(`provider.${badge.provider}`),
			description,
			createdAt,
			url
		})
	);
</script>

<Seo
	title={`${$_('badge.label')}: ${badge.name}`}
	path={page.url.pathname}
	pageType="ItemPage"
	breadcrumbs={[
		{ name: $_('navbar.badges'), path: '/badge/global' },
		!badge.global && badge.owner?.username
			? { name: badge.owner.username, path: getChannelPath(badge.owner) }
			: null,
		{ name: badge.name }
	].filter((crumb) => crumb !== null)}
	datePublished={createdAt}
	source={badge.source}
	primaryImage={largestImage(page.url.origin, 'badge', badge)}
	{description}
	{schema}
	{image}
/>

<Details
	type="badge"
	provider={badge.provider}
	item={badge}
	{createdAt}
	{deletedAt}
	related={badge.related.list}
	origins={extras.value?.origin ?? []}
	originLoading={extras.loading}
/>
