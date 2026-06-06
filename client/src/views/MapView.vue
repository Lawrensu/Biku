<script setup>
import { defineAsyncComponent } from 'vue'

// MemoryMap uses Leaflet, so it's dynamically imported and never lands in the initial bundle
const MemoryMap = defineAsyncComponent(() => import('../components/memory/MemoryMap.vue'))
</script>

<template>
	<div class="map-view">
		<Suspense>
			<MemoryMap />
			<template #fallback>
				<div class="map-view__loading">loading map…</div>
			</template>
		</Suspense>
	</div>
</template>

<style scoped>
.map-view {
	position:  fixed;
	/* Stretch to fill below the sidebar on tablet/desktop, below status bar on mobile */
	top:       0;
	left:      0;
	right:     0;
	bottom:    0;
	z-index:   1;
}

@media (min-width: 768px)  { .map-view { left: 64px;  } }
@media (min-width: 1024px) { .map-view { left: 200px; } }
@media (min-width: 1280px) { .map-view { left: 240px; } }

.map-view__loading {
	display:         flex;
	align-items:     center;
	justify-content: center;
	height:          100%;
	font-family:     var(--font-body);
	color:           var(--text-muted);
}
</style>
