<script lang="ts">
	import { AlignJustify } from '@lucide/svelte';
	import { _ } from 'svelte-i18n';

	let isMenuOpen = false;
	function toggleMenu() {
		isMenuOpen = !isMenuOpen;
	}
	function closeMenu() {
		isMenuOpen = false;
	}
</script>

<nav class="navbar bg-base-200 sticky top-0 z-50 shadow">
	<div class="lg:navbar-start transition-opacity hover:opacity-80">
		<a href="/" class="flex items-center gap-2">
			<img src="/logo.svg" alt="Logo" class="h-10 w-10" />
			<span class="text-2xl font-black">Chat Vault</span>
		</a>
	</div>
	<div class="navbar-end flex-1 justify-end">
		<!-- Desktop -->
		<ul class="menu menu-horizontal hidden gap-2 lg:flex">
			<li>
				<a
					href="/emote"
					class="flex items-center justify-center text-center text-xl font-medium transition-all duration-200 hover:font-black focus:font-black"
				>
					{$_('navbar.emotes')}
				</a>
			</li>
			<li>
				<a
					href="/badge/global"
					class="flex items-center justify-center text-center text-xl font-medium transition-all duration-200 hover:font-black focus:font-black"
				>
					{$_('navbar.badges')}
				</a>
			</li>
			<li>
				<a
					href="/channel/search"
					class="flex items-center justify-center text-center text-xl font-medium transition-all duration-200 hover:font-black focus:font-black"
				>
					{$_('navbar.channels')}
				</a>
			</li>
		</ul>
		<!-- Mobile -->
		<div class="dropdown dropdown-end lg:hidden">
			<button
				type="button"
				class="btn btn-ghost"
				aria-label={$_('navbar.menu')}
				aria-expanded={isMenuOpen}
				on:click={toggleMenu}
				on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && toggleMenu()}
			>
				<AlignJustify class="h-6 w-6" />
			</button>
			{#if isMenuOpen}
				<ul
					class="dropdown-content menu menu-sm bg-base-200 rounded-box absolute right-0 z-[1] mt-3 w-52 p-2 shadow"
				>
					<li>
						<a
							href="/emote"
							class="flex w-full items-center justify-center text-center text-xl font-medium transition-all duration-200 hover:font-black focus:font-black"
							on:click={closeMenu}
						>
							{$_('navbar.emotes')}
						</a>
					</li>
					<li>
						<a
							href="/badge/global"
							class="flex w-full items-center justify-center text-center text-xl font-medium transition-all duration-200 hover:font-black focus:font-black"
							on:click={closeMenu}
						>
							{$_('navbar.badges')}
						</a>
					</li>
					<li>
						<a
							href="/channel/search"
							class="flex w-full items-center justify-center text-center text-xl font-medium transition-all duration-200 hover:font-black focus:font-black"
							on:click={closeMenu}
						>
							{$_('navbar.channels')}
						</a>
					</li>
				</ul>
			{/if}
		</div>
	</div>
</nav>
