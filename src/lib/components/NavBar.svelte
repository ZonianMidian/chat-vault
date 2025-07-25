<script lang="ts">
	import type { Theme } from '$lib/types/common';

	import { AlignJustify, Monitor, Moon, Sun, ChevronDown } from '@lucide/svelte';
	import { isDarkMode, setTheme } from '$lib/tools/isDarkMode';
	import { onDestroy, onMount, untrack } from 'svelte';
	import { _ } from 'svelte-i18n';

	let currentTheme = $state<Theme>('system');
	let darkSchema = $state(true);

	const navLinks = [
		{ href: '/emote', key: 'navbar.emotes' },
		{ href: '/badge/global', key: 'navbar.badges' },
		{ href: '/channel/search', key: 'navbar.channels' }
	];

	const themeOptions = [
		{ value: 'system', label: $_('theme.system'), icon: Monitor },
		{ value: 'dark', label: $_('theme.dark'), icon: Moon },
		{ value: 'light', label: $_('theme.light'), icon: Sun }
	];

	function getThemeIcon() {
		return darkSchema ? Moon : Sun;
	}

	function handleThemeChange(theme: Theme) {
		const html = document.documentElement;

		if (theme === 'system' || theme === null) {
			html.removeAttribute('data-theme');
			currentTheme = 'system';
		} else {
			html.setAttribute('data-theme', theme);
			currentTheme = theme;
		}
		setTheme(theme);
	}

	onMount(() => {
		const savedTheme = localStorage.getItem('theme') as Theme;
		if (savedTheme) {
			document.documentElement.setAttribute('data-theme', savedTheme);
			currentTheme = savedTheme;
		} else {
			currentTheme = 'system';
		}
	});

	onMount(() => {
		const unsubscribe = isDarkMode.subscribe((value) => {
			untrack(() => {
				darkSchema = value;
				const savedTheme = value ? 'dark' : 'light';

				document.documentElement.setAttribute('data-theme', savedTheme);
			});
		});

		onDestroy(() => {
			unsubscribe();
		});
	});
</script>

<svelte:head>
	<script>
		(function () {
			const savedTheme = localStorage.getItem('theme');
			if (savedTheme) {
				document.documentElement.setAttribute('data-theme', savedTheme);
			}
		})();
	</script>
</svelte:head>

<nav class="navbar bg-base-200 sticky top-0 z-50 shadow">
	<div class="lg:navbar-start transition-opacity hover:opacity-80">
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

		<div class="flex items-center gap-2 lg:hidden">
			{@render themeDropdown(
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
					<span>{option.label}</span>
				</button>
			{/each}
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
