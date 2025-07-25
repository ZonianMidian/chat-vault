<script lang="ts">
	import { Globe, ScanSearch } from '@lucide/svelte';
	import { page } from '$app/state';
	import { _ } from 'svelte-i18n';

	export let type: String;
</script>

<div class="mx-auto mt-16 grid w-full max-w-3xl grid-cols-1 gap-8 md:grid-cols-2">
	<a
		href="{page.url.href}/global"
		class="card card-side bg-primary/10 hover:bg-primary/20 border-primary/30 hover:border-primary/60 group relative cursor-pointer overflow-hidden border-2 shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl"
	>
		<div
			class="bg-primary/20 absolute -top-10 -left-10 h-32 w-32 rounded-full opacity-60 blur-2xl transition-transform duration-300 group-hover:scale-125"
		></div>
		<div class="card-body z-10 flex flex-col items-center justify-center gap-4">
			<div
				class="bg-primary text-primary-content rounded-full p-4 shadow-lg transition-transform duration-300 group-hover:rotate-6"
			>
				<Globe size={40} />
			</div>
			<span class="card-title text-primary text-2xl font-bold transition-all duration-300"
				>{$_(`global.${type}`)}</span
			>
		</div>
	</a>

	<a
		href="{page.url.href}/search"
		class="card card-side bg-accent/10 hover:bg-accent/20 border-accent/30 hover:border-accent/60 group relative cursor-pointer overflow-hidden border-2 shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl"
	>
		<div
			class="bg-accent/20 absolute -right-10 -bottom-10 h-32 w-32 rounded-full opacity-60 blur-2xl transition-transform duration-300 group-hover:scale-125"
		></div>
		<div class="card-body z-10 flex flex-col items-center justify-center gap-4">
			<div
				class="bg-accent text-accent-content rounded-full p-4 shadow-lg transition-transform duration-300 group-hover:-rotate-6"
			>
				<ScanSearch size={40} />
			</div>
			<span class="card-title text-accent text-2xl font-bold transition-all duration-300"
				>{$_(`search.${type}`)}</span
			>
		</div>
	</a>
</div>
