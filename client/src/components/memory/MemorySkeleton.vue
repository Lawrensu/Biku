<template>
	<div class="memory-skeleton card" aria-hidden="true">
		<div class="memory-skeleton__cover shimmer" />
		<div class="memory-skeleton__body">
			<div class="memory-skeleton__title shimmer" />
			<div class="memory-skeleton__meta shimmer" />
		</div>
	</div>
</template>

<style scoped>
.memory-skeleton {
	padding:  0;
	overflow: hidden;
}

.memory-skeleton__cover {
	aspect-ratio: 16 / 9;
}

.memory-skeleton__body {
	padding: var(--space-4);
	display: flex;
	flex-direction: column;
	gap: var(--space-2);
}

.memory-skeleton__title {
	height:        18px;
	border-radius: var(--radius-sm);
	width:         75%;
}

.memory-skeleton__meta {
	height:        12px;
	border-radius: var(--radius-sm);
	width:         40%;
}

/* Shimmer keyframe animation */
.shimmer {
	background: linear-gradient(
		90deg,
		var(--surface-raised)   0%,
		var(--surface-card)     40%,
		var(--surface-raised)   80%
	);
	background-size: 200% 100%;
	animation: shimmer 1.4s ease-in-out infinite;
}

@keyframes shimmer {
	0%   { background-position:  200% 0; }
	100% { background-position: -200% 0; }
}

@media (prefers-reduced-motion: reduce) {
	.shimmer { animation: none; background: var(--surface-raised); }
}
</style>
