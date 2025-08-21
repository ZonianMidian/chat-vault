<script lang="ts">
	import { Construction } from '@lucide/svelte';
	import { _ } from 'svelte-i18n';
</script>

<div class="container-general container-h">
	<div
		class="bg-warning/10 border-warning/30 flex min-h-60 max-w-7xl flex-col items-center justify-center gap-4 rounded-xl border-2 p-8 shadow-lg"
	>
		<div class="animate-bounce">
			<Construction class="text-warning" size={64} />
		</div>
		<h2 class="text-warning text-2xl font-bold">{$_('construction.title')}</h2>
		<p class="text-warning/80 max-w-md text-center">
			{$_('construction.description')}
		</p>
	</div>
</div>
