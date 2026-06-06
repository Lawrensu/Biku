<script setup>
/*
	custom listbox that replaces the native <select>.

	the native <select> option list is rendered by the OS/browser and can't be
	restyled cross-platform (colours, hover states, radius and fonts all stay
	system chrome), so this component gives us full control and lets dropdowns
	feel like the rest of the app instead of a bare OS popup. the pattern
	mirrors the Nominatim place-search dropdown in MemoryFormView
	(`mem-geo-results`): a button trigger plus an absolutely positioned,
	styled <ul role="listbox">.
*/
import { ref, computed, onBeforeUnmount } from 'vue'
import { ChevronDown } from 'lucide-vue-next'

const props = defineProps({
	modelValue: { type: [String, Number], default: '' },
	options:    { type: Array,  required: true },  // [{ label, value }]
	id:         { type: String, default: '' },
	label:      { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue'])

const open      = ref(false)
const root      = ref(null)
const activeIdx = ref(-1)

const selected = computed(() =>
	props.options.find((o) => o.value === props.modelValue) ?? props.options[0],
)


function toggle() {
	open.value = !open.value
	if (open.value) {
		activeIdx.value = props.options.findIndex((o) => o.value === props.modelValue)
	}
}


function choose(option) {
	emit('update:modelValue', option.value)
	open.value = false
}


// click outside to close
function onDocClick(e) {
	if (root.value && !root.value.contains(e.target)) open.value = false
}
document.addEventListener('click', onDocClick)
onBeforeUnmount(() => document.removeEventListener('click', onDocClick))


// minimal keyboard support: arrows move, enter/space selects, escape closes
function onKeydown(e) {
	if (e.key === 'Escape') { open.value = false; return }
	if (e.key === 'Enter' || e.key === ' ') {
		e.preventDefault()
		if (open.value && activeIdx.value >= 0) choose(props.options[activeIdx.value])
		else toggle()
		return
	}
	if (e.key === 'ArrowDown') {
		e.preventDefault()
		if (!open.value) { open.value = true; activeIdx.value = 0; return }
		activeIdx.value = Math.min(activeIdx.value + 1, props.options.length - 1)
	}
	if (e.key === 'ArrowUp') {
		e.preventDefault()
		if (!open.value) { open.value = true; activeIdx.value = props.options.length - 1; return }
		activeIdx.value = Math.max(activeIdx.value - 1, 0)
	}
}
</script>

<template>
	<div ref="root" class="base-select" :class="{ 'base-select--open': open }">
		<label v-if="label" :for="id" class="base-select__label">{{ label }}</label>

		<button
			:id="id"
			type="button"
			class="base-select__trigger"
			:aria-expanded="open"
			aria-haspopup="listbox"
			@click="toggle"
			@keydown="onKeydown"
		>
			<span class="base-select__value">{{ selected?.label }}</span>
			<ChevronDown :size="16" class="base-select__chevron" />
		</button>

		<Transition name="base-select-pop">
			<ul v-if="open" class="base-select__list" role="listbox">
				<li
					v-for="(o, i) in options"
					:key="o.value"
					role="option"
					:aria-selected="o.value === modelValue"
					:class="[
						'base-select__option',
						{
							'base-select__option--selected': o.value === modelValue,
							'base-select__option--active':   i === activeIdx,
						},
					]"
					@click="choose(o)"
					@mouseenter="activeIdx = i"
				>
					{{ o.label }}
				</li>
			</ul>
		</Transition>
	</div>
</template>

<style scoped>
.base-select {
	position: relative;
	flex:     1;
}

.base-select__label {
	display:     block;
	font-family: var(--font-heading);
	font-size:   var(--text-sm);
	font-weight: 600;
	color:       var(--text-primary);
	margin-bottom: var(--space-1);
}

.base-select__trigger {
	display:         flex;
	align-items:     center;
	justify-content: space-between;
	gap:             var(--space-2);
	width:           100%;
	height:          40px;
	padding:         0 var(--space-3);
	background:      var(--surface-raised);
	color:           var(--text-primary);
	border:          1px solid var(--border-subtle);
	border-radius:   var(--radius-md);
	font-family:     var(--font-body);
	font-size:       var(--text-sm);
	cursor:          pointer;
	text-align:      left;
	transition:      border-color var(--duration-fast) var(--ease-tender),
	                 background   var(--duration-fast) var(--ease-tender);
}

.base-select__trigger:hover { background: var(--surface-elevated); }

.base-select--open .base-select__trigger,
.base-select__trigger:focus-visible {
	border-color: var(--accent-warm);
	outline:      none;
}

.base-select__value {
	overflow:      hidden;
	white-space:   nowrap;
	text-overflow: ellipsis;
	text-transform: lowercase;
}

.base-select__chevron {
	flex-shrink: 0;
	color:       var(--text-muted);
	transition:  transform var(--duration-fast) var(--ease-tender);
}
.base-select--open .base-select__chevron { transform: rotate(180deg); color: var(--accent-warm); }

.base-select__list {
	position:      absolute;
	top:           calc(100% + var(--space-1));
	left:          0;
	right:         0;
	z-index:       50;
	list-style:    none;
	margin:        0;
	padding:       var(--space-1);
	background:    var(--surface-elevated);
	border:        1px solid var(--border-default);
	border-radius: var(--radius-md);
	box-shadow:    0 8px 24px rgba(27, 28, 32, 0.14);
	overflow:      hidden;
	max-height:    240px;
	overflow-y:    auto;
}

.base-select__option {
	padding:        var(--space-2) var(--space-3);
	border-radius:  var(--radius-sm);
	font-family:    var(--font-body);
	font-size:      var(--text-sm);
	color:          var(--text-secondary);
	text-transform: lowercase;
	cursor:         pointer;
	transition:     background var(--duration-fast) var(--ease-tender),
	                color      var(--duration-fast) var(--ease-tender);
}

.base-select__option--active {
	background: var(--surface-raised);
	color:      var(--text-primary);
}

.base-select__option--selected {
	color:       var(--color-cherry);
	font-weight: 600;
}
.base-select__option--selected.base-select__option--active {
	background: var(--accent-warm);
	color:      var(--color-cherry);
}

/* pop-in transition: a quick fade plus a slight rise, matching the warm/tender easing elsewhere */
.base-select-pop-enter-active,
.base-select-pop-leave-active {
	transition: opacity var(--duration-fast) var(--ease-tender),
	            transform var(--duration-fast) var(--ease-tender);
}
.base-select-pop-enter-from,
.base-select-pop-leave-to {
	opacity:   0;
	transform: translateY(-4px) scale(0.98);
}
</style>
