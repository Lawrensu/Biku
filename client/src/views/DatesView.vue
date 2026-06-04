<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getDates, createDate, deleteDate } from '../services/date.service.js'
import { useCountdown }             from '../composables/useCountdown.js'
import BaseInput                    from '../components/base/BaseInput.vue'
import BaseButton                   from '../components/base/BaseButton.vue'
import BaseModal                    from '../components/base/BaseModal.vue'

const dates   = ref([])
const loading = ref(true)

onMounted(async () => {
	await reload()
})

async function reload() {
	loading.value = true
	try {
		const data = await getDates()
		dates.value = (data?.dates ?? []).sort((a, b) => new Date(a.date) - new Date(b.date))
	} catch { /* silently skip */ }
	loading.value = false
}

// ── Add date form ─────────────────────────────────────────────────────────────
const showAdd     = ref(false)
const addLoading  = ref(false)
const addError    = ref('')
const newDate     = reactive({ title: '', date: '', recurs_yearly: false })

async function saveDate() {
	if (!newDate.title.trim() || !newDate.date) { addError.value = 'title and date are required'; return }
	addLoading.value = true
	addError.value   = ''
	try {
		await createDate({ title: newDate.title.trim(), date: newDate.date, recurs_yearly: newDate.recurs_yearly })
		newDate.title = ''; newDate.date = ''; newDate.recurs_yearly = false
		showAdd.value = false
		await reload()
	} catch (e) {
		addError.value = e.message || 'could not save'
	} finally {
		addLoading.value = false
	}
}

// ── Delete ────────────────────────────────────────────────────────────────────
const deleteTarget = ref(null)
const deleteLoading = ref(false)

async function confirmDelete() {
	if (!deleteTarget.value) return
	deleteLoading.value = true
	try {
		await deleteDate(deleteTarget.value.id)
		deleteTarget.value = null
		await reload()
	} catch { /* silently skip */ }
	deleteLoading.value = false
}

// ── CountdownBadge component (inline, small) ──────────────────────────────────
// Each date item uses its own useCountdown call via a scoped slot / helper

function countdownText(dateStr, recurse) {
	// Quick static calculation — not reactive (doesn't count seconds)
	const target = recurse ? (() => {
		const now  = new Date()
		const base = new Date(dateStr)
		let next   = new Date(now.getFullYear(), base.getMonth(), base.getDate())
		if (next <= now) next = new Date(now.getFullYear() + 1, base.getMonth(), base.getDate())
		return next
	})() : new Date(dateStr)

	const diff = target - Date.now()
	if (diff <= 0) return 'today!'
	const d = Math.floor(diff / 86400000)
	if (d === 0) return 'today!'
	if (d === 1) return '1 day away'
	return `${d} days away`
}
</script>

<template>
	<main class="dates-page">
		<div class="page-watermark" aria-hidden="true">◻</div>
		<div class="dates-page__header">
			<h1 class="dates-page__title">important dates</h1>
			<BaseButton variant="primary" @click="showAdd = true">add date</BaseButton>
		</div>

		<div v-if="loading" class="dates-page__loading">loading…</div>

		<ul v-else-if="dates.length" class="dates-list">
			<li v-for="d in dates" :key="d.id" class="card dates-list__item">
				<div class="dates-list__item-main">
					<span class="dates-list__title">{{ d.title }}</span>
					<span class="dates-list__date">
						{{ new Date(d.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) }}
						<em v-if="d.recurs_yearly || d.recursYearly"> · yearly</em>
					</span>
				</div>
				<div class="dates-list__item-right">
					<span class="dates-list__countdown">{{ countdownText(d.date, d.recurs_yearly || d.recursYearly) }}</span>
					<button class="dates-list__delete" aria-label="delete" @click="deleteTarget = d">✕</button>
				</div>
			</li>
		</ul>

		<p v-else class="dates-page__empty">no important dates yet — add your anniversary, birthdays, or any day that matters</p>

		<!-- Add modal -->
		<BaseModal :open="showAdd" title="add a date" @close="showAdd = false">
			<form class="dates-add-form" @submit.prevent="saveDate">
				<BaseInput id="date-title" v-model="newDate.title" label="occasion" placeholder="anniversary, birthday…" />
				<BaseInput id="date-date"  v-model="newDate.date"  label="date" type="date" />

				<label class="dates-add-form__check">
					<input v-model="newDate.recurs_yearly" type="checkbox" />
					recurs every year
				</label>

				<p v-if="addError" class="dates-add-form__error">{{ addError }}</p>

				<BaseButton type="submit" variant="primary" :loading="addLoading">save</BaseButton>
			</form>
		</BaseModal>

		<!-- Delete confirmation modal -->
		<BaseModal :open="!!deleteTarget" :title="`delete '${deleteTarget?.title}'?`" @close="deleteTarget = null">
			<p style="font-family: var(--font-body); color: var(--text-secondary); margin: 0;">this can't be undone.</p>
			<template #footer>
				<BaseButton variant="secondary" @click="deleteTarget = null">cancel</BaseButton>
				<BaseButton variant="danger" :loading="deleteLoading" @click="confirmDelete">delete</BaseButton>
			</template>
		</BaseModal>
	</main>
</template>

<style scoped>
.dates-page {
	padding:   var(--space-6) var(--space-4) calc(var(--space-16) + env(safe-area-inset-bottom));
	position:  relative;
	z-index:   1;
	max-width: 760px;
	margin:    0 auto;
}

@media (min-width: 768px) {
	.dates-page {
		margin-left:  max(var(--sidebar-w), calc((100vw - 760px) / 2));
		margin-right: auto;
		padding-top:  var(--space-8);
	}
}

.dates-page__header {
	display:         flex;
	align-items:     center;
	justify-content: space-between;
	margin-bottom:   var(--space-6);
}

.dates-page__title {
	margin:      0;
	font-family: var(--font-heading);
	font-size:   var(--text-2xl);
	font-weight: 800;
	color:       var(--text-primary);
}

.dates-page__loading,
.dates-page__empty {
	font-family: var(--font-body);
	font-size:   var(--text-sm);
	color:       var(--text-muted);
}

.dates-list {
	list-style:     none;
	margin:         0;
	padding:        0;
	display:        flex;
	flex-direction: column;
	gap:            var(--space-3);
}

.dates-list__item {
	display:         flex;
	align-items:     center;
	justify-content: space-between;
	gap:             var(--space-4);
	padding:         var(--space-4);
	flex-wrap:       wrap;
}

.dates-list__item-main {
	display:        flex;
	flex-direction: column;
	gap:            var(--space-1);
	flex:           1;
}

.dates-list__title {
	font-family: var(--font-heading);
	font-size:   var(--text-base);
	font-weight: 700;
	color:       var(--text-primary);
}

.dates-list__date {
	font-family: var(--font-body);
	font-size:   var(--text-xs);
	color:       var(--text-muted);
}

.dates-list__item-right {
	display:     flex;
	align-items: center;
	gap:         var(--space-3);
}

.dates-list__countdown {
	font-family:   var(--font-heading);
	font-size:     var(--text-sm);
	font-weight:   600;
	color:         var(--accent-warm);
	white-space:   nowrap;
}

.dates-list__delete {
	background:    transparent;
	border:        none;
	color:         var(--text-muted);
	cursor:        pointer;
	font-size:     var(--text-sm);
	padding:       var(--space-1);
	border-radius: var(--radius-sm);
	transition:    color var(--duration-fast);
}
.dates-list__delete:hover { color: var(--error-text); }

/* Add form */
.dates-add-form {
	display:        flex;
	flex-direction: column;
	gap:            var(--space-4);
}

.dates-add-form__check {
	display:     flex;
	align-items: center;
	gap:         var(--space-2);
	font-family: var(--font-heading);
	font-size:   var(--text-sm);
	color:       var(--text-primary);
	cursor:      pointer;
}

.dates-add-form__error {
	margin:      0;
	font-size:   var(--text-xs);
	color:       var(--error-text);
	font-family: var(--font-heading);
}
</style>
