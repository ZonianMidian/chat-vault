<script lang="ts">
	import type { Origin } from '$lib/types/common';

	import { ExternalLink, Languages, Undo2 } from '@lucide/svelte';
	import { _, locale, getLocaleFromNavigator } from 'svelte-i18n';
	import { renderMarkdown } from '$lib/tools/marked';
	import { translateText } from '$lib/utils';
	import { untrack } from 'svelte';

	import TabContent from '$lib/components/TabContent.svelte';

	let {
		origins = [],
		isLoading,
		isActive
	}: {
		origins?: Origin[];
		isLoading: boolean;
		isActive: boolean;
	} = $props();

	let translatedTexts = $state<Record<string, { text?: string; notes?: string }>>({});
	let placeholders = $state<Record<number, { text: string[]; notes: string[] }>>({});
	let translated = $state<Record<string, boolean>>({});

	const gridClass = $derived(
		`grid grid-cols-1 gap-6 md:grid-cols-1 ${origins.length > 1 ? 'md:grid-cols-2' : ''}`
	);

	const language = $derived(
		$locale ? $locale.split('-')[0] : (getLocaleFromNavigator()?.split('-')[0] ?? 'en')
	);

	function extractPlaceholders(str: string | undefined | null): {
		replaced: string;
		placeholders: string[];
	} {
		if (!str) return { replaced: '', placeholders: [] };

		const placeholders: string[] = [];
		const replaced = str.replace(
			/\*\*\S+\s\[\[!\[Emote\]\S+\]\*\*|!?\[([^\]]+)\]\(([^)]+)\)/g,
			(match) => {
				placeholders.push(match);
				return `[[#${placeholders.length - 1}]]`;
			}
		);

		return { replaced, placeholders };
	}

	function restorePlaceholders(str: string, placeholders: string[]): string {
		return str.replace(/\[\[#(\d+)\]\]/g, (_, idx) => placeholders[Number(idx)] ?? '');
	}

	async function handleTranslate(idx: number, origin: Origin) {
		untrack(async () => {
			if (!translated[`${idx}-${language}`]) {
				if (!translatedTexts[`${idx}-${language}`]) {
					const result: { text?: string; notes?: string } = {};

					const originText = extractPlaceholders(origin.text);
					const originNotes = extractPlaceholders(origin.notes);

					placeholders = {
						...placeholders,
						[`${idx}-${language}`]: {
							text: originText.placeholders,
							notes: originNotes.placeholders
						}
					};

					if (origin.text) {
						const translatedText = await translateText(originText.replaced, language);
						result.text = restorePlaceholders(translatedText, originText.placeholders);
					}
					if (origin.notes) {
						const translatedNotes = await translateText(originNotes.replaced, language);
						result.notes = restorePlaceholders(
							translatedNotes,
							originNotes.placeholders
						);
					}

					translatedTexts = { ...translatedTexts, [`${idx}-${language}`]: result };
				}
				translated = { ...translated, [`${idx}-${language}`]: true };
			} else {
				translated = { ...translated, [`${idx}-${language}`]: false };
			}
		});
	}
</script>

<TabContent {isActive}>
	{#if isLoading}
		<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
			{#each Array(2) as _}
				<div class="skeleton h-45 w-full rounded-lg"></div>
			{/each}
		</div>
	{:else}
		<div class={gridClass}>
			{#each origins as origin, idx}
				<div class="bg-base-300 flex flex-col gap-2 rounded-lg p-4 shadow">
					<div class="mb-1 flex items-center gap-2">
						<span class="text-primary font-semibold">{origin.provider}</span>
						<div class="ml-auto flex items-center gap-1">
							<button
								type="button"
								class="text-accent hover:link-accent flex cursor-pointer items-center"
								aria-label={translated[`${idx}-${language}`]
									? $_('emote.origin.undo')
									: $_('emote.origin.translate')}
								onclick={() => handleTranslate(idx, origin)}
								title={translated[`${idx}-${language}`]
									? $_('emote.origin.undo')
									: $_('emote.origin.translate')}
							>
								{#if translated[`${idx}-${language}`]}
									<Undo2 class="h-4 w-4" />
								{:else}
									<Languages class="h-4 w-4" />
								{/if}
							</button>

							<a
								href={origin.source}
								target="_blank"
								rel="noopener noreferrer"
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
							{@html renderMarkdown(
								translated[`${idx}-${language}`] &&
									translatedTexts[`${idx}-${language}`]?.text
									? (translatedTexts[`${idx}-${language}`].text ?? '')
									: origin.text
							)}
						</div>
					{/if}
					{#if origin.notes}
						<div
							class="text-base-content/70 markdown-content text-xs wrap-anywhere whitespace-pre-line"
						>
							{@html renderMarkdown(
								translated[`${idx}-${language}`] &&
									translatedTexts[`${idx}-${language}`]?.notes
									? (translatedTexts[`${idx}-${language}`].notes ?? '')
									: origin.notes
							)}
						</div>
					{/if}
					{#if origin.artist}
						<div class="text-base-content mt-2 text-xs">
							{$_('emote.origin.author')}:
							<a
								href={`https://twitch.tv/${origin.artist}`}
								target="_blank"
								rel="noopener noreferrer"
								aria-label={$_('emote.origin.author')}
								class="text-info hover:text-info/80 font-medium">{origin.artist}</a
							>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</TabContent>
