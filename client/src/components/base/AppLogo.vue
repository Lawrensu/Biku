<script setup>
import { computed } from 'vue'

const props = defineProps({
	// 'full' shows the heart icon + "biku" wordmark side by side
	// 'icon' shows only the heart mark (for collapsed sidebar, favicon contexts)
	// 'wordmark' shows only the text
	variant: {
		type:    String,
		default: 'full',
		validator: (v) => ['full', 'icon', 'wordmark'].includes(v),
	},
	// size in pixels applied to the icon mark
	size: {
		type:    Number,
		default: 24,
	},
	// when true, hovering the logo plays a looping "comes alive" animation:
	// the heart does a synchronised beat while each letter in "biku" lifts in
	// a staggered sequential bounce, and both stop cleanly on hover-out.
	// gated behind a prop so other usages of AppLogo aren't affected.
	animateOnHover: {
		type:    Boolean,
		default: false,
	},
})

const letters = computed(() => 'biku'.split(''))
</script>

<template>
	<span
		class="app-logo"
		:class="[`app-logo--${variant}`, { 'app-logo--hoverable': animateOnHover }]"
		aria-label="biku"
	>

		<!-- heart mark SVG, inline so it inherits the colour context -->
		<svg
			v-if="variant !== 'wordmark'"
			:width="size"
			:height="size"
			viewBox="0 0 32 32"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			aria-hidden="true"
			class="app-logo__mark"
		>
			<path
				d="M16 26C16 26 5 18.5 5 12C5 9.24 7.24 7 10 7C11.88 7 13.54 8.04 14.44 9.6L16 12L17.56 9.6C18.46 8.04 20.12 7 22 7C24.76 7 27 9.24 27 12C27 18.5 16 26 16 26Z"
				fill="#EDB1B0"
			/>
			<circle cx="16" cy="13" r="2.5" fill="#5C0403" opacity="0.15"/>
		</svg>

		<!--
			wordmark in Plus Jakarta Sans, lowercase, tracking-wide.
			when animateOnHover is on, it's split into per-letter spans so each
			one can bounce on its own staggered delay, driven by the --i custom
			property.
		-->
		<span v-if="variant !== 'icon' && animateOnHover" class="app-logo__wordmark app-logo__wordmark--lettered">
			<span
				v-for="(letter, i) in letters"
				:key="i"
				class="app-logo__letter"
				:style="{ '--i': i }"
			>{{ letter }}</span>
		</span>
		<span v-else-if="variant !== 'icon'" class="app-logo__wordmark">
			biku
		</span>

	</span>
</template>

<style scoped>
.app-logo {
	display:     inline-flex;
	align-items: center;
	gap:         var(--space-3);  /* bumped from space-2 for more breathing room at larger scale */
	user-select: none;
}

.app-logo__wordmark {
	font-family:    var(--font-heading);
	font-weight:    500;
	letter-spacing: 0.01em;
	color:          var(--text-primary);
	line-height:    1;
}

/*
	full variant: the wordmark sits at a fixed, prominent size, decoupled from
	the icon size so it stays readable no matter how the icon is scaled.
	it used to be calc(size * 0.65px), which worked out to about 15.6px at
	size=24, way too small.
*/
.app-logo--full .app-logo__wordmark {
	font-size: var(--text-xl);   /* 20px, readable and confident without overpowering */
}

/* wordmark-only variant follows the icon size for flexibility */
.app-logo--wordmark .app-logo__wordmark {
	font-size: calc(v-bind(size) * 0.8px);
}


/* hover-to-life animation, gated behind the animateOnHover prop */
/*
	the idea is "the whole logo comes alive together": the heart does a small
	synchronised beat while each letter lifts in a staggered sequential bounce,
	looping until the cursor leaves. then both just stop cleanly, since the
	animation rule no longer matches and everything settles back to rest.
*/
.app-logo__wordmark--lettered { display: inline-flex; }

.app-logo__letter {
	display: inline-block;
}

.app-logo--hoverable:hover .app-logo__mark {
	animation:        app-logo-heartbeat 1.1s ease-in-out infinite;
	transform-origin: 50% 50%;
}

@keyframes app-logo-heartbeat {
	0%, 100% { transform: scale(1);    }
	25%      { transform: scale(1.12); }
	40%      { transform: scale(1);    }
	55%      { transform: scale(1.16); }
	75%      { transform: scale(1);    }
}

.app-logo--hoverable:hover .app-logo__letter {
	animation:       app-logo-letter-bounce 1s ease-in-out infinite;
	/* stagger by index, so each letter lifts a beat after the one before it */
	animation-delay: calc(var(--i) * 0.09s);
}

@keyframes app-logo-letter-bounce {
	0%, 60%, 100% { transform: translateY(0);    }
	30%           { transform: translateY(-5px); }
}

@media (prefers-reduced-motion: reduce) {
	.app-logo--hoverable:hover .app-logo__mark,
	.app-logo--hoverable:hover .app-logo__letter {
		animation: none;
	}
}
</style>
