<script setup>
import { ref, reactive } from 'vue'
import { getIdea }       from '../services/randomiser.service.js'
import BaseButton        from '../components/base/BaseButton.vue'

const filters = reactive({ budget: '', category: '', max_duration: '' })
const idea    = ref(null)
const loading = ref(false)
const error   = ref('')
const spinning = ref(false)

// Budget maps to backend integers 1-3 (free / moderate / splurge)
const budgetOptions = [
	{ label: 'any',      value: ''  },
	{ label: 'free',     value: 1   },
	{ label: 'moderate', value: 2   },
	{ label: 'splurge',  value: 3   },
]

// Must match backend VALID_CATEGORIES enum exactly
const categoryOptions = ['', 'outdoor', 'indoor', 'food', 'adventure', 'cosy']

async function spin() {
	loading.value  = true
	spinning.value = true
	error.value    = ''
	idea.value     = null

	// Spin animation runs for at least 900ms for visual effect
	const minDelay = new Promise((r) => setTimeout(r, 900))

	// max_duration is labeled in hours in the UI but the backend expects minutes
	const durationMinutes = filters.max_duration ? Number(filters.max_duration) * 60 : undefined

	try {
		const [data] = await Promise.all([
			getIdea({
				budget:       filters.budget   || undefined,
				category:     filters.category || undefined,
				max_duration: durationMinutes,
			}),
			minDelay,
		])
		idea.value = data?.idea ?? data
	} catch (e) {
		error.value = e.message || 'could not get an idea — try again'
	} finally {
		loading.value  = false
		spinning.value = false
	}
}
</script>

<template>
	<main class="randomiser-page">
		<h1 class="randomiser-page__title">date night randomiser</h1>
		<p class="randomiser-page__sub">let us plan your next adventure</p>

		<!-- Filters -->
		<div class="randomiser-filters card">
			<div class="randomiser-filters__row">
				<label class="randomiser-filter__label" for="rand-budget">budget</label>
				<select id="rand-budget" v-model="filters.budget" class="randomiser-filter__select">
					<option v-for="o in budgetOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
				</select>
			</div>
			<div class="randomiser-filters__row">
				<label class="randomiser-filter__label" for="rand-category">vibe</label>
				<select id="rand-category" v-model="filters.category" class="randomiser-filter__select">
					<option v-for="o in categoryOptions" :key="o" :value="o">{{ o || 'any' }}</option>
				</select>

			</div>
			<div class="randomiser-filters__row">
				<label class="randomiser-filter__label" for="rand-duration">max hours</label>
				<input
					id="rand-duration"
					v-model="filters.max_duration"
					type="number"
					min="1"
					max="24"
					placeholder="any"
					class="randomiser-filter__input"
				/>
			</div>
		</div>

		<!-- Spin button -->
		<div class="randomiser-spin">
			<BaseButton
				variant="primary"
				:loading="loading"
				class="randomiser-spin__btn"
				@click="spin"
			>
				{{ loading ? 'finding your date…' : 'spin ✦' }}
			</BaseButton>
		</div>

		<p v-if="error" class="randomiser-error">{{ error }}</p>

		<!-- Idea card -->
		<Transition name="page">
			<div v-if="idea" class="randomiser-idea card">
				<div class="randomiser-idea__top">
					<h2 class="randomiser-idea__name">{{ idea.title }}</h2>
					<span
						:class="['randomiser-idea__badge', idea.source === 'ai' ? 'randomiser-idea__badge--ai' : 'randomiser-idea__badge--seed']"
					>
						{{ idea.source === 'ai' ? '✦ ai' : '✦ curated' }}
					</span>
				</div>

				<p class="randomiser-idea__desc">{{ idea.description }}</p>

				<div class="randomiser-idea__tags">
					<span v-if="idea.budget"      class="randomiser-idea__tag">{{ idea.budget }}</span>
					<span v-if="idea.category"    class="randomiser-idea__tag">{{ idea.category }}</span>
					<span v-if="idea.duration_hours" class="randomiser-idea__tag">{{ idea.duration_hours }}h</span>
				</div>
			</div>
		</Transition>
	</main>
</template>

<style scoped>
.randomiser-page {
	padding:   var(--space-6) var(--space-4) calc(var(--space-16) + env(safe-area-inset-bottom));
	max-width: 560px;
	margin:    0 auto;
}

@media (min-width: 768px)  { .randomiser-page { margin-left: 64px;  padding-top: var(--space-8); } }
@media (min-width: 1024px) { .randomiser-page { margin-left: 200px; } }
@media (min-width: 1280px) { .randomiser-page { margin-left: 240px; max-width: 700px; } }

.randomiser-page__title {
	margin:      0 0 var(--space-1);
	font-family: var(--font-heading);
	font-size:   var(--text-2xl);
	font-weight: 800;
	color:       var(--text-primary);
}

.randomiser-page__sub {
	margin:      0 0 var(--space-6);
	font-family: var(--font-body);
	font-style:  italic;
	color:       var(--text-muted);
}

.randomiser-filters {
	display:        flex;
	flex-direction: column;
	gap:            var(--space-3);
	margin-bottom:  var(--space-5);
}

.randomiser-filters__row {
	display:     flex;
	align-items: center;
	gap:         var(--space-4);
}

.randomiser-filter__label {
	font-family: var(--font-heading);
	font-size:   var(--text-sm);
	font-weight: 600;
	color:       var(--text-primary);
	min-width:   80px;
}

.randomiser-filter__select,
.randomiser-filter__input {
	flex:          1;
	height:        40px;
	padding:       0 var(--space-3);
	background:    var(--surface-raised);
	color:         var(--text-primary);
	border:        1px solid var(--border-subtle);
	border-radius: var(--radius-md);
	font-family:   var(--font-body);
	font-size:     var(--text-sm);
	outline:       none;
}
.randomiser-filter__select:focus,
.randomiser-filter__input:focus {
	border-color: var(--accent-warm);
}

.randomiser-spin {
	display:         flex;
	justify-content: center;
	margin-bottom:   var(--space-6);
}
.randomiser-spin__btn {
	min-width:  200px;
	font-size:  var(--text-lg) !important;
	padding:    var(--space-4) var(--space-8);
}

.randomiser-error {
	font-family: var(--font-body);
	font-size:   var(--text-sm);
	color:       var(--error-text);
	text-align:  center;
}

/* Idea card */
.randomiser-idea {
	margin-top: var(--space-2);
}

.randomiser-idea__top {
	display:         flex;
	align-items:     flex-start;
	justify-content: space-between;
	gap:             var(--space-3);
	margin-bottom:   var(--space-3);
}

.randomiser-idea__name {
	margin:      0;
	font-family: var(--font-heading);
	font-size:   var(--text-xl);
	font-weight: 800;
	color:       var(--text-primary);
}

.randomiser-idea__badge {
	flex-shrink:   0;
	padding:       2px var(--space-2);
	border-radius: var(--radius-full);
	font-family:   var(--font-heading);
	font-size:     10px;
	font-weight:   700;
}
.randomiser-idea__badge--ai   { background: var(--accent-warm); color: var(--color-cherry); }
.randomiser-idea__badge--seed { background: var(--surface-raised); color: var(--text-muted); border: 1px solid var(--border-subtle); }

.randomiser-idea__desc {
	margin:      0 0 var(--space-4);
	font-family: var(--font-body);
	font-size:   var(--text-base);
	color:       var(--text-secondary);
	line-height: 1.7;
}

.randomiser-idea__tags {
	display:   flex;
	flex-wrap: wrap;
	gap:       var(--space-2);
}

.randomiser-idea__tag {
	padding:       var(--space-1) var(--space-2);
	background:    var(--surface-raised);
	border:        1px solid var(--border-subtle);
	border-radius: var(--radius-full);
	font-family:   var(--font-heading);
	font-size:     var(--text-xs);
	color:         var(--text-muted);
	text-transform: lowercase;
}
</style>
