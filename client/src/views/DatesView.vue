<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getDates, createDate, deleteDate } from '../services/date.service.js'
import { useCountdown }             from '../composables/useCountdown.js'
import BaseInput                    from '../components/base/BaseInput.vue'
import BaseButton                   from '../components/base/BaseButton.vue'
import BaseModal                    from '../components/base/BaseModal.vue'
import RandomiserNudge               from '../components/base/RandomiserNudge.vue'

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
	} catch { /* not a big deal, the list just stays empty */ }
	loading.value = false
}

// add date form
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

// delete
const deleteTarget = ref(null)
const deleteLoading = ref(false)

async function confirmDelete() {
	if (!deleteTarget.value) return
	deleteLoading.value = true
	try {
		await deleteDate(deleteTarget.value.id)
		deleteTarget.value = null
		await reload()
	} catch { /* not a big deal, the modal just closes either way */ }
	deleteLoading.value = false
}

// countdown text helper, used inline for each date item rather than a
// separate component since it's just a small string calculation

function countdownText(dateStr, recurse) {
	// quick static calculation, not reactive, so it won't count down by the second
	const now  = new Date()
	const base = new Date(dateStr)

	/*
		this used to treat `diff <= 0` as "today!" for any date in the past, so
		a one-time date from 5 days ago (say "First Dinner Date" on June 1 when
		today is June 6) showed "today!" instead of recognising it had already
		passed. that's because `diff <= 0` is true for "today", "yesterday" and
		"fifty years ago" alike, it can't tell them apart on its own.

		so now we work out "is this actually today?" by comparing calendar
		fields instead of just checking the sign of a millisecond difference:
		  - recurring (anniversary/birthday): today = same month and day, any year
		  - one-time event: today = same year, month and day, exactly
		only once that's ruled out do we fall through to a future countdown or
		a "N days ago" label for one-time dates that have genuinely passed.
	*/
	const sameMonthDay = base.getMonth() === now.getMonth() && base.getDate() === now.getDate()
	const sameFullDate = sameMonthDay && base.getFullYear() === now.getFullYear()
	if (recurse ? sameMonthDay : sameFullDate) return 'today!'

	let target = base
	if (recurse) {
		target = new Date(now.getFullYear(), base.getMonth(), base.getDate())
		if (target <= now) target = new Date(now.getFullYear() + 1, base.getMonth(), base.getDate())
	}

	const diff = target - now

	if (diff <= 0) {
		// one-time date that's already passed, so say how long ago instead of "today!"
		const daysAgo = Math.floor(Math.abs(diff) / 86400000)
		return daysAgo === 1 ? '1 day ago' : `${daysAgo} days ago`
	}

	const d = Math.floor(diff / 86400000)
	if (d === 1) return '1 day away'
	return `${d} days away`
}
</script>

<template>
	<main class="dates-page">
		<div class="page-watermark" aria-hidden="true">◇</div>
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

		<div v-else class="dates-page__empty-block">
			<p class="dates-page__empty">no important dates yet — add our anniversary, birthdays, or any day that matters</p>
			<RandomiserNudge
				class="dates-page__nudge"
				text="don't have an occasion yet? let the randomiser dream one up for you"
			/>
		</div>

		<!--
			nudge toward the randomiser, pinned to the bottom of the page with
			flex `margin-top: auto` (see `.dates-page__nudge--anchored`) instead
			of sitting right under the list. on shorter lists it used to land
			mid-viewport, right on top of the fixed page-watermark symbol (the
			large ◇ sits centred at `inset: 0`). anchoring it to the bottom keeps
			it clear of the watermark on every viewport and lets it read as a
			calm closing note.
		-->
		<RandomiserNudge
			v-if="dates.length"
			class="dates-page__nudge dates-page__nudge--anchored"
			text="feeling spontaneous?"
		/>

		<!-- add modal -->
		<BaseModal :open="showAdd" title="add a date" @close="showAdd = false">
			<form class="dates-add-form" @submit.prevent="saveDate">
				<BaseInput id="date-title" v-model="newDate.title" label="occasion" placeholder="anniversary, birthday…" />
				<BaseInput id="date-date"  v-model="newDate.date"  label="date" type="date" />

				<!--
					custom toggle switch instead of the bare native checkbox, since
					the system-default square box felt utilitarian next to the warm,
					rounded brand language elsewhere on this form. the input stays in
					the DOM, visually hidden rather than `display: none`, so screen
					readers, keyboard nav and `v-model` keep working exactly like
					before. only its look changes, via the sibling track and thumb spans.
				-->
				<label class="dates-add-form__check">
					<input v-model="newDate.recurs_yearly" type="checkbox" class="dates-toggle__input" />
					<span class="dates-toggle__track" aria-hidden="true">
						<span class="dates-toggle__thumb" />
					</span>
					<span>recurs every year</span>
				</label>

				<p v-if="addError" class="dates-add-form__error">{{ addError }}</p>

				<BaseButton type="submit" variant="primary" :loading="addLoading">save</BaseButton>
			</form>
		</BaseModal>

		<!-- delete confirmation modal -->
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
	padding:        var(--space-6) var(--space-4) calc(var(--space-16) + env(safe-area-inset-bottom));
	position:       relative;
	z-index:        1;
	max-width:      760px;
	margin:         0 auto;
	/* flex column filling the viewport, so the bottom-anchored nudge below
	   has somewhere to push to. see `.dates-page__nudge--anchored` */
	display:        flex;
	flex-direction: column;
	min-height:     100dvh;
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

.dates-page__empty-block {
	display:        flex;
	flex-direction: column;
	align-items:    flex-start;
	gap:            var(--space-4);
}

/* spacing for the shared RandomiserNudge: snug beneath the empty-state copy,
   with more breathing room when it anchors a populated list */
.dates-page__empty-block .dates-page__nudge { margin-top: var(--space-1); }

/* pins the closing randomiser nudge to the bottom of the page, clear of the
   centred page-watermark, on every viewport whether the list is short or long */
.dates-page__nudge--anchored {
	margin-top:  auto;
	padding-top: var(--space-10);
	align-self:  center;
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

/* add form */
.dates-add-form {
	display:        flex;
	flex-direction: column;
	gap:            var(--space-4);
}

.dates-add-form__check {
	display:     flex;
	align-items: center;
	gap:         var(--space-3);
	font-family: var(--font-heading);
	font-size:   var(--text-sm);
	color:       var(--text-primary);
	cursor:      pointer;
}

/*
	custom toggle switch: hides the native checkbox visually while keeping it
	in the accessibility tree (focusable, still drives `v-model`), and replaces
	it visually with a pill-shaped track and sliding thumb. the state is driven
	entirely by CSS sibling selectors off `:checked`, so no extra script or
	state is needed.
*/
.dates-toggle__input {
	position: absolute;
	width:    1px;
	height:   1px;
	margin:   -1px;
	padding:  0;
	overflow: hidden;
	clip:     rect(0, 0, 0, 0);
	white-space: nowrap;
	border:   0;
}

.dates-toggle__track {
	position:        relative;
	display:         inline-flex;
	align-items:     center;
	flex-shrink:     0;
	width:           42px;
	height:          24px;
	border-radius:   var(--radius-full);
	background:      var(--surface-raised);
	border:          1px solid var(--border-subtle);
	transition:      background var(--duration-normal) var(--ease-tender),
	                 border-color var(--duration-normal) var(--ease-tender);
}

.dates-toggle__thumb {
	position:      absolute;
	top:           50%;
	left:          3px;
	width:         16px;
	height:        16px;
	border-radius: var(--radius-full);
	background:    var(--text-muted);
	transform:     translateY(-50%);
	transition:    transform var(--duration-normal) var(--ease-tender),
	               background var(--duration-normal) var(--ease-tender);
}

/* checked state: the track warms to the accent colour, the thumb slides and deepens to cherry */
.dates-toggle__input:checked + .dates-toggle__track {
	background:   var(--accent-warm);
	border-color: var(--accent-warm);
}
.dates-toggle__input:checked + .dates-toggle__track .dates-toggle__thumb {
	transform:  translateY(-50%) translateX(18px);
	background: var(--color-cherry);
}

/* keyboard focus: a visible ring around the track, mirroring BaseInput's focus treatment */
.dates-toggle__input:focus-visible + .dates-toggle__track {
	outline:        2px solid var(--accent-warm);
	outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
	.dates-toggle__track,
	.dates-toggle__thumb { transition: none; }
}

.dates-add-form__error {
	margin:      0;
	font-size:   var(--text-xs);
	color:       var(--error-text);
	font-family: var(--font-heading);
}
</style>
