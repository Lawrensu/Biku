<script setup>
// MemoryMap is ALWAYS dynamically imported — never included in the initial bundle.
// Leaflet + OSM tiles, pins from /api/memories/map.
import { onMounted, onUnmounted, ref } from 'vue'
import { useRouter }                   from 'vue-router'
import { getMapMemories }              from '../../services/memory.service.js'

const mapEl   = ref(null)
const router  = useRouter()
let   map     = null
let   L       = null

onMounted(async () => {
	// Leaflet is a large dependency — import dynamically so it never ends up
	// in the main bundle (this component is already lazy-loaded by MapView).
	L = (await import('leaflet')).default
	await import('leaflet/dist/leaflet.css')

	// Fix Leaflet's default icon paths when bundled through Vite
	delete L.Icon.Default.prototype._getIconUrl
	L.Icon.Default.mergeOptions({
		iconUrl:      new URL('leaflet/dist/images/marker-icon.png',    import.meta.url).href,
		iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href,
		shadowUrl:    new URL('leaflet/dist/images/marker-shadow.png',  import.meta.url).href,
	})

	map = L.map(mapEl.value).setView([0, 0], 2)

	L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
		attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
		maxZoom:     19,
	}).addTo(map)

	// Load memory pins
	try {
		const data = await getMapMemories()
		const memories = data?.memories ?? []

		if (!memories.length) return

		const bounds = []

		for (const memory of memories) {
			if (memory.lat == null || memory.lng == null) continue

			const marker = L.marker([memory.lat, memory.lng]).addTo(map)

			// Popup: title + "view memory" link that navigates via Vue Router
			const popupDiv = document.createElement('div')
			popupDiv.innerHTML = `
				<strong style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 13px;">
					${memory.title}
				</strong>
				<br/>
				<a href="#" data-id="${memory.id}"
				   style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12px; color: #5C0403;">
					view memory →
				</a>
			`
			popupDiv.querySelector('a').addEventListener('click', (e) => {
				e.preventDefault()
				router.push(`/memories/${memory.id}`)
			})

			marker.bindPopup(popupDiv)
			bounds.push([memory.lat, memory.lng])
		}

		// Fit the map to show all pins
		if (bounds.length) map.fitBounds(bounds, { padding: [40, 40] })
	} catch {
		// If the memories endpoint fails, just leave the empty map — no crash
	}
})

onUnmounted(() => {
	if (map) { map.remove(); map = null }
})
</script>

<template>
	<div ref="mapEl" class="memory-map" />
</template>

<style scoped>
.memory-map {
	width:  100%;
	height: 100%;
	/* Leaflet CSS requires a non-zero height on the container element */
	min-height: 400px;
}
</style>
