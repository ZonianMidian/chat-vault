<script lang="ts">
	import type { Origin } from '#lib/types/common.ts';

	import { ExternalLink, Languages, Undo2 } from '@lucide/svelte';
	import { renderMarkdown } from '#lib/tools/marked.ts';
	import { _, locale } from 'svelte-i18n';

	import TabContent from '#lib/components/TabContent.svelte';

	let { origins, isActive }: { origins: Origin[]; isActive: boolean } = $props();

	interface Translation {
		text: string;
		notes: string | null;
	}

	let translations = $state<Record<string, Translation>>({});
	let translated = $state<Record<string, boolean>>({});

	const language = $derived(($locale ?? 'en').split('-')[0]);

	function extractPlaceholders(text: string | null | undefined) {
		const placeholders: string[] = [];
		const replaced = (text ?? '').replace(
			/\*\*\S+\s\[\[!\[Emote\]\S+\]\*\*|!?\[([^\]]+)\]\(([^)]+)\)/g,
			(match) => `[[#${placeholders.push(match) - 1}]]`
		);

		return { replaced, placeholders };
	}

	function restorePlaceholders(text: string, placeholders: string[]): string {
		return text.replace(/\[\[#(\d+)\]\]/g, (_, idx) => placeholders[Number(idx)] ?? '');
	}

	async function requestTranslation(origin: Origin, target: string): Promise<Translation> {
		const text = extractPlaceholders(origin.text);
		const notes = extractPlaceholders(origin.notes);

		const res = await fetch('/api/translate', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ texts: [text.replaced, notes.replaced], target })
		});
		if (!res.ok) throw new Error(`Request failed: ${res.status}`);

		const { translations: result }: { translations: string[] } = await res.json();

		return {
			text: restorePlaceholders(result[0], text.placeholders),
			notes: origin.notes ? restorePlaceholders(result[1], notes.placeholders) : null
		};
	}

	async function toggleTranslation(idx: number, origin: Origin) {
		const key = `${idx}-${language}`;

		if (translated[key]) {
			translated[key] = false;
			return;
		}

		try {
			translations[key] ??= await requestTranslation(origin, language);
			translated[key] = true;
		} catch (err) {
			console.error('[Origin] Translation:', err);
		}
	}
</script>

<TabContent {isActive}>
	<div class="grid grid-cols-1 gap-6" class:md:grid-cols-2={origins.length > 1}>
		{#each origins as origin, idx (`${origin.provider}-${idx}`)}
			{@const key = `${idx}-${language}`}
			{@const translation = translated[key] ? translations[key] : null}
			{@const action = translation ? $_('emote.origin.undo') : $_('emote.origin.translate')}

			<div class="bg-base-300 flex flex-col gap-2 rounded-lg p-4 shadow">
				<div class="mb-1 flex items-center gap-2">
					<span class="text-primary font-semibold">{origin.provider}</span>
					<div class="ml-auto flex items-center gap-1">
						<button
							type="button"
							class="text-accent hover:link-accent flex cursor-pointer items-center"
							aria-label={action}
							title={action}
							onclick={() => toggleTranslation(idx, origin)}
						>
							{#if translation}
								<Undo2 class="h-4 w-4" />
							{:else}
								<Languages class="h-4 w-4" />
							{/if}
						</button>

						<a
							href={origin.source}
							target="_blank"
							rel="external noopener noreferrer"
							aria-label={$_('emote.origin.source')}
							title={$_('emote.origin.source')}
							class="text-accent hover:link-accent flex items-center gap-1"
						>
							<ExternalLink class="h-4 w-4" />
						</a>
					</div>
				</div>
				{#if origin.text}
					<div
						class="text-base-content/90 markdown-content text-sm wrap-anywhere whitespace-pre-line"
					>
						<!-- eslint-disable-next-line svelte/no-at-html-tags -->
						{@html renderMarkdown(translation?.text ?? origin.text)}
					</div>
				{/if}
				{#if origin.notes}
					<div
						class="text-base-content/70 markdown-content text-xs wrap-anywhere whitespace-pre-line"
					>
						<!-- eslint-disable-next-line svelte/no-at-html-tags -->
						{@html renderMarkdown(translation?.notes ?? origin.notes)}
					</div>
				{/if}
				{#if origin.artist}
					<div class="text-base-content mt-2 text-xs">
						{$_('emote.origin.author')}:
						<a
							href={`https://twitch.tv/${origin.artist}`}
							target="_blank"
							rel="external noopener noreferrer"
							aria-label={$_('emote.origin.author')}
							class="text-info hover:text-info/80 font-medium">{origin.artist}</a
						>
					</div>
				{/if}
			</div>
		{/each}
	</div>
</TabContent>
