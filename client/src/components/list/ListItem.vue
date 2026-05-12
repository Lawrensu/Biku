<script setup>
import { ref } from 'vue'
import { updateItem, deleteItem } from '../../services/list.service.js'
import { GripVertical, Trash2, Check } from 'lucide-vue-next'

const props = defineProps({
	item:     { type: Object,  required: true },
	dragHandle: { type: Boolean, default: true },
})

const emit = defineEmits(['updated', 'deleted'])

const editing    = ref(false)
const editText   = ref(props.item.content)
const loading    = ref(false)

async function toggleCheck() {
	loading.value = true
	try {
		await updateItem(props.item.id, { is_checked: !props.item.is_checked })
		emit('updated', { ...props.item, is_checked: !props.item.is_checked })
	} finally {
		loading.value = false
	}
}

async function saveEdit() {
	if (!editText.value.trim()) { editing.value = false; return }
	loading.value = true
	try {
		await updateItem(props.item.id, { content: editText.value.trim() })
		emit('updated', { ...props.item, content: editText.value.trim() })
		editing.value = false
	} finally {
		loading.value = false
	}
}

async function remove() {
	loading.value = true
	try {
		await deleteItem(props.item.id)
		emit('deleted', props.item.id)
	} finally {
		loading.value = false
	}
}

function onKeydown(e) {
	if (e.key === 'Enter')  saveEdit()
	if (e.key === 'Escape') { editing.value = false; editText.value = props.item.content }
}
</script>

<template>
	<li class="list-item">
		<!-- Drag handle — visible, used by vue-draggable-plus -->
		<span v-if="dragHandle" class="list-item__drag" title="drag to reorder">
			<GripVertical :size="16" />
		</span>

		<!-- Checkbox -->
		<button
			class="list-item__check"
			:class="{ 'list-item__check--done': item.is_checked }"
			:aria-label="item.is_checked ? 'mark incomplete' : 'mark complete'"
			:disabled="loading"
			@click="toggleCheck"
		>
			<Check v-if="item.is_checked" :size="14" />
		</button>

		<!-- Content — click to edit inline -->
		<span
			v-if="!editing"
			class="list-item__content"
			:class="{ 'list-item__content--done': item.is_checked }"
			@click="editing = true; editText = item.content"
		>
			{{ item.content }}
		</span>
		<input
			v-else
			v-model="editText"
			class="list-item__edit-input"
			autofocus
			@blur="saveEdit"
			@keydown="onKeydown"
		/>

		<!-- Delete -->
		<button class="list-item__delete" aria-label="delete item" :disabled="loading" @click="remove">
			<Trash2 :size="15" />
		</button>
	</li>
</template>

<style scoped>
.list-item {
	display:     flex;
	align-items: center;
	gap:         var(--space-2);
	padding:     var(--space-2) 0;
	border-bottom: 1px solid var(--border-subtle);
}
.list-item:last-child { border-bottom: none; }

.list-item__drag {
	color:  var(--text-muted);
	cursor: grab;
	flex-shrink: 0;
	display: flex;
	align-items: center;
}

.list-item__check {
	width:           24px;
	height:          24px;
	flex-shrink:     0;
	display:         flex;
	align-items:     center;
	justify-content: center;
	background:      transparent;
	border:          1.5px solid var(--border-subtle);
	border-radius:   var(--radius-sm);
	cursor:          pointer;
	transition:      background var(--duration-fast) var(--ease-tender),
	                 border-color var(--duration-fast) var(--ease-tender);
}
.list-item__check--done {
	background:   var(--accent-warm);
	border-color: var(--accent-warm);
	color:        var(--color-cherry);
}

.list-item__content {
	flex:        1;
	font-family: var(--font-body);
	font-size:   var(--text-sm);
	color:       var(--text-primary);
	cursor:      text;
	word-break:  break-word;
}
.list-item__content--done {
	text-decoration: line-through;
	color:           var(--text-muted);
}

.list-item__edit-input {
	flex:          1;
	background:    transparent;
	border:        none;
	border-bottom: 1.5px solid var(--accent-warm);
	outline:       none;
	font-family:   var(--font-body);
	font-size:     var(--text-sm);
	color:         var(--text-primary);
	padding:       0;
}

.list-item__delete {
	flex-shrink: 0;
	display:     flex;
	align-items: center;
	background:  transparent;
	border:      none;
	color:       var(--text-muted);
	cursor:      pointer;
	padding:     var(--space-1);
	border-radius: var(--radius-sm);
	transition:  color var(--duration-fast) var(--ease-tender);
}
.list-item__delete:hover { color: var(--error-text); }
</style>
