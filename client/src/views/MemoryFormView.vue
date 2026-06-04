<script setup>
import { ref, reactive, watch } from 'vue'
import { useRouter }         from 'vue-router'
import { createMemory }      from '../services/memory.service.js'
import { searchUnsplash }    from '../services/proxy.service.js'
import BaseInput             from '../components/base/BaseInput.vue'
import BaseButton            from '../components/base/BaseButton.vue'

const router = useRouter()

// reactive (not ref) — no .value needed in script or template
const form = reactive({
	title:    '',
	note:     '',
	date:     new Date().toISOString().slice(0, 10),
	location: '',
	imageUrl: '',
	lat:      null,
	lng:      null,
})

// ── Unsplash image search — debounced 400ms on title change ──────────────────
const images         = ref([])
const searchLoading  = ref(false)
let   debounceTimer  = null

watch(() => form.title, (title) => {
	clearTimeout(debounceTimer)
	images.value = []
	if (title.trim().length < 3) return
	debounceTimer = setTimeout(async () => {
		searchLoading.value = true
		try {
			const data = await searchUnsplash(title)
			images.value = data?.images ?? []
		} catch { /* skip */ }
		searchLoading.value = false
	}, 400)
})

// ── Geolocation ──────────────────────────────────────────────────────────────
const geoLoading = ref(false)
const geoError   = ref('')

function getLocation() {
	if (!navigator.geolocation) { geoError.value = 'geolocation not available'; return }
	geoLoading.value = true
	geoError.value   = ''
	navigator.geolocation.getCurrentPosition(
		(pos) => {
			form.lat = pos.coords.latitude
			form.lng = pos.coords.longitude
			geoLoading.value = false
		},
		() => {
			geoError.value   = 'could not get your location'
			geoLoading.value = false
		},
	)
}

// ── Submit ────────────────────────────────────────────────────────────────────
const submitLoading = ref(false)
const submitError   = ref('')

async function submit() {
	if (!form.title.trim()) { submitError.value = 'title is required'; return }
	submitError.value  = ''
	submitLoading.value = true
	try {
		const payload = {
			title:    form.title.trim(),
			note:     form.note.trim() || undefined,
			date:     form.date,
			location: form.location.trim() || undefined,
			image_url: form.imageUrl || undefined,
			lat:      form.lat ?? undefined,
			lng:      form.lng ?? undefined,
		}
		const data = await createMemory(payload)
		router.push(`/memories/${data.memory.id}`)
	} catch (e) {
		submitError.value = e.message || 'could not save memory'
	} finally {
		submitLoading.value = false
	}
}
</script>

<template>
	<main class="memory-form-page">
		<header class="memory-form-page__header">
			<button class="memory-form-page__back btn btn--ghost" @click="router.back()">← back</button>
			<h1 class="memory-form-page__title">add a memory</h1>
		</header>

		<form class="memory-form-page__form" @submit.prevent="submit">
			<BaseInput id="mem-title" v-model="form.title" label="title" placeholder="what do you want to remember?" />

			<!-- Unsplash image picker — appears after typing 3+ chars in title -->
			<div v-if="images.length || searchLoading" class="mem-images">
				<p class="mem-images__label">pick a cover photo</p>
				<div v-if="searchLoading" class="mem-images__loading">searching…</div>
				<div class="mem-images__grid">
					<button
						v-for="img in images"
						:key="img.url"
						type="button"
						:class="['mem-images__item', { 'mem-images__item--selected': form.imageUrl === img.url }]"
						@click="form.imageUrl = form.imageUrl === img.url ? '' : img.url"
					>
						<img :src="img.thumb_url || img.url" :alt="img.author" />
						<span class="mem-images__credit">{{ img.author }}</span>
					</button>
				</div>
			</div>

			<BaseInput id="mem-date"     v-model="form.date"     label="date"     type="date" />
			<BaseInput id="mem-location" v-model="form.location" label="location" placeholder="where were you?" />

			<!-- Geolocation capture -->
			<div class="mem-geo">
				<BaseButton type="button" variant="secondary" :loading="geoLoading" @click="getLocation">
					{{ form.lat ? '📍 location captured' : 'capture my location' }}
				</BaseButton>
				<p v-if="geoError" class="mem-geo__error">{{ geoError }}</p>
			</div>

			<div class="mem-note-wrap">
				<label for="mem-note" class="mem-note__label">note</label>
				<textarea id="mem-note" v-model="form.note" class="mem-note" placeholder="any details to remember…" rows="4" />
			</div>

			<p v-if="submitError" class="mem-error">{{ submitError }}</p>

			<BaseButton type="submit" variant="primary" :loading="submitLoading">save memory</BaseButton>
		</form>
	</main>
</template>

<style scoped>
.memory-form-page {
	padding:   var(--space-6) var(--space-4) calc(var(--space-16) + env(safe-area-inset-bottom));
	max-width: 640px;
	margin:    0 auto;
}

@media (min-width: 768px)  { .memory-form-page { margin-left: 64px;  padding-top: var(--space-8); } }
@media (min-width: 1024px) { .memory-form-page { margin-left: 200px; } }
@media (min-width: 1280px) { .memory-form-page { margin-left: 240px; max-width: 760px; } }

.memory-form-page__header {
	margin-bottom: var(--space-6);
	display:       flex;
	flex-direction: column;
	gap:           var(--space-2);
}

.memory-form-page__back {
	align-self: flex-start;
	padding:    0;
}

.memory-form-page__title {
	margin:      0;
	font-family: var(--font-heading);
	font-size:   var(--text-2xl);
	font-weight: 800;
	color:       var(--text-primary);
}

.memory-form-page__form {
	display:        flex;
	flex-direction: column;
	gap:            var(--space-5);
}

/* Unsplash image picker */
.mem-images__label {
	margin:      0 0 var(--space-2);
	font-family: var(--font-heading);
	font-size:   var(--text-sm);
	font-weight: 600;
	color:       var(--text-primary);
}
.mem-images__loading {
	font-family: var(--font-body);
	font-size:   var(--text-sm);
	color:       var(--text-muted);
}
.mem-images__grid {
	display:               grid;
	grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
	gap:                   var(--space-2);
}
.mem-images__item {
	position:      relative;
	border:        2px solid transparent;
	border-radius: var(--radius-md);
	overflow:      hidden;
	cursor:        pointer;
	padding:       0;
	background:    none;
}
.mem-images__item--selected { border-color: var(--accent-warm); }
.mem-images__item img {
	width:       100%;
	aspect-ratio: 1;
	object-fit:  cover;
	display:     block;
}
.mem-images__credit {
	position:    absolute;
	bottom:      0;
	left:        0;
	right:       0;
	background:  rgba(27,28,32,0.55);
	color:       #fff;
	font-size:   9px;
	font-family: var(--font-heading);
	padding:     2px 4px;
	white-space: nowrap;
	overflow:    hidden;
	text-overflow: ellipsis;
}

/* Geo */
.mem-geo { display: flex; flex-direction: column; gap: var(--space-1); }
.mem-geo__error { margin: 0; font-size: var(--text-xs); color: var(--error-text); }

/* Note textarea */
.mem-note__label {
	display:     block;
	font-family: var(--font-heading);
	font-size:   var(--text-sm);
	font-weight: 600;
	color:       var(--text-primary);
	margin-bottom: var(--space-1);
}
.mem-note {
	width:         100%;
	padding:       var(--space-3);
	background:    var(--surface-raised);
	color:         var(--text-primary);
	border:        1px solid var(--border-subtle);
	border-radius: var(--radius-md);
	font-family:   var(--font-body);
	font-size:     var(--text-sm);
	resize:        vertical;
	outline:       none;
	transition:    border-color var(--duration-fast) var(--ease-tender);
}
.mem-note:focus { border-color: var(--accent-warm); }
.mem-note::placeholder { color: var(--text-muted); }

.mem-error {
	margin:      0;
	font-size:   var(--text-xs);
	color:       var(--error-text);
	font-family: var(--font-heading);
}
</style>
