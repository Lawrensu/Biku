<script setup>
import { useRouter }  from 'vue-router'
import { useUiStore } from '../stores/ui.store.js'
import { Sun, Moon }  from 'lucide-vue-next'

const router = useRouter()
const ui     = useUiStore()
</script>

<template>
	<div class="landing">

		<!-- Theme toggle — fixed top-right, outside the grid columns -->
		<button
			class="landing__theme-btn"
			:aria-label="ui.theme === 'dark' ? 'switch to light mode' : 'switch to dark mode'"
			@click="ui.toggleTheme()"
		>
			<Sun  v-if="ui.theme === 'dark'" :size="18" />
			<Moon v-else                      :size="18" />
		</button>

		<!-- ── Left column: ASCII art ───────────────────────────────────────── -->
		<!--
			Now in its own layout column, so opacity is much higher than when it
			was a subtle backdrop behind the foreground text. The art is the hero
			of this panel — a typographic illustration, not a watermark.
		-->
		<div class="landing__art-panel" aria-hidden="true">
			<pre class="landing__art">
  ____  ___ _  ___  _
 | __ )| | | |/ / || |
 |  _ \| | |   /| || |_
 | |_) | | /   \|__   _|
 |____/|_|/_/|_\  |_|


          .  .  .

        (o)       (o)
        /|\_______/|\
       / |         | \

           together
			</pre>
		</div>

		<!-- ── Right column: content ────────────────────────────────────────── -->
		<div class="landing__content">
			<h1 class="landing__wordmark">biku</h1>
			<p class="landing__tagline">your little world,<br>just the two of you</p>

			<div class="landing__ctas">
				<button class="btn btn--primary landing__cta" @click="router.push('/register')">
					get started
				</button>
				<button class="btn btn--ghost landing__cta landing__signin" @click="router.push('/login')">
					sign in
				</button>
			</div>
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

/* Mobile: collapse to single column, hide the art panel, centre content */
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
	align-items:      center;
	justify-content:  center;
	overflow:         hidden;
	/*
		Very subtle tonal separation from the content panel — same palette but
		slightly warmer, making the art side feel like parchment / a canvas.
	*/
	background:       var(--surface-raised);
	border-right:     1px solid var(--border-subtle);
}

.landing__art {
	font-family:    'Courier New', monospace;
	/*
		Now that the art lives in its own column (not behind text), we can
		scale it to the half-viewport and run it at full intended brightness.
	*/
	font-size:      clamp(10px, 1.8vw, 22px);
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

@keyframes breathing-light {
	0%, 100% { opacity: 0.45; transform: scale(1.0);  }
	50%       { opacity: 0.70; transform: scale(1.02); }
}

[data-theme='dark'] .landing__art {
	color:     var(--color-linen);
	animation: breathing-dark 4s ease-in-out infinite;
}

@keyframes breathing-dark {
	0%, 100% { opacity: 0.35; transform: scale(1.0);  }
	50%       { opacity: 0.55; transform: scale(1.02); }
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
	Wordmark fills the right column gracefully — clamp keeps it from being
	too small on narrow viewports or too enormous on ultrawide screens.
*/
.landing__wordmark {
	font-family:    var(--font-heading);
	font-size:      clamp(3.5rem, 8vw, 8rem);
	font-weight:    800;
	letter-spacing: -0.04em;
	color:          var(--text-primary);
	margin:         0;
	line-height:    1;
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
</style>
