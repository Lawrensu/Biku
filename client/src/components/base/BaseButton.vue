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

<style>
/*
	Base .btn styles live in main.css (global) so RouterLink / <a> / <button>
	elements throughout the app can use btn classes without this wrapper.
	Only the spinner — which is exclusive to BaseButton — is defined here.
*/
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
