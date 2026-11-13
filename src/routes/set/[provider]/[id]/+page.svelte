<script lang="ts">
	import LoadError from '#lib/components/LoadError.svelte';
	import SetView from '#lib/components/set/SetView.svelte';

	let { data } = $props();
</script>

{#key `${data.provider}/${data.id}`}
	{#await data.set}
		<SetView provider={data.provider} />
	{:then set}
		<SetView provider={data.provider} {set} />
	{:catch error}
		<LoadError {error} />
	{/await}
{/key}
