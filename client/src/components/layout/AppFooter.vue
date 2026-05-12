<template>
	<footer class="app-footer">
		<span class="app-footer__text">biku &copy; {{ year }}</span>
	</footer>
</template>

<script setup>
const year = new Date().getFullYear()
</script>

<style scoped>
.app-footer {
	display:         flex;
	align-items:     center;
	justify-content: center;
	padding:         var(--space-6) var(--space-4);
	border-top:      1px solid var(--border-subtle);
}

.app-footer__text {
	font-family: var(--font-heading);
	font-size:   var(--text-xs);
	color:       var(--text-muted);
}

/* hidden on mobile — only shown on tablet+ */
@media (max-width: 767px) {
	.app-footer { display: none; }
}
</style>
