<script lang="ts">
	export let activeTab: string = 'info';

	function changeTab(tabId: string) {
		activeTab = tabId;
	}
</script>

<div class="tabs tabs-lift relative">
	<slot name="tabs" {changeTab} {activeTab}></slot>
	<slot name="content"></slot>
</div>
