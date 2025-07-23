<script lang="ts">
	import type { Origin } from '$lib/types/common';

	import { ExternalLink, Languages, Undo2 } from '@lucide/svelte';
	import { _, getLocaleFromNavigator } from 'svelte-i18n';
	import { renderMarkdown } from '$lib/tools/marked';
	import { translateText } from '$lib/utils';

	import TabContent from '$lib/components/TabContent.svelte';

	export let origins: Origin[] = [];
	export let isLoading: boolean;
	export let isActive: boolean;

	let translatedTexts: Record<number, { text?: string; notes?: string }> = {};
	let placeholders: Record<number, { text: string[]; notes: string[] }> = {};
	let translated: Record<number, boolean> = {};

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
		if (!translated[idx]) {
			if (!translatedTexts[idx]) {
				const result: { text?: string; notes?: string } = {};

				const originText = extractPlaceholders(origin.text);
				const originNotes = extractPlaceholders(origin.notes);

				placeholders[idx] = {
					text: originText.placeholders,
					notes: originNotes.placeholders
				};

				if (origin.text) {
					const translated = await translateText(
						originText.replaced,
						getLocaleFromNavigator()
					);
					result.text = restorePlaceholders(translated, originText.placeholders);
				}
				if (origin.notes) {
					const translated = await translateText(
						originNotes.replaced,
						getLocaleFromNavigator()
					);
					result.notes = restorePlaceholders(translated, originNotes.placeholders);
				}
				translatedTexts[idx] = result;
			}
			translated[idx] = true;
		} else {
			translated[idx] = false;
		}
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
		<div
			class="grid grid-cols-1 gap-6 md:grid-cols-1 {origins.length > 1
				? 'md:grid-cols-2'
				: ''}"
		>
			{#each origins as origin, idx}
				<div class="bg-base-300 flex flex-col gap-2 rounded-lg p-4 shadow">
					<div class="mb-1 flex items-center gap-2">
						<span class="text-primary font-semibold">{origin.provider}</span>
						<div class="ml-auto flex items-center gap-1">
							<button
								type="button"
								class="text-accent hover:link-accent flex cursor-pointer items-center"
								aria-label={translated[idx]
									? $_('emote.origin.undo')
									: $_('emote.origin.translate')}
								on:click={() => handleTranslate(idx, origin)}
								title={translated[idx]
									? $_('emote.origin.undo')
									: $_('emote.origin.translate')}
							>
								{#if translated[idx]}
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
								translated[idx] && translatedTexts[idx]?.text
									? translatedTexts[idx].text
									: origin.text
							)}
						</div>
					{/if}
					{#if origin.notes}
						<div
							class="text-base-content/70 markdown-content text-xs wrap-anywhere whitespace-pre-line"
						>
							{@html renderMarkdown(
								translated[idx] && translatedTexts[idx]?.notes
									? translatedTexts[idx].notes
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
