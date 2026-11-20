<script lang="ts">
	import { _ } from 'svelte-i18n';

	import Construction from '#lib/components/Construction.svelte';
	import Seo from '#lib/components/Seo.svelte';
</script>

<Seo title={$_('emote.search')} path="/emote/search" noindex />

<Construction />
