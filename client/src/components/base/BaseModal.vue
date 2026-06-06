<script setup>
import { onMounted, onUnmounted } from 'vue'

const props = defineProps({
	open:  { type: Boolean, required: true },
	title: { type: String,  default: '' },
})

const emit = defineEmits(['close'])

function close() { emit('close') }

// close on escape, but only while the modal is actually open
function onKeydown(e) {
	if (e.key === 'Escape' && props.open) close()
}

onMounted(()  => document.addEventListener('keydown', onKeydown))
onUnmounted(() => document.removeEventListener('keydown', onKeydown))
</script>

<template>
	<!-- Teleported to <body> so it always sits above all other stacking contexts -->
	<Teleport to="body">
		<Transition name="modal">
			<div v-if="open" class="modal-backdrop" @click.self="close">
				<div class="modal" role="dialog" :aria-modal="true" :aria-label="title">
					<div v-if="title" class="modal__header">
						<h2 class="modal__title">{{ title }}</h2>
						<button class="modal__close" aria-label="close" @click="close">✕</button>
					</div>

					<div class="modal__body">
						<slot />
					</div>

					<div v-if="$slots.footer" class="modal__footer">
						<slot name="footer" />
					</div>
				</div>
			</div>
		</Transition>
	</Teleport>
</template>

<style scoped>
.modal-backdrop {
	position:        fixed;
	inset:           0;
	z-index:         200;
	display:         flex;
	align-items:     center;
	justify-content: center;
	padding:         var(--space-4);
	background:      rgba(27, 28, 32, 0.6);
	backdrop-filter: blur(4px);
}

.modal {
	width:            100%;
	max-width:        480px;
	max-height:       90vh;
	overflow-y:       auto;
	background:       var(--surface-card);
	border:           1px solid var(--border-subtle);
	border-radius:    var(--radius-lg);
	box-shadow:       0 8px 40px rgba(27, 28, 32, 0.18);
}

.modal__header {
	display:         flex;
	align-items:     center;
	justify-content: space-between;
	padding:         var(--space-5) var(--space-6) var(--space-4);
	border-bottom:   1px solid var(--border-subtle);
}

.modal__title {
	margin:      0;
	font-family: var(--font-heading);
	font-size:   var(--text-lg);
	font-weight: 700;
	color:       var(--text-primary);
}

.modal__close {
	display:         flex;
	align-items:     center;
	justify-content: center;
	width:           32px;
	height:          32px;
	background:      transparent;
	border:          none;
	border-radius:   var(--radius-sm);
	color:           var(--text-muted);
	font-size:       var(--text-sm);
	cursor:          pointer;
	transition:      background var(--duration-fast) var(--ease-tender);
}
.modal__close:hover {
	background: var(--surface-raised);
	color:      var(--text-primary);
}
.modal__close:focus-visible {
	outline:        2px solid var(--focus-ring);
	outline-offset: 2px;
}

.modal__body {
	padding: var(--space-6);
}

.modal__footer {
	padding:      var(--space-4) var(--space-6) var(--space-5);
	border-top:   1px solid var(--border-subtle);
	display:      flex;
	gap:          var(--space-3);
	justify-content: flex-end;
}

/* ── Transition: fade + scale 0.96→1.0 using ease-enter ──────────────────── */

.modal-enter-active,
.modal-leave-active {
	transition: opacity var(--duration-normal) var(--ease-enter);
}
.modal-enter-active .modal,
.modal-leave-active .modal {
	transition: transform var(--duration-normal) var(--ease-enter);
}

.modal-enter-from,
.modal-leave-to {
	opacity: 0;
}
.modal-enter-from .modal {
	transform: scale(0.96);
}
.modal-leave-to .modal {
	transform: scale(0.96);
}
</style>
