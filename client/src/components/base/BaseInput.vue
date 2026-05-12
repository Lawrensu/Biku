<script setup>
// Label is always rendered above the field — never rely on placeholder alone for
// accessibility. The `id` prop links <label :for> to the input.
defineProps({
	modelValue:  { type: String,  default: '' },
	label:       { type: String,  default: '' },
	type:        { type: String,  default: 'text' },
	placeholder: { type: String,  default: '' },
	error:       { type: String,  default: '' },   // non-empty → error state
	helper:      { type: String,  default: '' },   // hint shown below field
	disabled:    { type: Boolean, default: false },
	id:          { type: String,  required: true },
})

defineEmits(['update:modelValue'])
</script>

<template>
	<div :class="['field', { 'field--error': error, 'field--disabled': disabled }]">
		<label v-if="label" :for="id" class="field__label">{{ label }}</label>

		<input
			:id="id"
			:type="type"
			:value="modelValue"
			:placeholder="placeholder"
			:disabled="disabled"
			:aria-invalid="!!error"
			:aria-describedby="error ? `${id}-error` : helper ? `${id}-helper` : undefined"
			class="field__input"
			@input="$emit('update:modelValue', $event.target.value)"
		/>

		<p v-if="error"  :id="`${id}-error`"  class="field__message field__message--error">{{ error }}</p>
		<p v-if="helper && !error" :id="`${id}-helper`" class="field__message field__message--helper">{{ helper }}</p>
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
	transition:    border-color var(--duration-fast) var(--ease-tender),
	               box-shadow   var(--duration-fast) var(--ease-tender);
	outline:       none;
}

.field__input:focus {
	border-color: var(--accent-warm);
	box-shadow:   0 0 0 3px var(--focus-ring);
}

.field__input::placeholder {
	color: var(--text-muted);
}

.field__input:disabled {
	opacity: 0.5;
	cursor:  not-allowed;
}

/* Error state overrides the border */
.field--error .field__input {
	border-color: var(--error-border);
}
.field--error .field__input:focus {
	box-shadow: 0 0 0 3px color-mix(in srgb, var(--error-border) 25%, transparent);
}

.field__message {
	font-size: var(--text-xs);
	margin:    0;
}
.field__message--error  { color: var(--error-text); }
.field__message--helper { color: var(--text-muted); }
</style>
