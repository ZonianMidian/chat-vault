<script lang="ts">
	import { Zap, Target, RotateCcw, Gem } from '@lucide/svelte';
	import { version } from '$app/environment';
	import { locale } from 'svelte-i18n';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { _ } from 'svelte-i18n';

	let jsonLdElement: HTMLScriptElement;
	let heroSection: HTMLElement;
	let featuresVisible = $state(false);
	let platformsVisible = $state(false);
	let providersVisible = $state(false);

	const platforms = [
		{ name: 'Twitch', logo: '/logos/twitch.svg', url: 'https://twitch.tv' },
		{ name: 'YouTube', logo: '/logos/youtube.svg', url: 'https://youtube.com' },
		{ name: 'Kick', logo: '/logos/kick.svg', url: 'https://kick.com' }
	];

	const thirdParty = [
		{ name: 'BetterTTV', logo: '/logos/bttv.svg', url: 'https://betterttv.com' },
		{ name: 'FrankerFaceZ', logo: '/logos/ffz.svg', url: 'https://frankerfacez.com' },
		{ name: '7TV', logo: '/logos/7tv.svg', url: 'https://7tv.app' }
	];

	const dataProviders = [
		{
			name: 'StreamDatabase',
			logo: '/logos/streamdatabase.svg',
			url: 'https://streamdatabase.com'
		},
		{ name: 'Supibot', logo: '/logos/supibot.svg', url: 'https://supinic.com/data/origin/list' }
	];

	function openExternalLink(url: string) {
		window.open(url, '_blank', 'noopener,noreferrer');
	}

	const features = [
		{
			titleKey: 'landing.features.emotes.title',
			descKey: 'landing.features.emotes.description',
			href: '/emote',
			gradient: 'from-purple-500 to-pink-500'
		},
		{
			titleKey: 'landing.features.badges.title',
			descKey: 'landing.features.badges.description',
			href: '/badge/global',
			gradient: 'from-blue-500 to-cyan-500'
		},
		{
			titleKey: 'landing.features.channels.title',
			descKey: 'landing.features.channels.description',
			href: '/channel/search',
			gradient: 'from-green-500 to-emerald-500'
		}
	];

	onMount(() => {
		const observerOptions = {
			threshold: 0.1,
			rootMargin: '0px 0px -50px 0px'
		};

		const observer = new IntersectionObserver((entries) => {
			entries.forEach((entry) => {
				if (entry.target.id === 'features' && entry.isIntersecting) {
					featuresVisible = true;
				}
				if (entry.target.id === 'platforms' && entry.isIntersecting) {
					platformsVisible = true;
				}
				if (entry.target.id === 'providers' && entry.isIntersecting) {
					providersVisible = true;
				}
			});
		}, observerOptions);

		const featuresSection = document.getElementById('features');
		const platformsSection = document.getElementById('platforms');
		const providersSection = document.getElementById('providers');

		if (featuresSection) observer.observe(featuresSection);
		if (platformsSection) observer.observe(platformsSection);
		if (providersSection) observer.observe(providersSection);

		return () => observer.disconnect();
	});

	$effect(() => {
		if (jsonLdElement && page.url.origin) {
			const jsonLd = {
				'@context': 'https://schema.org',
				'@type': 'WebSite',
				name: 'Chat Vault',
				url: `${page.url.origin}/`,
				description: $_('landing.hero.subtitle')
			};
			jsonLdElement.textContent = JSON.stringify(jsonLd);
		}
	});
</script>

<svelte:head>
	<meta property="og:title" content="Chat Vault" />

	<meta name="description" content={$_('landing.hero.subtitle')} />
	<meta property="og:description" content={$_('landing.hero.subtitle')} />

	<meta property="og:url" content="{page.url.origin}/" />
	<link rel="canonical" href="{page.url.origin}/" />

	<meta property="og:image" content="{page.url.origin}/favicon.png" />

	<script bind:this={jsonLdElement} type="application/ld+json"></script>
</svelte:head>

<section
	bind:this={heroSection}
	id="hero"
	class="from-base-200 via-base-100 to-base-200 container-general container-h relative overflow-hidden bg-gradient-to-br"
>
	<div class="absolute inset-0 opacity-20">
		<div
			class="absolute top-20 left-20 h-32 w-32 animate-pulse rounded-full bg-purple-500 blur-3xl"
		></div>
		<div
			class="absolute right-32 bottom-32 h-40 w-40 animate-pulse rounded-full bg-blue-500 blur-3xl"
			style="animation-delay: 2s;"
		></div>
		<div
			class="absolute top-1/2 left-1/3 h-24 w-24 animate-pulse rounded-full bg-green-500 blur-3xl"
			style="animation-delay: 4s;"
		></div>
	</div>

	<div
		class="relative z-10 container mx-auto flex flex-1 items-center justify-center px-6 text-center"
	>
		<div class="animate-fade-in-up w-full">
			<div class="mb-8 flex justify-center">
				<img
					src="/logo.svg"
					alt="Chat Vault Logo"
					class="h-32 w-32 drop-shadow-2xl transition-transform duration-500 ease-out hover:scale-110"
				/>
			</div>

			<h1
				class="from-primary via-secondary to-accent animate-gradient-shift mb-6 bg-gradient-to-r bg-clip-text text-5xl font-black text-transparent md:text-7xl"
			>
				Chat Vault
			</h1>

			<p
				class="text-base-content/80 mx-auto mb-8 max-w-3xl text-xl leading-relaxed md:text-2xl"
			>
				{$_('landing.hero.subtitle')}
			</p>

			<p class="text-base-content/60 mx-auto mb-12 max-w-2xl text-lg">
				{$_('landing.hero.description')}
			</p>

			<div class="flex flex-col items-center justify-center gap-4 sm:flex-row">
				<a
					href="/emote"
					class="btn btn-primary btn-lg hover:shadow-primary/50 px-8 text-lg shadow-2xl transition-all duration-300 hover:scale-105"
				>
					{$_('landing.hero.cta.primary')}
				</a>
				<a
					href="/channel/search"
					class="btn btn-outline btn-lg px-8 text-lg transition-all duration-300 hover:scale-105"
				>
					{$_('landing.hero.cta.secondary')}
				</a>
			</div>
		</div>
	</div>

	<div
		class="absolute bottom-2 left-1/2 hidden -translate-x-1/2 transform animate-bounce md:bottom-4 md:block lg:bottom-8 lg:block"
	>
		<div class="border-base-content/30 flex h-10 w-6 justify-center rounded-full border-2">
			<div class="bg-base-content/30 mt-2 h-3 w-1 animate-pulse rounded-full"></div>
		</div>
	</div>

	<div class="h-20 lg:h-30"></div>
</section>

<section id="platforms" class="bg-base-100 py-20">
	<div class="container mx-auto px-6">
		<div class="mb-16 text-center">
			<h2 class="mb-6 text-4xl font-bold md:text-5xl">
				{$_('landing.platforms.title')}
			</h2>
			<p class="text-base-content/70 mx-auto max-w-2xl text-xl">
				{$_('landing.platforms.subtitle')}
			</p>
		</div>

		<div class="grid grid-cols-1 items-center gap-16 md:grid-cols-2">
			<div class="space-y-8">
				<h3 class="mb-8 text-center text-2xl font-bold">{$_('landing.platforms.main')}</h3>
				<div class="grid grid-cols-3 gap-8">
					{#each platforms as platform, i}
						<button
							class="bg-base-200 hover:bg-base-300 group flex cursor-pointer flex-col items-center rounded-2xl p-3 transition-all duration-500 hover:scale-110 hover:shadow-xl"
							class:animate-slide-up={platformsVisible}
							style="animation-delay: {i * 200}ms;"
							onclick={() => openExternalLink(platform.url)}
						>
							<img
								src={platform.logo}
								alt="{platform.name} logo"
								class="mb-4 h-16 w-16 transition-transform duration-300 group-hover:scale-110"
							/>
							<span class="text-lg font-semibold break-all">{platform.name}</span>
						</button>
					{/each}
				</div>
			</div>

			<div class="space-y-8">
				<h3 class="mb-8 text-center text-2xl font-bold">
					{$_('landing.platforms.thirdparty')}
				</h3>
				<div class="grid grid-cols-3 gap-8">
					{#each thirdParty as tp, i}
						<button
							class="bg-base-200 hover:bg-base-300 group flex cursor-pointer flex-col items-center rounded-2xl p-3 transition-all duration-500 hover:scale-110 hover:shadow-xl"
							class:animate-slide-up={platformsVisible}
							style="animation-delay: {(i + 3) * 200}ms;"
							onclick={() => openExternalLink(tp.url)}
						>
							<img
								src={tp.logo}
								alt="{tp.name} logo"
								class="mb-4 h-16 w-16 transition-transform duration-300 group-hover:scale-110"
							/>
							<span class="text-center text-sm font-semibold break-all"
								>{tp.name}</span
							>
						</button>
					{/each}
				</div>
			</div>
		</div>
	</div>
</section>

<section id="providers" class="from-base-200 to-base-300 bg-gradient-to-br py-20">
	<div class="container mx-auto px-6">
		<div class="mb-16 text-center">
			<h2 class="mb-6 text-4xl font-bold md:text-5xl">
				{$_('landing.providers.title')}
			</h2>
			<p class="text-base-content/70 mx-auto max-w-3xl text-xl leading-relaxed">
				{$_('landing.providers.subtitle')}
			</p>
		</div>

		<div class="mx-auto max-w-4xl">
			<div class="bg-base-100 rounded-3xl p-8 shadow-xl md:p-12">
				<div class="grid grid-cols-1 items-center gap-8 md:grid-cols-2">
					<div class="space-y-6">
						<h3 class="mb-4 text-2xl font-bold md:text-3xl">
							{$_('landing.providers.community_title')}
						</h3>
						<p class="text-base-content/70 leading-relaxed">
							{$_('landing.providers.community_description')}
						</p>
						<p class="text-base-content/60 text-sm leading-relaxed">
							{$_('landing.providers.contribute_message')}
						</p>
					</div>

					<div class="space-y-6">
						<h4 class="mb-6 text-center text-xl font-bold">
							{$_('landing.providers.our_partners')}
						</h4>
						<div class="grid grid-cols-1 gap-4">
							{#each dataProviders as provider, i}
								<button
									class="group bg-base-200 hover:bg-base-300 cursor-pointer rounded-2xl p-6 shadow-lg transition-all duration-500 hover:scale-105 hover:shadow-2xl"
									class:animate-slide-up={providersVisible}
									style="animation-delay: {i * 300}ms;"
									onclick={() => openExternalLink(provider.url)}
								>
									<div class="flex items-center justify-center gap-4">
										<img
											src={provider.logo}
											alt="{provider.name} logo"
											class="h-12 w-12 transition-transform duration-300 group-hover:scale-110"
										/>
										<div class="text-center">
											<h5
												class="group-hover:text-primary text-lg font-bold transition-colors duration-300"
											>
												{provider.name}
											</h5>
											<p class="text-base-content/60 text-sm">
												{$_('landing.providers.visit_website')}
											</p>
										</div>
										<svg
											class="text-base-content/40 group-hover:text-primary h-5 w-5 transition-all duration-300 group-hover:translate-x-1"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
											></path>
										</svg>
									</div>
								</button>
							{/each}
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>

<section id="features" class="bg-base-100 py-20">
	<div class="container mx-auto px-6">
		<div class="mb-16 text-center">
			<h2 class="mb-6 text-4xl font-bold md:text-5xl">
				{$_('landing.features.title')}
			</h2>
			<p class="text-base-content/70 mx-auto max-w-2xl text-xl">
				{$_('landing.features.subtitle')}
			</p>
		</div>

		<div class="grid grid-cols-1 gap-8 md:grid-cols-3">
			{#each features as feature, i}
				<a
					href={feature.href}
					class="group block"
					class:animate-slide-up={featuresVisible}
					style="animation-delay: {i * 200}ms;"
				>
					<div
						class="bg-base-200 border-base-300 hover:border-primary/50 h-full rounded-3xl border p-8 shadow-xl transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl"
					>
						<div class="mb-6">
							<div
								class="h-16 w-16 rounded-2xl bg-gradient-to-br {feature.gradient} mb-4 flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
							>
								<div class="h-8 w-8 rounded-lg bg-white opacity-90"></div>
							</div>
						</div>

						<h3
							class="group-hover:text-primary mb-4 text-2xl font-bold transition-colors duration-300"
						>
							{$_(feature.titleKey)}
						</h3>

						<p class="text-base-content/70 leading-relaxed">
							{$_(feature.descKey)}
						</p>

						<div
							class="text-primary mt-6 flex items-center font-semibold transition-all duration-300 group-hover:gap-3"
						>
							<span>{$_('landing.features.explore')}</span>
							<svg
								class="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M17 8l4 4m0 0l-4 4m4-4H3"
								></path>
							</svg>
						</div>
					</div>
				</a>
			{/each}
		</div>
	</div>
</section>

<section class="from-base-200 to-base-300 bg-gradient-to-br py-20">
	<div class="container mx-auto px-6">
		<div class="mb-16 text-center">
			<h2 class="mb-6 text-4xl font-bold md:text-5xl">
				{$_('landing.why.title')}
			</h2>
		</div>

		<div class="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
			<div
				class="hover:bg-base-100 group rounded-2xl p-6 text-center transition-all duration-300"
			>
				<div class="mb-4 flex justify-center">
					<div
						class="rounded-full bg-gradient-to-br from-orange-400 to-red-500 p-4 transition-transform duration-300 group-hover:scale-110"
					>
						<Zap class="h-8 w-8 text-white" />
					</div>
				</div>
				<h3 class="mb-2 text-xl font-bold">{$_('landing.why.fast.title')}</h3>
				<p class="text-base-content/70">{$_('landing.why.fast.description')}</p>
			</div>

			<div
				class="hover:bg-base-100 group rounded-2xl p-6 text-center transition-all duration-300"
			>
				<div class="mb-4 flex justify-center">
					<div
						class="rounded-full bg-gradient-to-br from-blue-400 to-purple-500 p-4 transition-transform duration-300 group-hover:scale-110"
					>
						<Target class="h-8 w-8 text-white" />
					</div>
				</div>
				<h3 class="mb-2 text-xl font-bold">{$_('landing.why.organized.title')}</h3>
				<p class="text-base-content/70">{$_('landing.why.organized.description')}</p>
			</div>

			<div
				class="hover:bg-base-100 group rounded-2xl p-6 text-center transition-all duration-300"
			>
				<div class="mb-4 flex justify-center">
					<div
						class="rounded-full bg-gradient-to-br from-green-400 to-emerald-500 p-4 transition-transform duration-300 group-hover:scale-110"
					>
						<RotateCcw class="h-8 w-8 text-white" />
					</div>
				</div>
				<h3 class="mb-2 text-xl font-bold">{$_('landing.why.updated.title')}</h3>
				<p class="text-base-content/70">{$_('landing.why.updated.description')}</p>
			</div>

			<div
				class="hover:bg-base-100 group rounded-2xl p-6 text-center transition-all duration-300"
			>
				<div class="mb-4 flex justify-center">
					<div
						class="rounded-full bg-gradient-to-br from-purple-400 to-pink-500 p-4 transition-transform duration-300 group-hover:scale-110"
					>
						<Gem class="h-8 w-8 text-white" />
					</div>
				</div>
				<h3 class="mb-2 text-xl font-bold">{$_('landing.why.free.title')}</h3>
				<p class="text-base-content/70">{$_('landing.why.free.description')}</p>
			</div>
		</div>
	</div>
</section>

<footer class="bg-base-100 py-8">
	<div class="container mx-auto px-6">
		<div class="space-y-3 text-center">
			<p class="text-base-content/60 mx-auto max-w-2xl text-sm leading-relaxed">
				{$_('landing.footer.disclaimer')}
			</p>

			<div
				class="text-base-content/40 flex flex-col items-center justify-center gap-4 text-xs sm:flex-row"
			>
				<span>v{version}</span>
				{#if $locale && $locale !== 'en'}
					{@const translators = $_('landing.footer.translator_username').split(';')}
					<span class="hidden sm:block">•</span>
					<span>
						{$_('landing.footer.translated_by')}:
						{#each translators as translator, i}
							<a
								href={`https://twitch.tv/${translator}`}
								target="_blank"
								rel="noopener noreferrer"
								class="link"
							>
								{translator}
							</a>{#if i < translators.length - 2},&nbsp;{:else if i === translators.length - 2}&nbsp;&&nbsp;{/if}
						{/each}
					</span>
				{/if}
			</div>
		</div>
	</div>
</footer>

<style>
	@keyframes fade-in-up {
		from {
			opacity: 0;
			transform: translateY(30px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@keyframes slide-up {
		from {
			opacity: 0;
			transform: translateY(50px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@keyframes gradient-shift {
		0%,
		100% {
			background-position: 0% 50%;
		}
		50% {
			background-position: 100% 50%;
		}
	}

	.animate-fade-in-up {
		animation: fade-in-up 1s ease-out;
	}

	.animate-slide-up {
		animation: slide-up 0.8s ease-out both;
	}

	.animate-gradient-shift {
		background-size: 200% 200%;
		animation: gradient-shift 4s ease infinite;
	}
</style>
