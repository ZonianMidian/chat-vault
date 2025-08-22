<script lang="ts">
	import type { Theme } from '$lib/types/common';

	import { AlignJustify, Monitor, Moon, Sun, ChevronDown, Languages, Flag } from '@lucide/svelte';
	import { isDarkMode, setTheme } from '$lib/tools/isDarkMode';
	import { onMount, onDestroy, untrack } from 'svelte';
	import { getFlagImage } from '$lib/tools/language';
	import { _, locale } from 'svelte-i18n';

	let availableLocales = $state<Array<{ code: string; language: string }>>([]);
	let imageErrors = $state(new Set<string>());
	let currentTheme = $state<Theme>('system');
	let localesLoading = $state(true);
	let currentLocale = $state('en');
	let darkSchema = $state(true);

	const navLinks = [
		{ href: '/emote', key: 'navbar.emotes' },
		{ href: '/badge/global', key: 'navbar.badges' },
		{ href: '/channel/search', key: 'navbar.channels' }
	];

	const themeOptions = [
		{ value: 'system', key: 'theme.system', icon: Monitor },
		{ value: 'dark', key: 'theme.dark', icon: Moon },
		{ value: 'light', key: 'theme.light', icon: Sun }
	];

	function getThemeIcon() {
		return darkSchema ? Moon : Sun;
	}

	function handleThemeChange(theme: Theme) {
		const html = document.documentElement;

		if (theme === 'system' || theme === null) {
			currentTheme = 'system';
		} else {
			html.setAttribute('data-theme', theme);
			currentTheme = theme;
		}
		setTheme(theme);
	}

	async function loadAvailableLocales() {
		const context = import.meta.glob('$lib/i18n/locales/*.json');
		const locales: Array<{ code: string; language: string }> = [];

		for (const [key, loadLocale] of Object.entries(context)) {
			const match = key.match(/\/([^\/]+)\.json/);
			if (match) {
				const code = match[1];
				try {
					const localeData = (await loadLocale()) as any;
					locales.push({ code, language: localeData.default?.language || code });
				} catch (error) {
					console.error(`[Locale] Error - ${code}:`, error);
				}
			}
		}

		availableLocales = locales.sort((a, b) => a.language.localeCompare(b.language));
		localesLoading = false;
	}

	function handleLocaleChange(newLocale: string) {
		localStorage.setItem('locale', newLocale);
		localStorage.removeItem('globalBadges');
		locale.set(newLocale);
	}

	function handleImageError(code: string) {
		imageErrors = new Set([...imageErrors, code]);
	}

	function getLocaleButtonClass(localeCode: string): string {
		const isActive = currentLocale === localeCode || currentLocale.startsWith(`${localeCode}-`);

		return isActive
			? 'btn-active bg-info text-primary-content'
			: 'btn-ghost hover:bg-accent hover:text-accent-content';
	}

	onMount(() => {
		const savedTheme = localStorage.getItem('theme') as Theme;
		if (savedTheme) {
			document.documentElement.setAttribute('data-theme', savedTheme);
			currentTheme = savedTheme;
		} else {
			currentTheme = 'system';
		}

		const unsubscribeDarkMode = isDarkMode.subscribe((value) => {
			untrack(() => {
				darkSchema = value;
				const savedTheme = value ? 'dark' : 'light';
				document.documentElement.setAttribute('data-theme', savedTheme);
			});
		});

		const unsubscribeLocale = locale.subscribe((value) => {
			untrack(() => {
				if (value) {
					currentLocale = value;
				}
			});
		});

		loadAvailableLocales();

		onDestroy(() => {
			unsubscribeDarkMode();
			unsubscribeLocale();
		});
	});
</script>

<svelte:head>
	<meta property="og:locale" content={currentLocale.replace('-', '_')} />
</svelte:head>

<nav class="navbar bg-base-200 sticky top-0 z-50 shadow">
	<div class="navbar-start w-fit transition-opacity hover:opacity-80 lg:w-auto">
		<a href="/" class="flex items-center gap-2">
			<img src="/logo.svg" alt="Logo" class="h-10 w-10" />
			<span class="text-2xl font-black">Chat Vault</span>
		</a>
	</div>

	<div class="navbar-end flex-1 justify-end">
		<ul class="menu menu-horizontal hidden gap-2 lg:flex">
			{#each navLinks as link}
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

		{@render themeDropdown(
			'btn btn-ghost transition-all duration-200 hover:bg-base-100 hidden lg:flex text-xl font-medium',
			true
		)}

		{@render languageDropdown(
			'btn btn-ghost transition-all duration-200 hover:bg-base-100 hidden lg:flex text-xl font-medium',
			true
		)}

		<div class="flex items-center gap-2 lg:hidden">
			{@render themeDropdown(
				'btn btn-ghost transition-all duration-200 hover:bg-base-100',
				false
			)}

			{@render languageDropdown(
				'btn btn-ghost transition-all duration-200 hover:bg-base-100',
				false
			)}

			{@render navigationDropdown()}
		</div>
	</div>
</nav>

{#snippet themeDropdown(buttonClass: string, showChevron: boolean)}
	<div class="dropdown dropdown-end">
		<div role="button" class={buttonClass} tabindex="0">
			{#key currentTheme}
				{@const ThemeIcon = getThemeIcon()}
				<ThemeIcon class="h-7 w-7 transition-all" />
			{/key}
			{#if showChevron}
				<ChevronDown class="h-3 w-3 opacity-60" />
			{/if}
		</div>
		<div class="dropdown-content bg-base-300 rounded-box z-[1] mt-3 w-52 p-2 shadow-2xl">
			{#each themeOptions as option}
				<button
					type="button"
					class="btn btn-sm btn-block mb-1 justify-start gap-2 text-xl font-medium transition-all duration-200 {currentTheme ===
					option.value
						? 'btn-active bg-info text-primary-content'
						: 'btn-ghost hover:bg-accent hover:text-accent-content'}"
					onclick={() => handleThemeChange(option.value as Theme)}
				>
					<option.icon class="h-5 w-5" />
					<span>{$_(option.key)}</span>
				</button>
			{/each}
		</div>
	</div>
{/snippet}

{#snippet languageDropdown(buttonClass: string, showChevron: boolean)}
	<div class="dropdown dropdown-end">
		<div role="button" class={buttonClass} tabindex="0">
			<Languages class="h-7 w-7 transition-all" />
			{#if showChevron}
				<ChevronDown class="h-3 w-3 opacity-60" />
			{/if}
		</div>
		<div
			class="dropdown-content bg-base-300 rounded-box z-[1] mt-3 max-h-72 w-auto min-w-[16rem] overflow-y-auto p-2 shadow-2xl"
		>
			<a
				type="button"
				target="_blank"
				rel="noopener noreferrer"
				href="https://crowdin.com/project/chat-vault"
				class="btn btn-link hover:text-accent w-full justify-center text-lg font-semibold transition-all duration-200 hover:font-extrabold"
			>
				{$_('landing.contribute.translate.title')}
			</a>
			<div class="divider my-1"></div>
			{#if localesLoading}
				<div class="flex justify-center p-4">
					<span class="loading loading-spinner loading-xl"></span>
				</div>
			{:else}
				{#each availableLocales as localeOption}
					<button
						type="button"
						class="btn btn-sm btn-block mb-1 justify-start gap-3 text-lg font-medium transition-all duration-200 {getLocaleButtonClass(
							localeOption.code
						)}"
						onclick={() => handleLocaleChange(localeOption.code)}
					>
						<div class="flex h-4 w-6 items-center justify-center">
							{#if imageErrors.has(localeOption.code)}
								<Flag class="h-4 w-4 opacity-70" />
							{:else}
								<img
									src={getFlagImage(localeOption.code)}
									alt={localeOption.code}
									class="h-4 w-6 rounded-sm object-cover"
									onerror={() => handleImageError(localeOption.code)}
								/>
							{/if}
						</div>
						<span class="truncate">{localeOption.language}</span>
					</button>
				{/each}
			{/if}
		</div>
	</div>
{/snippet}

{#snippet navigationDropdown()}
	<div class="dropdown dropdown-end">
		<div
			role="button"
			class="btn btn-ghost hover:bg-base-100 transition-all duration-200"
			aria-label={$_('navbar.menu')}
			tabindex="0"
		>
			<AlignJustify class="h-7 w-7" />
		</div>
		<div class="dropdown-content bg-base-300 rounded-box z-[1] mt-3 w-52 p-2 shadow-2xl">
			{#each navLinks as link}
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
