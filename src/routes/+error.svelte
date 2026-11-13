<script lang="ts">
	import { page } from '$app/state';

	import LoadError from '#lib/components/LoadError.svelte';
</script>

<LoadError error={page.error} status={page.status} />
