<script lang="ts">
	import type { Theme } from '#lib/types/common.ts';

	import {
		TextAlignJustify,
		ChevronDown,
		Languages,
		Monitor,
		Moon,
		Flag,
		Sun
	} from '@lucide/svelte';
	import { getStoredTheme, isDarkMode, setTheme } from '#lib/tools/theme.ts';
	import { setLocale } from '#lib/tools/preferences.ts';
	import { getFlagImage } from '#lib/tools/language.ts';
	import { _, locale } from 'svelte-i18n';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { onMount } from 'svelte';

	const navLinks = [
		{ href: resolve('/emote'), key: 'navbar.emotes' },
		{ href: resolve('/badge/global'), key: 'navbar.badges' },
		{ href: resolve('/channel/search'), key: 'navbar.channels' }
	];

	const themeOptions: { value: Theme; key: string; icon: typeof Monitor }[] = [
		{ value: 'system', key: 'theme.system', icon: Monitor },
		{ value: 'dark', key: 'theme.dark', icon: Moon },
		{ value: 'light', key: 'theme.light', icon: Sun }
	];

	const buttonClass = 'btn btn-ghost transition-all duration-200 hover:bg-base-100';
	const desktopButtonClass = `${buttonClass} hidden lg:flex text-xl font-medium`;

	let brokenFlags = $state<Record<string, boolean>>({});

	let currentTheme = $state<Theme>(page.data.theme ?? 'system');
	let darkSchema = $state(page.data.theme !== 'light');

	const currentLocale = $derived($locale ?? page.data.locale);
	const ThemeIcon = $derived(darkSchema ? Moon : Sun);

	function changeTheme(theme: Theme) {
		currentTheme = theme;
		setTheme(theme);
	}

	function isActiveLocale(code: string): boolean {
		return currentLocale === code || currentLocale.startsWith(`${code}-`);
	}

	onMount(() => {
		currentTheme = getStoredTheme() ?? 'system';

		return isDarkMode.subscribe((dark) => {
			darkSchema = dark;
			document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
		});
	});
</script>

<nav class="navbar bg-base-200 sticky top-0 z-50 shadow">
	<div class="navbar-start w-fit transition-opacity hover:opacity-80 lg:w-auto">
		<a href={resolve('/')} class="flex items-center gap-2">
			<img src="/favicon.svg" alt="Logo" class="h-10 w-10" />
			<span class="text-2xl font-black">Chat Vault</span>
		</a>
	</div>

	<div class="navbar-end flex-1 justify-end">
		<ul class="menu menu-horizontal hidden gap-2 lg:flex">
			{#each navLinks as link (link.href)}
				<li>
					<a
						href={link.href}
						class="flex w-32 items-center justify-center text-center text-xl font-medium transition-all duration-200 hover:font-black focus:font-black"
					>
						{$_(link.key)}
					</a>
				</li>
			{/each}
		</ul>

		{@render themeDropdown(desktopButtonClass, true)}
		{@render languageDropdown(desktopButtonClass, true)}

		<div class="flex items-center gap-2 lg:hidden">
			{@render themeDropdown(buttonClass, false)}
			{@render languageDropdown(buttonClass, false)}
			{@render navigationDropdown()}
		</div>
	</div>
</nav>

{#snippet themeDropdown(triggerClass: string, showChevron: boolean)}
	<div class="dropdown dropdown-end">
		<div role="button" class={triggerClass} tabindex="0" aria-label={$_('theme.label')}>
			<ThemeIcon class="h-7 w-7 transition-all" />
			{#if showChevron}
				<ChevronDown class="h-3 w-3 opacity-60" />
			{/if}
		</div>
		<div class="dropdown-content bg-base-300 rounded-box z-1 mt-3 w-52 p-2 shadow-2xl">
			{#each themeOptions as option (option.value)}
				<button
					type="button"
					class="btn btn-sm btn-block mb-1 justify-start gap-2 text-xl font-medium transition-all duration-200 {currentTheme ===
					option.value
						? 'btn-active bg-info text-primary-content'
						: 'btn-ghost hover:bg-accent hover:text-accent-content'}"
					onclick={() => changeTheme(option.value)}
				>
					<option.icon class="h-5 w-5" />
					<span>{$_(option.key)}</span>
				</button>
			{/each}
		</div>
	</div>
{/snippet}

{#snippet languageDropdown(triggerClass: string, showChevron: boolean)}
	<div class="dropdown dropdown-end">
		<div
			role="button"
			class={triggerClass}
			tabindex="0"
			aria-label={$_('common.select_language')}
		>
			<Languages class="h-7 w-7 transition-all" />
			{#if showChevron}
				<ChevronDown class="h-3 w-3 opacity-60" />
			{/if}
		</div>
		<div
			class="dropdown-content bg-base-300 rounded-box z-1 mt-3 max-h-72 w-auto min-w-[16rem] overflow-y-auto p-2 shadow-2xl"
		>
			<a
				target="_blank"
				rel="external noopener noreferrer"
				href="https://crowdin.com/project/chat-vault"
				class="btn btn-link hover:text-accent w-full justify-center text-lg font-semibold transition-all duration-200 hover:font-extrabold"
			>
				{$_('landing.contribute.translate.title')}
			</a>
			<div class="divider my-1"></div>
			{#each page.data.locales as option (option.code)}
				<button
					type="button"
					class="btn btn-sm btn-block mb-1 justify-start gap-3 text-lg font-medium transition-all duration-200 {isActiveLocale(
						option.code
					)
						? 'btn-active bg-info text-primary-content'
						: 'btn-ghost hover:bg-accent hover:text-accent-content'}"
					onclick={() => setLocale(option.code)}
				>
					<div class="flex h-4 w-6 items-center justify-center">
						{#if brokenFlags[option.code]}
							<Flag class="h-4 w-4 opacity-70" />
						{:else}
							<img
								src={getFlagImage(option.code)}
								alt={option.code}
								class="h-4 w-6 rounded-sm object-cover"
								loading="lazy"
								onerror={() => (brokenFlags[option.code] = true)}
							/>
						{/if}
					</div>
					<span class="truncate">{option.language}</span>
				</button>
			{/each}
		</div>
	</div>
{/snippet}

{#snippet navigationDropdown()}
	<div class="dropdown dropdown-end">
		<div role="button" class={buttonClass} aria-label={$_('navbar.menu')} tabindex="0">
			<TextAlignJustify class="h-7 w-7" />
		</div>
		<div class="dropdown-content bg-base-300 rounded-box z-1 mt-3 w-52 p-2 shadow-2xl">
			{#each navLinks as link (link.href)}
				<a
					href={link.href}
					class="btn btn-sm btn-ghost hover:bg-accent hover:text-accent-content mb-1 flex items-center justify-center gap-2 text-center text-xl font-medium transition-all duration-200 hover:font-black"
				>
					{$_(link.key)}
				</a>
			{/each}
		</div>
	</div>
{/snippet}
