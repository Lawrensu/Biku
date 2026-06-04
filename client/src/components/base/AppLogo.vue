<script setup>
defineProps({
	// 'full' shows the heart icon + "biku" wordmark side by side
	// 'icon' shows only the heart mark (for collapsed sidebar, favicon contexts)
	// 'wordmark' shows only the text
	variant: {
		type:    String,
		default: 'full',
		validator: (v) => ['full', 'icon', 'wordmark'].includes(v),
	},
	// Size in pixels applied to the icon mark
	size: {
		type:    Number,
		default: 24,
	},
})
</script>

<template>
	<span class="app-logo" :class="`app-logo--${variant}`" aria-label="biku">

		<!-- Heart mark SVG — inline so it inherits colour context -->
		<svg
			v-if="variant !== 'wordmark'"
			:width="size"
			:height="size"
			viewBox="0 0 32 32"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			aria-hidden="true"
			class="app-logo__mark"
		>
			<path
				d="M16 26C16 26 5 18.5 5 12C5 9.24 7.24 7 10 7C11.88 7 13.54 8.04 14.44 9.6L16 12L17.56 9.6C18.46 8.04 20.12 7 22 7C24.76 7 27 9.24 27 12C27 18.5 16 26 16 26Z"
				fill="#EDB1B0"
			/>
			<circle cx="16" cy="13" r="2.5" fill="#5C0403" opacity="0.15"/>
		</svg>

		<!-- Wordmark — Plus Jakarta Sans, lowercase, tracking-wide -->
		<span v-if="variant !== 'icon'" class="app-logo__wordmark">
			biku
		</span>

	</span>
</template>

<style scoped>
.app-logo {
	display:     inline-flex;
	align-items: center;
	gap:         var(--space-3);  /* was space-2 — more breathing room at larger scale */
	user-select: none;
}

.app-logo__wordmark {
	font-family:    var(--font-heading);
	font-weight:    500;
	letter-spacing: 0.01em;
	color:          var(--text-primary);
	line-height:    1;
}

/*
	Full variant: wordmark is a fixed, prominent size — decoupled from the icon
	size so it reads clearly regardless of how the icon is scaled.
	Previously: calc(size * 0.65px) which gave ~15.6px at size=24 — too small.
*/
.app-logo--full .app-logo__wordmark {
	font-size: var(--text-xl);   /* 20px — readable, confident, but not overpowering */
}

/* Wordmark-only variant follows the icon size for flexibility */
.app-logo--wordmark .app-logo__wordmark {
	font-size: calc(v-bind(size) * 0.8px);
}
</style>
