<script lang="ts">
	import { typeLabels, type Emote, type Extras, type Variant } from '#lib/types/common.ts';

	import { pending } from '#lib/tools/pending.svelte.ts';
	import { emoteSchema } from '#lib/seo.ts';
	import { _, number } from 'svelte-i18n';
	import { page } from '$app/state';

	import Details from '#lib/components/Details.svelte';
	import Seo from '#lib/components/Seo.svelte';

	let {
		emote,
		extras: extrasSource,
		variants: variantsSource
	}: {
		emote: Emote;
		extras: Promise<Extras | null> | Extras | null;
		variants: Promise<Variant[]> | Variant[];
	} = $props();

	const extras = pending<Extras | null>(() => extrasSource, null);
	const variants = pending<Variant[]>(() => variantsSource, []);

	const item = $derived.by((): Emote => {
		const extra = extras.value;
		if (!extra) return emote;

		const type = emote.type ?? extra.type ?? null;

		return {
			...emote,
			type,
			artist: emote.artist ?? extra.artist ?? null,
			tier: emote.tier || (type === 'SUBSCRIPTIONS' ? extra.tier : emote.tier),
			cost: emote.cost || (type === 'BITS_BADGE_TIERS' ? extra.cost : emote.cost)
		};
	});

	const createdAt = $derived(emote.createdAt ?? extras.value?.createdAt ?? null);
	const deletedAt = $derived(extras.value?.deletedAt ?? null);

	const image = $derived(
		(emote.images[2] ?? emote.images[1] ?? emote.images[0])?.replace(/\.avif$/, '.webp')
	);

	const description = $derived(
		[
			`${emote.global ? '🌍 ' : ''}[${$_(`provider.${emote.provider}`)}]`,
			`👤 ${emote.owner?.username}`,
			`🏷️ ${emote.type == null ? $_('common.unknown') : $_(typeLabels[emote.type] ?? 'common.unknown')}`,
			emote.cost ? `💰 ${$_('badge.bits', { values: { cost: emote.cost } })}` : null,
			emote.tier ? `🧾 ${$_('set.tier', { values: { tier: emote.tier } })}` : null,
			emote.artist ? `🎨 ${emote.artist.username}` : null,
			emote.channels.total ? `👥 ${$number(emote.channels.total)}` : null
		]
			.filter(Boolean)
			.join(' · ')
	);

	const url = $derived(page.url.origin + page.url.pathname);
	const schema = $derived(
		emoteSchema(item, {
			origin: page.url.origin,
			credit: $_(`provider.${emote.provider}`),
			description,
			createdAt,
			url
		})
	);
</script>

<Seo
	title={`${$_('emote.label')}: ${emote.name}`}
	path={page.url.pathname}
	breadcrumbs={[{ name: $_('navbar.emotes'), path: '/emote' }, { name: emote.name }]}
	{description}
	{schema}
	{image}
/>

<Details
	type="emote"
	provider={emote.provider}
	{item}
	{createdAt}
	{deletedAt}
	related={extras.value?.related.list ?? []}
	origins={extras.value?.origin ?? []}
	variants={variants.value}
	relatedLoading={extras.loading}
	originLoading={extras.loading}
	variantsLoading={variants.loading}
/>
