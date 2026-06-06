<script setup>
import { useRouter }  from 'vue-router'
import { useUiStore } from '../stores/ui.store.js'
import { Sun, Moon }  from 'lucide-vue-next'

const router = useRouter()
const ui     = useUiStore()

// feature-highlight chips beneath the CTAs, phrased as outcomes ("what we get")
// rather than nav labels ("where to click"). four short promises in our
// first-person-plural brand voice. "dates" and "date nights" got merged into
// one so they wouldn't overlap.
const features = ['relive our moments', 'track how you feel', 'plan things together', 'never miss a date']
</script>

<template>
	<div class="landing">

		<!-- theme toggle, fixed to the top-right corner, outside the grid columns -->
		<button
			class="landing__theme-btn"
			:aria-label="ui.theme === 'dark' ? 'switch to light mode' : 'switch to dark mode'"
			@click="ui.toggleTheme()"
		>
			<Sun  v-if="ui.theme === 'dark'" :size="18" />
			<Moon v-else                      :size="18" />
		</button>

		<!-- left column: ASCII art -->
		<!--
			this now lives in its own layout column, so its opacity can sit much
			higher than it did as a subtle backdrop behind the foreground text.
			the art is the hero of this panel: a typographic illustration, not
			a watermark.
		-->
		<div class="landing__art-panel" aria-hidden="true">
			<!-- decorative motif rule, gives the panel a composed top edge instead
			     of leaving the art floating alone in a big empty frame -->
			<div class="landing__art-motif">∿ ≡ ∞ ◇ ◎ ∞ ≡ ∿</div>

			<pre class="landing__art">
       .-.     .-.
      (   \   /   )
       \   \ /   /
        \   V   /
         \     /
          \   /
           \ /
            '

        two hearts,
         one story
			</pre>

			<!-- Mirrored motif at the bottom anchors the panel symmetrically -->
			<div class="landing__art-motif landing__art-motif--bottom">∿ ≡ ∞ ◇ ◎ ∞ ≡ ∿</div>
		</div>

		<!-- right column: content -->
		<div class="landing__content">
			<h1 class="landing__wordmark">biku</h1>
			<p class="landing__tagline">our little world,<br>just the two of us</p>

			<div class="landing__ctas">
				<button class="btn btn--primary landing__cta" @click="router.push('/register')">
					get started
				</button>
				<button class="btn btn--ghost landing__cta landing__signin" @click="router.push('/login')">
					sign in
				</button>
			</div>

			<!-- feature-highlight row, fills the empty space below the CTAs and
			     gives a first taste of what's inside, in our usual first-person-plural voice -->
			<ul class="landing__features" aria-label="what's inside biku">
				<li v-for="f in features" :key="f" class="landing__feature">{{ f }}</li>
			</ul>
		</div>

	</div>
</template>

<style scoped>
/* ── Two-column grid layout ─────────────────────────────────────────────── */

.landing {
	display:    grid;
	grid-template-columns: 1fr 1fr;
	min-height: 100dvh;
	background: var(--surface-base);
	overflow:   hidden;
	position:   relative;
}

/* ── Theme toggle ───────────────────────────────────────────────────────── */

.landing__theme-btn {
	position:        fixed;
	top:             var(--space-5);
	right:           var(--space-5);
	z-index:         10;
	display:         flex;
	align-items:     center;
	justify-content: center;
	width:           44px;
	height:          44px;
	border-radius:   var(--radius-full);
	border:          1px solid var(--border-default);
	background:      var(--surface-card);
	color:           var(--text-muted);
	cursor:          pointer;
	transition:
		color        var(--duration-fast) var(--ease-tender),
		background   var(--duration-fast) var(--ease-tender);
}
.landing__theme-btn:hover {
	color:      var(--text-primary);
	background: var(--surface-raised);
}


/* ── Left: ASCII art panel ──────────────────────────────────────────────── */

.landing__art-panel {
	display:          flex;
	flex-direction:   column;
	align-items:      center;
	/* space-between anchors the motifs near the edges and lets the art settle
	   in the middle, so the panel reads as a composed frame instead of one
	   small island floating in an empty void */
	justify-content:  space-between;
	overflow:         hidden;
	padding:          var(--space-10) 0;
	/*
		a very subtle tonal separation from the content panel: same palette,
		just slightly warmer, so the art side feels like parchment, a canvas
		rather than a plain background.
	*/
	background:       var(--surface-raised);
	border-right:     1px solid var(--border-subtle);
}

/*
	decorative motif rule. reuses the upgraded watermark symbol set so the
	panel's top and bottom edges feel intentional rather than empty. it's
	faint and wide-tracked on purpose, meant as texture, not a focal point.
*/
.landing__art-motif {
	font-family:    "Segoe UI Symbol", "Apple Symbols", "Noto Sans Symbols", serif;
	font-size:      clamp(12px, 1.4vw, 18px);
	letter-spacing: 0.5em;
	color:          var(--color-carbon);
	opacity:        0.18;
	user-select:    none;
	pointer-events: none;
	/* nudge the wide letter-spacing back to optical centre */
	padding-left:   0.5em;
}
[data-theme='dark'] .landing__art-motif {
	color:   var(--color-linen);
	opacity: 0.14;
}

.landing__art {
	font-family:    'Courier New', monospace;
	/*
		Now that the art lives in its own column (not behind text), we can
		scale it to the half-viewport and run it at full intended brightness.
		Ceiling raised 22px → 26px so it carries more presence on wide screens.
	*/
	font-size:      clamp(10px, 1.9vw, 26px);
	line-height:    1.5;
	color:          var(--color-carbon);
	white-space:    pre;
	margin:         0;
	padding:        var(--space-8);
	text-align:     left;
	/* Breathing animation: prominent, not subtle */
	animation:      breathing-light 4s ease-in-out infinite;
	transform-origin: center;
	user-select:    none;
	pointer-events: none;
}

/* a brighter range than the first pass: feedback was "make it more brighter" */
@keyframes breathing-light {
	0%, 100% { opacity: 0.55; transform: scale(1.0);  }
	50%       { opacity: 0.82; transform: scale(1.02); }
}

[data-theme='dark'] .landing__art {
	color:     var(--color-linen);
	animation: breathing-dark 4s ease-in-out infinite;
}

@keyframes breathing-dark {
	0%, 100% { opacity: 0.45; transform: scale(1.0);  }
	50%       { opacity: 0.68; transform: scale(1.02); }
}


/* ── Right: content panel ───────────────────────────────────────────────── */

.landing__content {
	display:        flex;
	flex-direction: column;
	justify-content: center;
	align-items:    flex-start;
	gap:            var(--space-6);
	padding:        var(--space-12) var(--space-12) var(--space-12) var(--space-10);
}

/*
	the wordmark fills the right column gracefully. clamp keeps it from
	going too small on narrow viewports or too huge on ultrawide screens.
*/
.landing__wordmark {
	font-family:    var(--font-heading);
	font-size:      clamp(3.5rem, 8vw, 8rem);
	font-weight:    800;
	letter-spacing: -0.04em;
	margin:         0;
	line-height:    1;
	transform-origin: left center;
	/*
		Two effects layered on one loop: a gentle double-thump scale (the
		"heartbeat") and a slow colour drift toward the blush accent (a warm
		"glow rising"). Together they read as "this word breathes with
		affection" rather than either reading as a gimmick alone.
	*/
	animation: wordmark-heartbeat 3.2s ease-in-out infinite,
	           wordmark-glow      6.4s ease-in-out infinite;
}

@keyframes wordmark-heartbeat {
	0%, 100% { transform: scale(1);     }
	14%      { transform: scale(1.03);  }
	28%      { transform: scale(1);     }
	42%      { transform: scale(1.05);  }
	70%      { transform: scale(1);     }
}

@keyframes wordmark-glow {
	0%, 100%  { color: var(--text-primary); }
	50%       { color: var(--accent-warm);  }
}

@media (prefers-reduced-motion: reduce) {
	.landing__wordmark { animation: none; color: var(--text-primary); }
}

.landing__tagline {
	font-family: var(--font-body);
	font-style:  italic;
	font-size:   clamp(var(--text-base), 2.2vw, var(--text-xl));
	color:       var(--text-secondary);
	margin:      0;
	max-width:   26ch;
	line-height: var(--leading-relaxed);
}

.landing__ctas {
	display:         flex;
	gap:             var(--space-4);
	flex-wrap:       wrap;
	justify-content: flex-start;
	margin-top:      var(--space-2);
}

.landing__cta {
	min-width: 148px;
	padding:   var(--space-4) var(--space-7);
	font-size: var(--text-base);
}


/* feature-highlight row */
/*
	fills the empty space below the CTAs and gives a quick preview of what's
	inside, a warm "here's what we share" instead of empty canvas. it reuses
	the chip/tag visual language we already use elsewhere (randomiser tags,
	dates chips).
*/
.landing__features {
	display:    flex;
	flex-wrap:  wrap;
	gap:        var(--space-2);
	list-style: none;
	margin:     var(--space-4) 0 0;
	padding:    0;
}

.landing__feature {
	padding:        var(--space-2) var(--space-4);
	background:     var(--surface-raised);
	border:         1px solid var(--border-subtle);
	border-radius:  var(--radius-full);
	font-family:    var(--font-heading);
	font-size:      var(--text-xs);
	font-weight:    600;
	color:          var(--text-muted);
	letter-spacing: 0.02em;
}

/* Ghost "sign in" button: always visible border, full-white text in dark mode */
.landing__signin {
	border: 1px solid var(--border-default);
}
[data-theme='dark'] .landing__signin {
	border-color: rgba(250, 241, 232, 0.30);
	color:        var(--text-primary);
}


/* ── Reduced-motion ─────────────────────────────────────────────────────── */
@media (prefers-reduced-motion: reduce) {
	.landing__art { animation: none; opacity: 0.55; }
}


/*
	mobile overrides

	placement matters here: this block needs to be the LAST `.landing__content`
	/ `.landing__tagline` / `.landing__ctas` / `.landing__features` rule in the
	file. Scoped CSS gives every one of these selectors equal specificity, so
	when two rules for the same selector both match (say the base
	`.landing__content { align-items: flex-start }` and this query's
	`align-items: center`), the browser settles the tie by source order. the
	later declaration wins no matter whether it's inside a media query or not.
	this block used to sit near the top of the stylesheet, so the later base
	rules quietly won out instead: the wordmark and tagline stayed left-aligned
	(inheriting `align-items: flex-start`) while only the CTAs and chips looked
	centred, because those use their own selectors that don't conflict.
	moving this block to the end gives it the final say, as intended.
*/
@media (max-width: 767px) {
	.landing {
		grid-template-columns: 1fr;
	}
	.landing__art-panel {
		display: none;
	}
	.landing__content {
		align-items: center;
		text-align:  center;
		padding:     var(--space-12) var(--space-6);
	}
	.landing__tagline { max-width: 28ch; }
	.landing__ctas    { justify-content: center; }

	/*
		Chips inherit `justify-content: flex-start` from the base rule, which
		breaks the centred symmetry every other element on mobile already has.
		Centre them too, and tighten gap/max-width so four short outcome-phrases
		settle into a clean, even 2-row grid rather than a ragged wrap.
	*/
	.landing__features {
		justify-content: center;
		max-width:       38ch;
		margin-left:     auto;
		margin-right:    auto;
	}
}
</style>
