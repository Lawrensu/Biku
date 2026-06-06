<script setup>
import { ref, reactive, watch } from 'vue'
import { useRouter }            from 'vue-router'
import { createMemory }         from '../services/memory.service.js'
import { searchUnsplash, geocodePlace } from '../services/proxy.service.js'
import BaseInput                from '../components/base/BaseInput.vue'
import BaseButton               from '../components/base/BaseButton.vue'

const router = useRouter()

// reactive, not ref, so we don't need .value anywhere in script or template
const form = reactive({
	title:    '',
	note:     '',
	date:     new Date().toISOString().slice(0, 10),
	location: '',
	imageUrl: '',
	lat:      null,
	lng:      null,
})

// unsplash image search, debounced 400ms on title change
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

// place search via Nominatim geocoding
// debounced 500ms, since Nominatim's terms of service cap us at 1 request/sec
const geoResults      = ref([])
const geoSearchActive = ref(false)  // true while dropdown is open
let   geoTimer        = null

watch(() => form.location, (val) => {
	clearTimeout(geoTimer)
	geoResults.value = []
	if (!val || val.trim().length < 3) return
	geoTimer = setTimeout(async () => {
		try {
			const data = await geocodePlace(val.trim())
			geoResults.value = data?.results ?? []
		} catch { /* not a big deal, location is optional anyway */ }
	}, 500)
})

function selectPlace(result) {
	// Setting location triggers the watcher, so we must clear timer + results
	// BEFORE assigning to avoid an immediate re-search on the chosen display name.
	clearTimeout(geoTimer)
	form.location    = result.name
	form.lat         = result.lat
	form.lng         = result.lng
	geoResults.value = []
}

function clearPlace() {
	form.lat = null
	form.lng = null
}

// ── GPS fallback ─────────────────────────────────────────────────────────────
const geoLoading = ref(false)
const geoError   = ref('')

function getLocation() {
	if (!navigator.geolocation) { geoError.value = 'geolocation not available'; return }
	geoLoading.value = true
	geoError.value   = ''
	navigator.geolocation.getCurrentPosition(
		(pos) => {
			form.lat         = pos.coords.latitude
			form.lng         = pos.coords.longitude
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
		// the backend schema wants memory_date (required), description, location_name,
		// not date/note/location like the form fields are named
		const payload = {
			title:         form.title.trim(),
			description:   form.note.trim() || undefined,
			memory_date:   form.date,
			location_name: form.location.trim() || undefined,
			image_url:     form.imageUrl || undefined,
			lat:           form.lat ?? undefined,
			lng:           form.lng ?? undefined,
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
		<div class="page-watermark" aria-hidden="true">✦</div>
		<header class="memory-form-page__header">
			<button class="memory-form-page__back btn btn--ghost" @click="router.back()">← back</button>
			<h1 class="memory-form-page__title">add a memory</h1>
		</header>

		<form class="memory-form-page__form" @submit.prevent="submit">
			<BaseInput id="mem-title" v-model="form.title" label="title" placeholder="what do you want to remember?" />

			<!-- unsplash image picker, appears once you've typed 3+ chars in the title -->
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
			<!-- Location search: type a place name → Nominatim dropdown → auto-fills lat/lng -->
			<div class="mem-location-wrap">
				<BaseInput
					id="mem-location"
					v-model="form.location"
					label="location"
					placeholder="search for a place…"
					:helper="form.lat ? `coordinates captured (${form.lat.toFixed(4)}, ${form.lng.toFixed(4)})` : ''"
					autocomplete="off"
					@focus="geoResults = []"
				/>
				<!-- Dropdown results from Nominatim -->
				<ul v-if="geoResults.length" class="mem-geo-results" role="listbox">
					<li
						v-for="r in geoResults"
						:key="`${r.lat},${r.lng}`"
						class="mem-geo-result"
						role="option"
						tabindex="0"
						@click="selectPlace(r)"
						@keydown.enter.prevent="selectPlace(r)"
					>
						<span class="mem-geo-result__name">{{ r.name }}</span>
						<span class="mem-geo-result__detail">{{ r.displayName }}</span>
					</li>
				</ul>
			</div>

			<!-- GPS fallback, still available alongside the place search -->
			<div class="mem-geo">
				<BaseButton type="button" variant="secondary" :loading="geoLoading" @click="getLocation">
					{{ form.lat ? 'location pinned ✦' : 'use my GPS location' }}
				</BaseButton>
				<button v-if="form.lat" type="button" class="mem-geo__clear" @click="clearPlace">clear</button>
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
	position:  relative;
	z-index:   1;
	max-width: 760px;
	margin:    0 auto;
}

@media (min-width: 768px) {
	.memory-form-page {
		margin-left:  max(var(--sidebar-w), calc((100vw - 760px) / 2));
		margin-right: auto;
		padding-top:  var(--space-8);
	}
}

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

/* Location search + dropdown */
.mem-location-wrap {
	position: relative;
}

.mem-geo-results {
	position:      absolute;
	top:           100%;
	left:          0;
	right:         0;
	z-index:       50;
	list-style:    none;
	margin:        var(--space-1) 0 0;
	padding:       var(--space-1) 0;
	background:    var(--surface-elevated);
	border:        1px solid var(--border-default);
	border-radius: var(--radius-md);
	box-shadow:    0 8px 24px rgba(27, 28, 32, 0.12);
	overflow:      hidden;
}

.mem-geo-result {
	display:        flex;
	flex-direction: column;
	gap:            2px;
	padding:        var(--space-3) var(--space-4);
	cursor:         pointer;
	transition:     background var(--duration-fast) var(--ease-tender);
}
.mem-geo-result:hover,
.mem-geo-result:focus {
	background:  var(--surface-raised);
	outline:     none;
}

.mem-geo-result__name {
	font-family: var(--font-heading);
	font-size:   var(--text-sm);
	font-weight: 600;
	color:       var(--text-primary);
}

.mem-geo-result__detail {
	font-family:   var(--font-body);
	font-size:     var(--text-xs);
	color:         var(--text-muted);
	white-space:   nowrap;
	overflow:      hidden;
	text-overflow: ellipsis;
}

/* Geo GPS row */
.mem-geo {
	display:     flex;
	align-items: center;
	gap:         var(--space-3);
	flex-wrap:   wrap;
}
.mem-geo__clear {
	font-family: var(--font-heading);
	font-size:   var(--text-xs);
	color:       var(--text-muted);
	background:  transparent;
	border:      none;
	cursor:      pointer;
	padding:     0;
	text-decoration: underline;
}
.mem-geo__clear:hover { color: var(--error-text); }
.mem-geo__error { margin: 0; font-size: var(--text-xs); color: var(--error-text); flex-basis: 100%; }

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
