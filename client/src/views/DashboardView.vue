<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore }             from '../stores/auth.store.js'
import { useCoupleStore }           from '../stores/couple.store.js'
import { getDates }                 from '../services/date.service.js'
import { getMoods }                 from '../services/mood.service.js'
import { listMemories }             from '../services/memory.service.js'
import { useCountdown }             from '../composables/useCountdown.js'
import MemoryCard                   from '../components/memory/MemoryCard.vue'
import MemorySkeleton               from '../components/memory/MemorySkeleton.vue'

const auth   = useAuthStore()
const couple = useCoupleStore()

// ── Data ─────────────────────────────────────────────────────────────────────
const upcomingDates  = ref([])
const recentMemories = ref([])
const todayMood      = ref(null)
const loadingDates   = ref(true)
const loadingMemories = ref(true)

// Days together from anniversary date.
// Pass the computed ref itself (not .value) so useCountdown re-triggers via
// toValue() when couple data loads asynchronously after mount.
const anniversaryDate = computed(() => couple.couple?.anniversaryDate)
const { days: daysTogether } = useCountdown(anniversaryDate, false)

// Greeting
const greeting = computed(() => {
	const name = auth.user?.displayName || auth.user?.display_name || 'there'
	const hour  = new Date().getHours()
	if (hour < 12) return `good morning, ${name}`
	if (hour < 18) return `good afternoon, ${name}`
	return `good evening, ${name}`
})

const coupleName = computed(() =>
	couple.couple?.coupleName || `${auth.user?.displayName || 'you'} & ${couple.partner?.displayName || 'your partner'}`
)

onMounted(async () => {
	// Load couple data (partner profile etc.)
	if (!couple.couple) await couple.fetchCouple()

	// Fetch upcoming important dates (take next 3)
	try {
		const data = await getDates()
		const now  = Date.now()
		upcomingDates.value = (data?.dates ?? [])
			.filter((d) => new Date(d.date) >= now || d.recursYearly)
			.slice(0, 3)
	} catch { /* silently skip */ }
	loadingDates.value = false

	// Latest 3 memories
	try {
		const data = await listMemories(1, 3)
		recentMemories.value = data?.memories ?? []
	} catch { /* silently skip */ }
	loadingMemories.value = false

	// Today's mood (first entry in the last 1 day)
	try {
		const data = await getMoods(1)
		// Backend returns { logs } — same fix as MoodView
		todayMood.value = (data?.logs ?? [])[0] ?? null
	} catch { /* silently skip */ }
})
</script>

<template>
	<main class="dashboard">
		<div class="page-watermark" aria-hidden="true">♡</div>

		<!-- Greeting header -->
		<header class="dashboard__header">
			<p class="dashboard__greeting">{{ greeting }}</p>
			<h1 class="dashboard__couple-name">{{ coupleName }}</h1>
			<p v-if="anniversaryDate" class="dashboard__days">
				{{ daysTogether }} days together
			</p>
		</header>

		<!-- Unpaired overlay -->
		<div v-if="!auth.isPaired" class="dashboard__unpaired card">
			<p class="dashboard__unpaired-msg">invite your partner to unlock everything</p>
			<RouterLink to="/pair" class="btn btn--primary">pair now</RouterLink>
		</div>

		<template v-else>
			<!-- Today's mood widget -->
			<section class="dashboard__section">
				<h2 class="dashboard__section-title">today's mood</h2>
				<div class="card dashboard__mood">
					<p v-if="todayMood" class="dashboard__mood-score">
						{{ todayMood.moodScore }} / 5
						<span v-if="todayMood.note" class="dashboard__mood-note">— {{ todayMood.note }}</span>
					</p>
					<p v-else class="dashboard__mood-empty">you haven't logged today yet</p>
					<RouterLink to="/mood" class="btn btn--secondary dashboard__mood-btn">
						{{ todayMood ? 'update mood' : 'log mood' }}
					</RouterLink>
				</div>
			</section>

			<!-- Upcoming dates -->
			<section class="dashboard__section">
				<div class="dashboard__section-header">
					<h2 class="dashboard__section-title">coming up</h2>
					<RouterLink to="/dates" class="btn btn--ghost dashboard__section-btn">see all</RouterLink>
				</div>
				<div v-if="loadingDates" class="dashboard__dates-skeleton">
					<div v-for="n in 3" :key="n" class="dashboard__date-placeholder shimmer" />
				</div>
				<ul v-else-if="upcomingDates.length" class="dashboard__dates">
					<li v-for="d in upcomingDates" :key="d.id" class="card dashboard__date-item">
						<span class="dashboard__date-title">{{ d.title }}</span>
						<span class="dashboard__date-date">{{ new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) }}</span>
					</li>
				</ul>
				<div v-else class="dashboard__empty-state">
					<p class="dashboard__empty">no upcoming dates yet</p>
					<RouterLink to="/dates" class="btn btn--secondary dashboard__empty-btn">add a date</RouterLink>
				</div>
			</section>

			<!-- Latest memories -->
			<section class="dashboard__section">
				<div class="dashboard__section-header">
					<h2 class="dashboard__section-title">our memories</h2>
					<RouterLink to="/memories" class="btn btn--ghost dashboard__section-btn">see all</RouterLink>
				</div>
				<div class="dashboard__memories-grid">
					<template v-if="loadingMemories">
						<MemorySkeleton v-for="n in 3" :key="n" />
					</template>
					<template v-else-if="recentMemories.length">
						<MemoryCard v-for="m in recentMemories" :key="m.id" :memory="m" />
					</template>
					<div v-else class="dashboard__empty-state">
						<p class="dashboard__empty">no memories yet</p>
						<RouterLink to="/memories/new" class="btn btn--primary dashboard__empty-btn">add your first</RouterLink>
					</div>
				</div>
			</section>
		</template>
	</main>
</template>

<style scoped>
.dashboard {
	position:   relative; /* stacking context — content above the fixed watermark */
	z-index:    1;
	padding:    var(--space-6) var(--space-4) calc(var(--space-16) + env(safe-area-inset-bottom, 0px));
	max-width:  960px;
	margin:     0 auto;
}

/* Centre within available space — max() ensures we never overlap the sidebar */
@media (min-width: 768px) {
	.dashboard {
		margin-left:  max(var(--sidebar-w), calc((100vw - 960px) / 2));
		margin-right: auto;
		padding-top:  var(--space-8);
	}
}

.dashboard__header {
	margin-bottom: var(--space-10);
}

.dashboard__greeting {
	margin:      0;
	font-family: var(--font-heading);
	font-size:   var(--text-sm);
	color:       var(--text-muted);
}

.dashboard__couple-name {
	margin:      var(--space-1) 0;
	font-family: var(--font-heading);
	font-size:   var(--text-3xl);
	font-weight: 800;
	color:       var(--text-primary);
}

.dashboard__days {
	margin:      0;
	font-family: var(--font-body);
	font-style:  italic;
	font-size:   var(--text-base);
	color:       var(--accent-warm);
}

/* Unpaired state */
.dashboard__unpaired {
	text-align: center;
	padding:    var(--space-10) var(--space-6);
	display:    flex;
	flex-direction: column;
	align-items: center;
	gap:        var(--space-4);
}
.dashboard__unpaired-msg {
	margin:      0;
	font-family: var(--font-body);
	font-size:   var(--text-base);
	color:       var(--text-secondary);
}

/* Section layout */
.dashboard__section {
	margin-bottom: var(--space-8);
}

.dashboard__section-header {
	display:         flex;
	align-items:     baseline;
	justify-content: space-between;
	margin-bottom:   var(--space-3);
}

.dashboard__section-title {
	margin:      0 0 var(--space-3); /* breathing room before the card below */
	font-family: var(--font-heading);
	font-size:   var(--text-lg);
	font-weight: 700;
	color:       var(--text-primary);
}

/* "see all" ghost button */
.dashboard__section-btn {
	font-size: var(--text-xs);
	padding:   var(--space-1) var(--space-3);
}

/* Mood widget */
.dashboard__mood {
	display:     flex;
	align-items: center;
	gap:         var(--space-4);
	flex-wrap:   wrap;
}
.dashboard__mood-score {
	margin:      0;
	flex:        1;
	font-family: var(--font-heading);
	font-size:   var(--text-lg);
	font-weight: 700;
	color:       var(--text-primary);
}
.dashboard__mood-note {
	font-weight: 400;
	font-size:   var(--text-sm);
	color:       var(--text-muted);
}
.dashboard__mood-empty {
	margin:      0;
	flex:        1;
	font-family: var(--font-body);
	color:       var(--text-muted);
	font-size:   var(--text-sm);
}
/* Mood action button */
.dashboard__mood-btn {
	font-size:  var(--text-xs);
	padding:    var(--space-2) var(--space-3);
	flex-shrink: 0;
}

/* Dates */
.dashboard__dates {
	list-style:     none;
	margin:         0;
	padding:        0;
	display:        flex;
	flex-direction: column;
	gap:            var(--space-2);
}
.dashboard__date-item {
	display:         flex;
	align-items:     center;
	justify-content: space-between;
	padding:         var(--space-3) var(--space-4);
}
.dashboard__date-title {
	font-family: var(--font-heading);
	font-size:   var(--text-sm);
	font-weight: 600;
	color:       var(--text-primary);
}
.dashboard__date-date {
	font-family: var(--font-body);
	font-size:   var(--text-xs);
	color:       var(--text-muted);
}

.dashboard__dates-skeleton {
	display:        flex;
	flex-direction: column;
	gap:            var(--space-2);
}
.dashboard__date-placeholder {
	height:        52px;
	border-radius: var(--radius-lg);
}
.shimmer {
	background:      linear-gradient(90deg, var(--surface-raised) 0%, var(--surface-card) 40%, var(--surface-raised) 80%);
	background-size: 200% 100%;
	animation:       shimmer 1.4s ease-in-out infinite;
}
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

/* Memories grid */
.dashboard__memories-grid {
	display:               grid;
	grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
	gap:                   var(--space-4);
}

.dashboard__empty-state {
	display:        flex;
	flex-direction: column;
	align-items:    flex-start;
	gap:            var(--space-3);
}

.dashboard__empty {
	margin:      0;
	font-family: var(--font-body);
	font-size:   var(--text-sm);
	color:       var(--text-muted);
}

.dashboard__empty-btn {
	font-size: var(--text-sm);
	padding:   var(--space-2) var(--space-4);
}
</style>
