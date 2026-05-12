<script setup>
import { ref, watch }   from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
import { reorderItems } from '../../services/list.service.js'
import ListItem         from './ListItem.vue'

const props = defineProps({
	// 'bucket' | 'grocery' | 'wishlist'
	type:  { type: String,  required: true },
	items: { type: Array,   default: () => [] },
})

const emit = defineEmits(['updated', 'deleted'])

// Local copy so we can mutate the order for drag-and-drop
const localItems = ref([...props.items])

// Keep in sync if parent re-fetches
watch(() => props.items, (val) => { localItems.value = [...val] })

// After drag completes, persist the new order to the backend in one PATCH
async function onDragEnd() {
	const orderedIds = localItems.value.map((i) => i.id)
	try {
		await reorderItems(props.type, orderedIds)
	} catch {
		// Revert optimistic reorder on failure
		localItems.value = [...props.items]
	}
}

function handleUpdated(updated) {
	const idx = localItems.value.findIndex((i) => i.id === updated.id)
	if (idx !== -1) localItems.value[idx] = updated
	emit('updated', updated)
}

function handleDeleted(id) {
	localItems.value = localItems.value.filter((i) => i.id !== id)
	emit('deleted', id)
}
</script>

<template>
	<VueDraggable
		v-model="localItems"
		tag="ul"
		handle=".list-item__drag"
		class="list-container"
		:animation="180"
		@end="onDragEnd"
	>
		<ListItem
			v-for="item in localItems"
			:key="item.id"
			:item="item"
			@updated="handleUpdated"
			@deleted="handleDeleted"
		/>
	</VueDraggable>
</template>

<style scoped>
.list-container {
	list-style: none;
	margin:     0;
	padding:    0;
}
</style>
