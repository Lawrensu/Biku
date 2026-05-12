<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore }             from '../stores/auth.store.js'
import { useCoupleStore }           from '../stores/couple.store.js'
import { getMoods }                 from '../services/mood.service.js'
import MoodChart                    from '../components/mood/MoodChart.vue'
import MoodLogForm                  from '../components/mood/MoodLogForm.vue'

const auth   = useAuthStore()
const couple = useCoupleStore()

const loading    = ref(true)
const userMoods  = ref([])
const partnerMoods = ref([])
const todayEntry = ref(null)

const userName    = computed(() => auth.user?.displayName  || auth.user?.display_name  || 'you')
const partnerName = computed(() => couple.partner?.displayName || couple.partner?.display_name || 'partner')

onMounted(async () => {
	if (!couple.couple) await couple.fetchCouple()
	await reload()
})

async function reload() {
	loading.value = true
	try {
		const data = await getMoods(30)
		const all  = data?.moods ?? []

		userMoods.value    = all.filter((m) => m.userId    === auth.user?.id  || m.user_id === auth.user?.id)
		partnerMoods.value = all.filter((m) => m.userId !== auth.user?.id && m.user_id !== auth.user?.id)

		// Check if the user already logged today
		const today = new Date().toISOString().slice(0, 10)
		todayEntry.value = userMoods.value.find((m) => (m.date || m.createdAt || '').slice(0, 10) === today) ?? null
	} catch { /* silently skip */ }
	loading.value = false
}

function onLogged() { reload() }
</script>

<template>
	<main class="mood-page">
		<h1 class="mood-page__title">our mood</h1>

		<section class="mood-page__section">
			<h2 class="mood-page__section-title">log today</h2>
			<div class="card">
				<MoodLogForm :existing-entry="todayEntry" @logged="onLogged" />
			</div>
		</section>

		<section class="mood-page__section">
			<h2 class="mood-page__section-title">last 30 days</h2>
			<div class="card mood-page__chart-card">
				<div v-if="loading" class="mood-page__loading">loading chart…</div>
				<MoodChart
					v-else
					:user-entries="userMoods"
					:partner-entries="partnerMoods"
					:user-name="userName"
					:partner-name="partnerName"
				/>
			</div>
		</section>

		<!-- Recent entries list -->
		<section class="mood-page__section">
			<h2 class="mood-page__section-title">recent entries</h2>
			<ul class="mood-page__entries">
				<li v-for="entry in userMoods.slice(0, 10)" :key="entry.id" class="card mood-page__entry">
					<span class="mood-page__entry-score">{{ entry.mood_score ?? entry.score }} / 5</span>
					<span class="mood-page__entry-date">
						{{ new Date(entry.date || entry.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) }}
					</span>
					<span v-if="entry.note" class="mood-page__entry-note">{{ entry.note }}</span>
				</li>
				<li v-if="!loading && !userMoods.length" class="mood-page__empty">no entries yet</li>
			</ul>
		</section>
	</main>
</template>

<style scoped>
.mood-page {
	padding:   var(--space-6) var(--space-4) calc(var(--space-16) + env(safe-area-inset-bottom));
	max-width: 720px;
	margin:    0 auto;
}

@media (min-width: 768px)  { .mood-page { margin-left: 64px;  padding-top: var(--space-8); } }
@media (min-width: 1024px) { .mood-page { margin-left: 200px; } }

.mood-page__title {
	margin:      0 0 var(--space-6);
	font-family: var(--font-heading);
	font-size:   var(--text-2xl);
	font-weight: 800;
	color:       var(--text-primary);
}

.mood-page__section {
	margin-bottom: var(--space-8);
}

.mood-page__section-title {
	margin:      0 0 var(--space-3);
	font-family: var(--font-heading);
	font-size:   var(--text-lg);
	font-weight: 700;
	color:       var(--text-primary);
}

.mood-page__chart-card { padding: var(--space-4); }

.mood-page__loading {
	font-family: var(--font-body);
	font-size:   var(--text-sm);
	color:       var(--text-muted);
	height:      220px;
	display:     flex;
	align-items: center;
	justify-content: center;
}

.mood-page__entries {
	list-style:     none;
	margin:         0;
	padding:        0;
	display:        flex;
	flex-direction: column;
	gap:            var(--space-2);
}

.mood-page__entry {
	display:     flex;
	align-items: baseline;
	gap:         var(--space-3);
	flex-wrap:   wrap;
	padding:     var(--space-3) var(--space-4);
}

.mood-page__entry-score {
	font-family: var(--font-heading);
	font-size:   var(--text-base);
	font-weight: 700;
	color:       var(--accent-warm);
}
.mood-page__entry-date {
	font-family: var(--font-body);
	font-size:   var(--text-xs);
	color:       var(--text-muted);
}
.mood-page__entry-note {
	font-family: var(--font-body);
	font-size:   var(--text-sm);
	color:       var(--text-secondary);
	flex-basis:  100%;
}

.mood-page__empty {
	font-family: var(--font-body);
	font-size:   var(--text-sm);
	color:       var(--text-muted);
}
</style>
