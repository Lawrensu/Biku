<script setup>
import { ref }         from 'vue'
import { logMood, updateMood } from '../../services/mood.service.js'
import BaseButton      from '../base/BaseButton.vue'

const props = defineProps({
	// If an existing entry is provided, the form starts in edit mode
	existingEntry: { type: Object, default: null },
})

const emit = defineEmits(['logged'])

// Pre-fill if editing
const score    = ref(props.existingEntry?.mood_score ?? props.existingEntry?.score ?? null)
const note     = ref(props.existingEntry?.note ?? '')
const loading  = ref(false)
const error    = ref('')

// editMode is true when we received a 409 (already logged today) or an existing entry
const editMode = ref(!!props.existingEntry)

const scoreLabels = ['', 'rough', 'low', 'okay', 'good', 'great']

async function submit() {
	if (!score.value) { error.value = 'pick a score before saving'; return }
	error.value = ''
	loading.value = true
	try {
		if (editMode.value && props.existingEntry?.id) {
			await updateMood(props.existingEntry.id, score.value, note.value)
		} else {
			await logMood(score.value, note.value)
		}
		emit('logged', { score: score.value, note: note.value })
	} catch (e) {
		// 409 means already logged today — switch to edit mode gracefully
		if (e.status === 409) {
			editMode.value = true
			error.value    = 'you already logged today — editing your entry'
		} else {
			error.value = e.message || 'something went wrong'
		}
	} finally {
		loading.value = false
	}
}
</script>

<template>
	<form class="mood-form" @submit.prevent="submit">
		<p class="mood-form__heading">
			{{ editMode ? 'update today\'s mood' : 'how are you feeling today?' }}
		</p>

		<!-- 5-chip score selector -->
		<div class="mood-form__chips" role="group" aria-label="mood score">
			<button
				v-for="n in 5"
				:key="n"
				type="button"
				:class="['mood-form__chip', { 'mood-form__chip--active': score === n }]"
				:aria-pressed="score === n"
				@click="score = n"
			>
				<span class="mood-form__chip-score">{{ n }}</span>
				<span class="mood-form__chip-label">{{ scoreLabels[n] }}</span>
			</button>
		</div>

		<!-- Optional note -->
		<textarea
			v-model="note"
			class="mood-form__note"
			placeholder="add a note (optional)"
			rows="3"
			maxlength="280"
		/>

		<p v-if="error" class="mood-form__error">{{ error }}</p>

		<BaseButton type="submit" variant="primary" :loading="loading">
			{{ editMode ? 'update' : 'save mood' }}
		</BaseButton>
	</form>
</template>

<style scoped>
.mood-form {
	display:        flex;
	flex-direction: column;
	gap:            var(--space-4);
}

.mood-form__heading {
	margin:      0;
	font-family: var(--font-heading);
	font-size:   var(--text-base);
	font-weight: 600;
	color:       var(--text-primary);
}

.mood-form__chips {
	display: flex;
	gap:     var(--space-2);
}

.mood-form__chip {
	flex:            1;
	display:         flex;
	flex-direction:  column;
	align-items:     center;
	gap:             2px;
	padding:         var(--space-2) var(--space-1);
	background:      var(--surface-raised);
	border:          1px solid var(--border-subtle);
	border-radius:   var(--radius-md);
	cursor:          pointer;
	transition:      background var(--duration-fast) var(--ease-tender),
	                 border-color var(--duration-fast) var(--ease-tender);
}
.mood-form__chip--active,
.mood-form__chip:hover {
	background:   var(--accent-warm);
	border-color: var(--accent-warm);
}
.mood-form__chip--active .mood-form__chip-score,
.mood-form__chip--active .mood-form__chip-label,
.mood-form__chip:hover .mood-form__chip-score,
.mood-form__chip:hover .mood-form__chip-label {
	color: var(--color-cherry);
}

.mood-form__chip-score {
	font-family: var(--font-heading);
	font-size:   var(--text-lg);
	font-weight: 700;
	color:       var(--text-primary);
}
.mood-form__chip-label {
	font-family: var(--font-heading);
	font-size:   9px;
	color:       var(--text-muted);
}

.mood-form__note {
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
.mood-form__note:focus {
	border-color: var(--accent-warm);
}
.mood-form__note::placeholder { color: var(--text-muted); }

.mood-form__error {
	margin:      0;
	font-size:   var(--text-xs);
	color:       var(--error-text);
	font-family: var(--font-heading);
}
</style>
