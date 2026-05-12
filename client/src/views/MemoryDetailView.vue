<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter }       from 'vue-router'
import { getMemory, deleteMemory }   from '../services/memory.service.js'
import { getWeather }                from '../services/proxy.service.js'
import BaseModal                     from '../components/base/BaseModal.vue'
import BaseButton                    from '../components/base/BaseButton.vue'

const route  = useRoute()
const router = useRouter()

const memory       = ref(null)
const weather      = ref(null)
const loading      = ref(true)
const deleteModal  = ref(false)
const deleteLoading = ref(false)
const error        = ref('')

const weatherCodes = {
	0: 'clear sky', 1: 'mainly clear', 2: 'partly cloudy', 3: 'overcast',
	45: 'foggy', 51: 'light drizzle', 61: 'light rain', 71: 'light snow',
	80: 'showers', 95: 'thunderstorm',
}

const weatherLabel = computed(() => {
	if (!weather.value) return ''
	const code = weatherCodes[weather.value.weatherCode] ?? `code ${weather.value.weatherCode}`
	return `${weather.value.tempMax}°C high · ${weather.value.tempMin}°C low · ${code}`
})

onMounted(async () => {
	loading.value = true
	try {
		const data = await getMemory(route.params.id)
		memory.value = data?.memory ?? null

		// Fetch weather if coordinates exist
		if (memory.value?.lat && memory.value?.lng && memory.value?.date) {
			try {
				const w = await getWeather(memory.value.lat, memory.value.lng, memory.value.date)
				weather.value = w?.weather ?? null
			} catch { /* weather is optional — no crash */ }
		}
	} catch (e) {
		error.value = e.message || 'memory not found'
	} finally {
		loading.value = false
	}
})

async function confirmDelete() {
	deleteLoading.value = true
	try {
		await deleteMemory(route.params.id)
		router.push('/memories')
	} catch (e) {
		error.value = e.message || 'could not delete'
		deleteModal.value = false
	} finally {
		deleteLoading.value = false
	}
}
</script>

<template>
	<main class="memory-detail">
		<div v-if="loading" class="memory-detail__loading">loading…</div>
		<p v-else-if="error" class="memory-detail__error">{{ error }}</p>

		<template v-else-if="memory">
			<!-- Cover image with Unsplash attribution overlay -->
			<div class="memory-detail__cover">
				<img
					v-if="memory.imageUrl || memory.image_url"
					:src="memory.imageUrl || memory.image_url"
					:alt="memory.title"
					class="memory-detail__cover-img"
				/>
				<div v-else class="memory-detail__cover-placeholder">♡</div>

				<!-- Attribution overlay (Unsplash requires attribution) -->
				<div v-if="memory.imageAuthor" class="memory-detail__attribution">
					photo by
					<a
						v-if="memory.imageAuthorUrl"
						:href="memory.imageAuthorUrl"
						target="_blank"
						rel="noopener noreferrer"
					>{{ memory.imageAuthor }}</a>
					<span v-else>{{ memory.imageAuthor }}</span>
					on <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer">Unsplash</a>
				</div>
			</div>

			<!-- Content -->
			<div class="memory-detail__body">
				<button class="btn btn--ghost memory-detail__back" @click="router.back()">← back</button>

				<h1 class="memory-detail__title">{{ memory.title }}</h1>

				<div class="memory-detail__meta">
					<span v-if="memory.date">
						{{ new Date(memory.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) }}
					</span>
					<span v-if="memory.location" class="memory-detail__location">· {{ memory.location }}</span>
				</div>

				<!-- Weather widget (only if coords + weather fetched) -->
				<div v-if="weatherLabel" class="memory-detail__weather card">
					<span class="memory-detail__weather-label">weather that day</span>
					<span class="memory-detail__weather-data">{{ weatherLabel }}</span>
				</div>

				<p v-if="memory.note" class="memory-detail__note">{{ memory.note }}</p>

				<div class="memory-detail__actions">
					<BaseButton variant="danger" @click="deleteModal = true">delete memory</BaseButton>
				</div>
			</div>
		</template>

		<!-- Delete confirmation modal -->
		<BaseModal :open="deleteModal" title="delete this memory?" @close="deleteModal = false">
			<p style="font-family: var(--font-body); color: var(--text-secondary); margin: 0;">
				this can't be undone. are you sure?
			</p>
			<template #footer>
				<BaseButton variant="secondary" @click="deleteModal = false">cancel</BaseButton>
				<BaseButton variant="danger" :loading="deleteLoading" @click="confirmDelete">delete</BaseButton>
			</template>
		</BaseModal>
	</main>
</template>

<style scoped>
.memory-detail {
	max-width: 800px;
	margin:    0 auto;
	padding-bottom: calc(var(--space-16) + env(safe-area-inset-bottom));
}

@media (min-width: 768px)  { .memory-detail { margin-left: calc(64px + var(--space-4)); } }
@media (min-width: 1024px) { .memory-detail { margin-left: calc(200px + var(--space-4)); } }

.memory-detail__loading,
.memory-detail__error {
	padding:     var(--space-8);
	font-family: var(--font-body);
	color:       var(--text-muted);
}

.memory-detail__cover {
	position:    relative;
	aspect-ratio: 16 / 7;
	background:  var(--surface-raised);
	overflow:    hidden;
}
.memory-detail__cover-img {
	width:   100%;
	height:  100%;
	object-fit: cover;
}
.memory-detail__cover-placeholder {
	width:           100%;
	height:          100%;
	display:         flex;
	align-items:     center;
	justify-content: center;
	font-size:       4rem;
	color:           var(--text-muted);
}
.memory-detail__attribution {
	position:    absolute;
	bottom:      0;
	right:       0;
	padding:     var(--space-2) var(--space-3);
	background:  rgba(27,28,32,0.5);
	font-family: var(--font-heading);
	font-size:   10px;
	color:       rgba(255,255,255,0.85);
}
.memory-detail__attribution a { color: #fff; }

.memory-detail__body {
	padding:        var(--space-6) var(--space-4);
	display:        flex;
	flex-direction: column;
	gap:            var(--space-4);
}

.memory-detail__back { align-self: flex-start; padding: 0; }

.memory-detail__title {
	margin:      0;
	font-family: var(--font-heading);
	font-size:   var(--text-3xl);
	font-weight: 800;
	color:       var(--text-primary);
}

.memory-detail__meta {
	font-family: var(--font-body);
	font-size:   var(--text-sm);
	color:       var(--text-muted);
}

.memory-detail__weather {
	display:     flex;
	gap:         var(--space-3);
	align-items: center;
	padding:     var(--space-3) var(--space-4);
}
.memory-detail__weather-label {
	font-family: var(--font-heading);
	font-size:   var(--text-xs);
	font-weight: 600;
	color:       var(--text-muted);
	white-space: nowrap;
}
.memory-detail__weather-data {
	font-family: var(--font-body);
	font-size:   var(--text-sm);
	color:       var(--text-primary);
}

.memory-detail__note {
	margin:      0;
	font-family: var(--font-body);
	font-size:   var(--text-base);
	color:       var(--text-secondary);
	line-height: 1.7;
	white-space: pre-wrap;
}

.memory-detail__actions {
	display:    flex;
	gap:        var(--space-3);
	margin-top: var(--space-4);
}
</style>
