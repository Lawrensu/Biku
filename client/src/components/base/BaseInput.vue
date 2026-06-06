<script setup>
// the label always renders above the field, since we never want to rely on
// placeholder alone for accessibility. the `id` prop links <label :for> to
// the input.
//
// validation:
//   pass `rules`, an array of (value: string) => true | string functions.
//   errors surface on first blur, then update live on every keystroke.
//   a parent-supplied `error` prop always takes priority (e.g. server errors).
//
// sanitisation:
//   'email'     strips spaces and lowercases on every keystroke
//   'no-spaces' strips all whitespace (passwords, codes)
//   'uppercase' forces uppercase (invite codes)
import { ref, computed } from 'vue'
import { Eye, EyeOff }   from 'lucide-vue-next'

const props = defineProps({
	modelValue:  { type: String,  default: '' },
	label:       { type: String,  default: '' },
	type:        { type: String,  default: 'text' },
	placeholder: { type: String,  default: '' },
	error:       { type: String,  default: '' },   // parent-supplied error, takes priority over local validation
	helper:      { type: String,  default: '' },   // hint shown below field
	disabled:    { type: Boolean, default: false },
	id:          { type: String,  required: true },
	rules:       { type: Array,   default: () => [] }, // [(v) => true | 'msg']
	sanitize:    { type: String,  default: '' },       // 'email' | 'no-spaces' | 'uppercase'
})

const emit = defineEmits(['update:modelValue'])

// validation state

const touched    = ref(false)
const localError = ref('')

// password reveal, only relevant when `type="password"`. toggles the
// rendered <input> between `password` and `text` so people can check what
// they actually typed. small thing, but mistyped passwords are a genuine
// source of "why won't this work" frustration, especially on mobile keyboards.
const revealed = ref(false)

const effectiveType = computed(() =>
	(props.type === 'password' && revealed.value) ? 'text' : props.type
)

function sanitizeValue(val) {
	if (props.sanitize === 'email')     return val.toLowerCase().replace(/\s/g, '')
	if (props.sanitize === 'no-spaces') return val.replace(/\s/g, '')
	if (props.sanitize === 'uppercase') return val.toUpperCase().replace(/\s/g, '')
	return val
}

function runRules(val) {
	for (const rule of props.rules) {
		const result = rule(val)
		if (result !== true) {
			localError.value = result
			return false
		}
	}
	localError.value = ''
	return true
}

function onInput(e) {
	const raw       = e.target.value
	const sanitized = sanitizeValue(raw)

	// reflect the sanitized value back into the DOM if it changed,
	// e.g. someone typed a space into a no-spaces field
	if (sanitized !== raw) e.target.value = sanitized

	emit('update:modelValue', sanitized)
	if (touched.value) runRules(sanitized)
}

function onBlur() {
	touched.value = true
	runRules(props.modelValue)
}

// called by the parent form on submit, so errors show even if no one tabbed in
function validate() {
	touched.value = true
	return runRules(props.modelValue)
}

defineExpose({ validate })

// the parent error prop overrides local validation, so server errors show cleanly
const displayError = computed(() => props.error || localError.value)

// only show the ✓ once the field's been touched, has rules, has no errors, and isn't empty
const isValid = computed(() =>
	touched.value &&
	props.rules.length > 0 &&
	!displayError.value &&
	(props.modelValue ?? '').trim().length > 0
)
</script>

<template>
	<div :class="['field', { 'field--error': displayError, 'field--valid': isValid, 'field--disabled': disabled, 'field--password': type === 'password' }]">
		<label v-if="label" :for="id" class="field__label">{{ label }}</label>

		<div class="field__input-wrap">
			<input
				:id="id"
				:type="effectiveType"
				:value="modelValue"
				:placeholder="placeholder"
				:disabled="disabled"
				:aria-invalid="!!displayError"
				:aria-describedby="displayError ? `${id}-error` : helper ? `${id}-helper` : undefined"
				class="field__input"
				@input="onInput"
				@blur="onBlur"
			/>

			<!-- indicator cluster: validity mark and/or password reveal toggle, never overlapping -->
			<span class="field__indicators">
				<span v-if="isValid"                      class="field__mark field__mark--valid"   aria-hidden="true">✦</span>
				<span v-else-if="touched && displayError" class="field__mark field__mark--invalid" aria-hidden="true">✕</span>

				<button
					v-if="type === 'password'"
					type="button"
					class="field__reveal"
					:aria-label="revealed ? 'hide password' : 'show password'"
					@click="revealed = !revealed"
				>
					<EyeOff v-if="revealed" :size="18" />
					<Eye    v-else          :size="18" />
				</button>
			</span>
		</div>

		<p v-if="displayError"        :id="`${id}-error`"  class="field__message field__message--error">{{ displayError }}</p>
		<p v-else-if="helper"         :id="`${id}-helper`" class="field__message field__message--helper">{{ helper }}</p>
	</div>
</template>

<style scoped>
.field {
	display:        flex;
	flex-direction: column;
	gap:            var(--space-1);
}

.field__label {
	font-family: var(--font-heading);
	font-size:   var(--text-sm);
	font-weight: 600;
	color:       var(--text-primary);
}

/* wrapper needed for the absolutely positioned validity mark */
.field__input-wrap {
	position: relative;
}

.field__input {
	width:         100%;
	min-height:    44px;
	padding:       0 var(--space-3);
	background:    var(--surface-input, var(--surface-raised));
	color:         var(--text-primary);
	border:        1px solid var(--border-subtle);
	border-radius: var(--radius-md);
	font-family:   var(--font-body);
	font-size:     var(--text-base);
	transition:
		border-color var(--duration-fast) var(--ease-tender),
		box-shadow   var(--duration-fast) var(--ease-tender);
	outline: none;
}

.field__input:focus {
	border-color: var(--accent-warm);
	box-shadow:   0 0 0 3px rgba(237, 177, 176, 0.25);
}

.field__input::placeholder { color: var(--text-muted); }

.field__input:disabled {
	opacity: 0.5;
	cursor:  not-allowed;
}

/* pad the right side to make room for the indicator cluster */
.field--valid .field__input,
.field--error .field__input  { padding-right: var(--space-8); }

/* password fields always reserve room for the reveal toggle, plus extra
   when a validity mark sits alongside it */
.field--password .field__input { padding-right: var(--space-10); }
.field--password.field--valid .field__input,
.field--password.field--error .field__input { padding-right: calc(var(--space-10) + var(--space-6)); }

/* error state */
.field--error .field__input {
	border-color: var(--error-border);
}
.field--error .field__input:focus {
	box-shadow: 0 0 0 3px rgba(92, 4, 3, 0.12);
}

/* valid state: a slate accent for positive feedback, instead of cherry */
.field--valid .field__input {
	border-color: var(--accent-cool);
}
.field--valid .field__input:focus {
	border-color: var(--accent-cool);
	box-shadow:   0 0 0 3px rgba(91, 110, 125, 0.18);
}

/* indicator cluster: holds the validity mark and/or reveal toggle, right-aligned */
.field__indicators {
	position:    absolute;
	right:       var(--space-2);
	top:         50%;
	transform:   translateY(-50%);
	display:     flex;
	align-items: center;
	gap:         var(--space-1);
}

/* state marks: ✦ for valid, ✕ for invalid */
.field__mark {
	font-family: var(--font-heading);
	font-size:   var(--text-sm);
	font-weight: 700;
	pointer-events: none;
	user-select: none;
	padding: 0 var(--space-1);
}

.field__mark--valid   { color: var(--accent-cool);  }
.field__mark--invalid { color: var(--error-text);   }

/* password reveal toggle: quiet by default, warms on hover/focus like the
   other icon-buttons across the app (list delete, navbar, etc.) */
.field__reveal {
	display:         flex;
	align-items:     center;
	justify-content: center;
	background:      transparent;
	border:          none;
	color:           var(--text-muted);
	cursor:          pointer;
	padding:         var(--space-1);
	border-radius:   var(--radius-sm);
	transition:      color var(--duration-fast) var(--ease-tender);
}
.field__reveal:hover  { color: var(--text-primary); }
.field__reveal:focus-visible {
	outline:        2px solid var(--focus-ring);
	outline-offset: 2px;
}

.field__message {
	font-size:   var(--text-xs);
	font-family: var(--font-heading);
	margin:      0;
}
.field__message--error  { color: var(--error-text); }
.field__message--helper { color: var(--text-muted); font-family: var(--font-body); }
</style>
