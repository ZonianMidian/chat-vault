<script lang="ts">
	import { _ } from 'svelte-i18n';

	import SelectOption from '#lib/components/SelectOption.svelte';
	import Seo from '#lib/components/Seo.svelte';
</script>

<Seo
	title={$_('navbar.emotes')}
	path="/emote"
	description={$_('landing.features.emotes.description')}
	breadcrumbs={[{ name: $_('navbar.emotes') }]}
/>

<div class="container-general container-h">
	<SelectOption type="emote" />
</div>
