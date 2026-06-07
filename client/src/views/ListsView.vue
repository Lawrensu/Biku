<script setup>
import { ref, watch, onMounted }  from 'vue'
import { getList, addItem }       from '../services/list.service.js'
import ListContainer              from '../components/list/ListContainer.vue'
import BaseButton                 from '../components/base/BaseButton.vue'

const LIST_TYPES = ['bucket', 'grocery', 'wishlist']
const activeTab  = ref('bucket')

const lists   = ref({ bucket: [], grocery: [], wishlist: [] })
const loading = ref({ bucket: false, grocery: false, wishlist: false })
const newItem  = ref('')
const addLoading = ref(false)

async function fetchList(type) {
	loading.value[type] = true
	try {
		const data = await getList(type)
		lists.value[type] = data?.list?.items ?? data?.items ?? []
	} catch { /* silently skip */ }
	loading.value[type] = false
}

// Fetch every tab once on mount to keep switching instant
onMounted(() => LIST_TYPES.forEach(fetchList))

async function addNewItem() {
	if (!newItem.value.trim()) return
	addLoading.value = true
	try {
		const data = await addItem(activeTab.value, newItem.value.trim())
		// replace the array instead of `.push`-ing in place. ListContainer keeps
		// its own `localItems` copy for drag-and-drop, synced via a *shallow*
		// watcher on the `items` prop. a shallow watcher only fires when the
		// prop reference changes, not when its contents mutate, so `.push`
		// mutating the same array in place meant the new item never reached
		// `localItems` until switching tabs forced a reference change (a
		// different list's array, then back). spreading into a new array gives
		// the watcher a genuinely new reference, so the item shows up on the
		// active tab right away and we don't need to switch tabs to see it.
		lists.value[activeTab.value] = [...lists.value[activeTab.value], data?.item ?? data]
		newItem.value = ''
	} catch { /* silently skip */ } finally {
		addLoading.value = false
	}
}

function onUpdated(updated) {
	const idx = lists.value[activeTab.value].findIndex((i) => i.id === updated.id)
	if (idx !== -1) lists.value[activeTab.value][idx] = updated
}

function onDeleted(id) {
	lists.value[activeTab.value] = lists.value[activeTab.value].filter((i) => i.id !== id)
}
</script>

<template>
	<main class="lists-page">
		<div class="page-watermark" aria-hidden="true">≡</div>
		<h1 class="lists-page__title">our lists</h1>

		<!-- Tab bar -->
		<div class="lists-tabs" role="tablist">
			<button
				v-for="type in LIST_TYPES"
				:key="type"
				role="tab"
				:aria-selected="activeTab === type"
				:class="['lists-tab', { 'lists-tab--active': activeTab === type }]"
				@click="activeTab = type"
			>
				{{ type }}
			</button>
		</div>

		<!-- List content -->
		<div class="lists-content">
			<div v-if="loading[activeTab]" class="lists-loading">loading…</div>
			<ListContainer
				v-else
				:type="activeTab"
				:items="lists[activeTab]"
				@updated="onUpdated"
				@deleted="onDeleted"
			/>

			<p v-if="!loading[activeTab] && !lists[activeTab].length" class="lists-empty">
				nothing here yet — add the first item
			</p>
		</div>

		<!-- New item input -->
		<form class="lists-add" @submit.prevent="addNewItem">
			<input
				v-model="newItem"
				class="lists-add__input"
				:placeholder="`add to ${activeTab} list`"
				type="text"
				maxlength="200"
			/>
			<BaseButton type="submit" variant="primary" :loading="addLoading">add</BaseButton>
		</form>
	</main>
</template>

<style scoped>
.lists-page {
	padding:        var(--space-6) var(--space-4) calc(var(--space-20) + env(safe-area-inset-bottom));
	position:       relative;
	z-index:        1;
	max-width:      760px;
	margin:         0 auto;
	display:        flex;
	flex-direction: column;
	min-height:     100dvh;
}

@media (min-width: 768px) {
	.lists-page {
		margin-left:  max(var(--sidebar-w), calc((100vw - 760px) / 2));
		margin-right: auto;
		padding-top:  var(--space-8);
		/* without this, width:100% + margin-left overflows the right edge on narrow tablets */
		max-width:    min(760px, calc(100vw - var(--sidebar-w)));
	}
}

.lists-page__title {
	margin:      0 0 var(--space-5);
	font-family: var(--font-heading);
	font-size:   var(--text-2xl);
	font-weight: 800;
	color:       var(--text-primary);
}

.lists-tabs {
	display:       flex;
	gap:           0;
	margin-bottom: var(--space-5);
	border-bottom: 2px solid var(--border-subtle);
}

.lists-tab {
	padding:        var(--space-2) var(--space-4);
	background:     transparent;
	border:         none;
	border-bottom:  2px solid transparent;
	margin-bottom: -2px;
	font-family:    var(--font-heading);
	font-size:      var(--text-sm);
	font-weight:    600;
	color:          var(--text-muted);
	cursor:         pointer;
	transition:     color var(--duration-fast), border-color var(--duration-fast);
	text-transform: lowercase;
}
.lists-tab--active {
	color:        var(--accent-warm);
	border-color: var(--accent-warm);
}

.lists-content {
	flex: 1;
}

.lists-loading,
.lists-empty {
	font-family: var(--font-body);
	font-size:   var(--text-sm);
	color:       var(--text-muted);
	padding:     var(--space-6) 0;
}

/* Sticky add-item bar at the bottom of the content area */
.lists-add {
	position:      sticky;
	bottom:        calc(56px + env(safe-area-inset-bottom, 0px)); /* above mobile nav */
	background:    var(--surface-base);
	padding:       var(--space-3) 0;
	display:       flex;
	gap:           var(--space-2);
	border-top:    1px solid var(--border-subtle);
}

@media (min-width: 768px) {
	.lists-add { bottom: 0; }
}

.lists-add__input {
	flex:          1;
	min-height:    44px;
	padding:       0 var(--space-3);
	background:    var(--surface-raised);
	color:         var(--text-primary);
	border:        1px solid var(--border-subtle);
	border-radius: var(--radius-md);
	font-family:   var(--font-body);
	font-size:     var(--text-sm);
	outline:       none;
	transition:    border-color var(--duration-fast);
}
.lists-add__input:focus { border-color: var(--accent-warm); }
.lists-add__input::placeholder { color: var(--text-muted); }
</style>
