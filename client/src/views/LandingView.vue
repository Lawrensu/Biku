<script setup>
import { useRouter }    from 'vue-router'
import { useUiStore }   from '../stores/ui.store.js'
import { Sun, Moon }    from 'lucide-vue-next'

const router = useRouter()
const ui     = useUiStore()
</script>

<template>
	<div class="landing">

		<!-- Theme toggle — top-right, always accessible from the first screen -->
		<button
			class="landing__theme-btn"
			:aria-label="ui.theme === 'dark' ? 'switch to light mode' : 'switch to dark mode'"
			@click="ui.toggleTheme()"
		>
			<Sun  v-if="ui.theme === 'dark'" :size="18" />
			<Moon v-else                      :size="18" />
		</button>

		<!-- Breathing ASCII art — full-canvas backdrop, sits behind foreground -->
		<pre class="landing__art" aria-hidden="true">
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

		<!-- Foreground content — centred vertically and horizontally -->
		<div class="landing__content">
			<h1 class="landing__wordmark">biku</h1>
			<p class="landing__tagline">your little world, just the two of you</p>

			<div class="landing__ctas">
				<button class="btn btn--primary landing__cta" @click="router.push('/register')">
					get started
				</button>
				<button class="btn btn--ghost landing__cta" @click="router.push('/login')">
					sign in
				</button>
			</div>
		</div>
	</div>
</template>

<style scoped>
.landing {
	position:        relative;
	min-height:      100dvh;
	background:      var(--surface-base);
	display:         flex;
	align-items:     center;
	justify-content: center;
	overflow:        hidden;
}

/* -- Theme toggle ----------------------------------------------------------- */

.landing__theme-btn {
	position:      fixed;
	top:           var(--space-5);
	right:         var(--space-5);
	z-index:       10;
	display:       flex;
	align-items:   center;
	justify-content: center;
	width:         44px;
	height:        44px;
	border-radius: var(--radius-full);
	border:        1px solid var(--border-default);
	background:    var(--surface-card);
	color:         var(--text-muted);
	cursor:        pointer;
	transition:
		color       var(--duration-fast) var(--ease-tender),
		background  var(--duration-fast) var(--ease-tender),
		border-color var(--duration-fast) var(--ease-tender);
}

.landing__theme-btn:hover {
	color:        var(--text-primary);
	background:   var(--surface-raised);
}

/* -- Breathing ASCII art --------------------------------------------------- */

.landing__art {
	position:    absolute;
	inset:       0;
	margin:      0;
	padding:     0;
	display:     flex;
	align-items: center;
	justify-content: center;
	font-family: 'Courier New', monospace;
	/*
		Large enough that the ASCII art fills the viewport as a dramatic backdrop.
		clamp: 12px on very small screens, scales to ~2.6vw, caps at 32px.
	*/
	font-size:   clamp(12px, 2.6vw, 32px);
	line-height: 1.45;
	color:       var(--color-carbon);
	opacity:     0.15;
	white-space: pre;
	z-index:     0;
	animation: breathing 4s ease-in-out infinite;
	transform-origin: center;
	pointer-events: none;
	user-select: none;
}

@keyframes breathing {
	0%, 100% { opacity: 0.12; transform: scale(1.0);   }
	50%       { opacity: 0.24; transform: scale(1.02); }
}

[data-theme='dark'] .landing__art {
	color: var(--color-linen);
}

/* -- Foreground ------------------------------------------------------------- */

.landing__content {
	position:        relative;
	z-index:         1;
	display:         flex;
	flex-direction:  column;
	align-items:     center;
	gap:             var(--space-6);
	text-align:      center;
	padding:         var(--space-12) var(--space-6);
}

/*
	The wordmark is the single most dominant element on the page.
	At 1440px it renders at ~140px — large enough to feel like a brand moment.
*/
.landing__wordmark {
	font-family:    var(--font-heading);
	font-size:      clamp(4.5rem, 16vw, 10rem);
	font-weight:    800;
	letter-spacing: -0.04em;
	color:          var(--text-primary);
	margin:         0;
	line-height:    1;
}

.landing__tagline {
	font-family:  var(--font-body);
	font-style:   italic;
	font-size:    clamp(var(--text-lg), 3.5vw, var(--text-2xl));
	color:        var(--text-secondary);
	margin:       0;
	max-width:    36ch;
}

.landing__ctas {
	display:         flex;
	gap:             var(--space-4);
	flex-wrap:       wrap;
	justify-content: center;
	margin-top:      var(--space-2);
}

.landing__cta {
	min-width:   160px;
	font-size:   var(--text-base);
	padding:     var(--space-4) var(--space-8);
	font-size:   var(--text-base);
}

/* -- Reduced-motion: disable breathing ------------------------------------- */
@media (prefers-reduced-motion: reduce) {
	.landing__art { animation: none; opacity: 0.14; }
}
</style>
