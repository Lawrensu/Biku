<script setup>
// shown on the dashboard (and a slimmer version in settings) while someone
// has set up our space but hasn't joined yet. the point of this card is to
// turn "solo setup mode" from an invisible side effect into something warm
// and on purpose: you can see the code is still sitting there, waiting, and
// you're gently nudged to send it along.
import { Heart } from 'lucide-vue-next'

defineProps({
	code: { type: String, default: '' },
	// the dashboard gets the full card, settings gets a quieter inline strip
	compact: { type: Boolean, default: false },
})
</script>

<template>
	<div class="invite-banner card" :class="{ 'invite-banner--compact': compact }">
		<Heart v-if="!compact" class="invite-banner__icon" :size="20" />
		<div class="invite-banner__body">
			<p class="invite-banner__line">this space is ready and waiting for them.</p>
			<p class="invite-banner__line">
				share <strong class="invite-banner__code">{{ code }}</strong>, and the moment they join, it's ours.
			</p>
		</div>
	</div>
</template>

<style scoped>
.invite-banner {
	display:       flex;
	align-items:   center;
	gap:           var(--space-4);
	margin-bottom: var(--space-6);
	background:    var(--surface-raised);
}

.invite-banner__icon {
	flex-shrink: 0;
	color:       var(--accent-warm);
}

.invite-banner__body {
	display:        flex;
	flex-direction: column;
	gap:            var(--space-1);
}

.invite-banner__line {
	margin:      0;
	font-family: var(--font-body);
	font-size:   var(--text-sm);
	color:       var(--text-secondary);
}

.invite-banner__code {
	font-family:    var(--font-heading);
	font-weight:    800;
	letter-spacing: 0.12em;
	color:          var(--accent-warm);
}

/* settings gets a quieter, single-line treatment that fits inside the
   "our couple" section instead of standing apart as its own card */
.invite-banner--compact {
	margin-bottom: var(--space-4);
	padding:       var(--space-3) var(--space-4);
	background:    transparent;
	border-style:  dashed;
}
.invite-banner--compact .invite-banner__line {
	font-size: var(--text-xs);
	color:     var(--text-muted);
}
</style>
