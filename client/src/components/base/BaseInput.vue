<script setup>
// Label is always rendered above the field — never rely on placeholder alone for
// accessibility. The `id` prop links <label :for> to the input.
//
// Validation:
//   Pass `rules` — an array of (value: string) => true | string functions.
//   Errors surface on first blur, then update live on every keystroke.
//   Parent-supplied `error` prop always takes priority (e.g. server errors).
//
// Sanitisation:
//   'email'     — strips spaces, lowercases on every keystroke
//   'no-spaces' — strips all whitespace (passwords, codes)
//   'uppercase' — forces uppercase (invite codes)
import { ref, computed } from 'vue'

const props = defineProps({
	modelValue:  { type: String,  default: '' },
	label:       { type: String,  default: '' },
	type:        { type: String,  default: 'text' },
	placeholder: { type: String,  default: '' },
	error:       { type: String,  default: '' },   // parent-supplied error — takes priority
	helper:      { type: String,  default: '' },   // hint shown below field
	disabled:    { type: Boolean, default: false },
	id:          { type: String,  required: true },
	rules:       { type: Array,   default: () => [] }, // [(v) => true | 'msg']
	sanitize:    { type: String,  default: '' },       // 'email' | 'no-spaces' | 'uppercase'
})

const emit = defineEmits(['update:modelValue'])

// ── Validation state ──────────────────────────────────────────────────────────

const touched    = ref(false)
const localError = ref('')

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

	// Reflect sanitized value back into the DOM if it changed
	// (e.g. user typed a space in a no-spaces field)
	if (sanitized !== raw) e.target.value = sanitized

	emit('update:modelValue', sanitized)
	if (touched.value) runRules(sanitized)
}

function onBlur() {
	touched.value = true
	runRules(props.modelValue)
}

// Called by parent form on submit to show errors even if user never tabbed in
function validate() {
	touched.value = true
	return runRules(props.modelValue)
}

defineExpose({ validate })

// Parent error prop overrides local validation — lets server errors show cleanly
const displayError = computed(() => props.error || localError.value)

// Show ✓ only when: touched, has rules, no errors, and field is non-empty
const isValid = computed(() =>
	touched.value &&
	props.rules.length > 0 &&
	!displayError.value &&
	(props.modelValue ?? '').trim().length > 0
)
</script>

<template>
	<div :class="['field', { 'field--error': displayError, 'field--valid': isValid, 'field--disabled': disabled }]">
		<label v-if="label" :for="id" class="field__label">{{ label }}</label>

		<div class="field__input-wrap">
			<input
				:id="id"
				:type="type"
				:value="modelValue"
				:placeholder="placeholder"
				:disabled="disabled"
				:aria-invalid="!!displayError"
				:aria-describedby="displayError ? `${id}-error` : helper ? `${id}-helper` : undefined"
				class="field__input"
				@input="onInput"
				@blur="onBlur"
			/>
			<span v-if="isValid" class="field__valid-mark" aria-hidden="true">✓</span>
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

/* Wrapper needed for the absolute-positioned valid mark */
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

/* Pad right side to make room for the ✓ mark */
.field--valid .field__input  { padding-right: var(--space-8); }

/* Error state */
.field--error .field__input {
	border-color: var(--error-border);
}
.field--error .field__input:focus {
	box-shadow: 0 0 0 3px rgba(92, 4, 3, 0.12);
}

/* Valid state — slate accent for positive feedback, not cherry */
.field--valid .field__input {
	border-color: var(--accent-cool);
}
.field--valid .field__input:focus {
	border-color: var(--accent-cool);
	box-shadow:   0 0 0 3px rgba(91, 110, 125, 0.18);
}

/* Checkmark badge */
.field__valid-mark {
	position:    absolute;
	right:       var(--space-3);
	top:         50%;
	transform:   translateY(-50%);
	color:       var(--accent-cool);
	font-family: var(--font-heading);
	font-size:   var(--text-sm);
	font-weight: 700;
	pointer-events: none;
	user-select: none;
}

.field__message {
	font-size:   var(--text-xs);
	font-family: var(--font-heading);
	margin:      0;
}
.field__message--error  { color: var(--error-text); }
.field__message--helper { color: var(--text-muted); font-family: var(--font-body); }
</style>
