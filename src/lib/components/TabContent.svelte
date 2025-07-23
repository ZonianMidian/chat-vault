<script lang="ts">
	export let isActive: boolean;
</script>

<div
	class="tab-content bg-base-100 border-base-300 p-4"
	style="display: {isActive ? 'block' : 'none'}"
>
	<slot></slot>
</div>
