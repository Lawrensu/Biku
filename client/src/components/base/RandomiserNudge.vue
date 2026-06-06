<script setup>
// shared cross-link toward the AI date randomiser, used on the memories and
// dates pages, in both their empty states and their "you've reached the end"
// footers.
//
// design rationale, confirmed with the user: a plain italic sentence read as
// decorative copy rather than something tappable, since "user wouldn't know
// if that sentence is a button." splitting the romantic mood-setting line
// from a clearly bordered pill button solves that. the sentence keeps the
// warm, first-person-plural voice, while the button (warm border, the same
// `Shuffle` icon already used for /randomiser in the nav so it's instantly
// recognisable, plus a hover fill and lift) unambiguously reads as "tap me,
// something fun happens." keeping it as one component means the treatment,
// and any future tweaks, stay consistent everywhere it shows up.
import { Shuffle } from 'lucide-vue-next'

defineProps({
	text: { type: String, required: true },
	cta:  { type: String, default: 'spin something up' },
})
</script>

<template>
	<div class="randomiser-nudge">
		<p class="randomiser-nudge__text">{{ text }}</p>
		<RouterLink to="/randomiser" class="randomiser-nudge__btn">
			<Shuffle :size="15" />
			{{ cta }}
		</RouterLink>
	</div>
</template>

<style scoped>
.randomiser-nudge {
	display:        flex;
	flex-direction: column;
	align-items:    center;
	gap:            var(--space-3);
	text-align:     center;
}

.randomiser-nudge__text {
	margin:      0;
	font-family: var(--font-body);
	font-style:  italic;
	font-size:   var(--text-sm);
	color:       var(--text-muted);
	max-width:   34ch;
}

.randomiser-nudge__btn {
	display:         inline-flex;
	align-items:     center;
	gap:             var(--space-2);
	padding:         var(--space-2) var(--space-5);
	border:          1.5px solid var(--accent-warm);
	border-radius:   var(--radius-full);
	background:      transparent;
	color:           var(--accent-warm);
	font-family:     var(--font-heading);
	font-size:       var(--text-xs);
	font-weight:     700;
	letter-spacing:  0.02em;
	text-decoration: none;
	transition:
		background var(--duration-fast) var(--ease-tender),
		color      var(--duration-fast) var(--ease-tender),
		transform  var(--duration-fast) var(--ease-tender),
		box-shadow var(--duration-fast) var(--ease-tender);
}
.randomiser-nudge__btn:hover {
	background: var(--accent-warm);
	color:      var(--color-cherry);
	transform:  translateY(-1px);
	box-shadow: 0 4px 14px rgba(237, 177, 176, 0.30);
}
.randomiser-nudge__btn:focus-visible {
	outline:        2px solid var(--focus-ring);
	outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
	.randomiser-nudge__btn { transition: none; }
}
</style>
