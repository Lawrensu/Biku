<script setup>
defineProps({
	variant: {
		type:    String,
		default: 'primary',
		// primary | secondary | ghost | danger
	},
	disabled: {
		type:    Boolean,
		default: false,
	},
	loading: {
		type:    Boolean,
		default: false,
	},
	type: {
		type:    String,
		default: 'button',
	},
})
</script>

<template>
	<button
		:type="type"
		:disabled="disabled || loading"
		:class="['btn', `btn--${variant}`, { 'btn--loading': loading }]"
	>
		<!-- Spinner replaces slot content while loading -->
		<span v-if="loading" class="btn__spinner" aria-hidden="true" />
		<span v-else class="btn__label">
			<slot />
		</span>
	</button>
</template>

<style scoped>
.btn {
	display:         inline-flex;
	align-items:     center;
	justify-content: center;
	gap:             var(--space-2);
	min-height:      44px;          /* WCAG touch target */
	padding:         0 var(--space-5);
	border:          none;
	border-radius:   var(--radius-md);
	font-family:     var(--font-heading);
	font-size:       var(--text-sm);
	font-weight:     600;
	cursor:          pointer;
	transition:
		background var(--duration-fast) var(--ease-tender),
		opacity     var(--duration-fast) var(--ease-tender),
		transform   var(--duration-fast) var(--ease-tender);
	user-select:     none;
	white-space:     nowrap;
}

.btn:focus-visible {
	outline:        2px solid var(--focus-ring);
	outline-offset: 2px;
}

.btn:disabled {
	opacity: 0.45;
	cursor:  not-allowed;
}

.btn:not(:disabled):active {
	transform: scale(0.97);
}

/* ── Variants ─────────────────────────────────────────────────────────────── */

.btn--primary {
	background: var(--btn-primary-bg);
	color:      var(--btn-primary-text);
}
.btn--primary:not(:disabled):hover {
	background: var(--btn-primary-hover);
}

.btn--secondary {
	background: var(--surface-raised);
	color:      var(--text-primary);
	border:     1px solid var(--border-subtle);
}
.btn--secondary:not(:disabled):hover {
	background: var(--surface-card);
}

.btn--ghost {
	background: transparent;
	color:      var(--text-secondary);
}
.btn--ghost:not(:disabled):hover {
	background: var(--surface-raised);
	color:      var(--text-primary);
}

.btn--danger {
	background: var(--error-bg);
	color:      var(--error-text);
	border:     1px solid var(--error-border);
}
.btn--danger:not(:disabled):hover {
	background: var(--color-cherry-tint, #f5e8e8);
}

/* ── Loading spinner ──────────────────────────────────────────────────────── */

.btn__spinner {
	display:       block;
	width:         16px;
	height:        16px;
	border:        2px solid currentColor;
	border-top-color: transparent;
	border-radius: 50%;
	animation:     btn-spin 0.6s linear infinite;
}

@keyframes btn-spin {
	to { transform: rotate(360deg); }
}
</style>
