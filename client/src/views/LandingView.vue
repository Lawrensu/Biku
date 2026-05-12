<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()
</script>

<template>
	<div class="landing">
		<!-- Breathing ASCII art — sits behind the foreground content -->
		<pre class="landing__art" aria-hidden="true">
  ██████╗ ██╗██╗  ██╗██╗   ██╗
  ██╔══██╗██║██║ ██╔╝██║   ██║
  ██████╔╝██║█████╔╝ ██║   ██║
  ██╔══██╗██║██╔═██╗ ██║   ██║
  ██████╔╝██║██║  ██╗╚██████╔╝
  ╚═════╝ ╚═╝╚═╝  ╚═╝ ╚═════╝

          ♡  ♡  ♡

        ／|    |＼
       ( •‿•)  (•‿• )
       /  づ  づ  \
      ♡ together  ♡
		</pre>

		<!-- Foreground content -->
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

/* ── Breathing ASCII art ────────────────────────────────────────────────────── */

.landing__art {
	position:    absolute;
	inset:       0;
	margin:      0;
	padding:     0;
	display:     flex;
	align-items: center;
	justify-content: center;
	font-family: 'Courier New', monospace;
	font-size:   clamp(6px, 1.2vw, 14px);
	line-height: 1.35;
	color:       var(--color-carbon);
	opacity:     0.14;
	white-space: pre;
	z-index:     0;
	/* Breathing animation */
	animation: breathing 4s ease-in-out infinite;
	transform-origin: center;
	pointer-events: none;
	user-select: none;
}

@keyframes breathing {
	0%, 100% { opacity: 0.12; transform: scale(1.0);   }
	50%       { opacity: 0.22; transform: scale(1.015); }
}

[data-theme='dark'] .landing__art {
	color: var(--color-linen);
}

/* ── Foreground ─────────────────────────────────────────────────────────────── */

.landing__content {
	position:        relative;
	z-index:         1;
	display:         flex;
	flex-direction:  column;
	align-items:     center;
	gap:             var(--space-5);
	text-align:      center;
	padding:         var(--space-8) var(--space-4);
}

.landing__wordmark {
	font-family:   var(--font-heading);
	font-size:     clamp(3rem, 12vw, 7rem);
	font-weight:   800;
	letter-spacing: -0.03em;
	color:         var(--text-primary);
	margin:        0;
	line-height:   1;
}

.landing__tagline {
	font-family:  var(--font-body);
	font-style:   italic;
	font-size:    clamp(var(--text-base), 3vw, var(--text-xl));
	color:        var(--text-secondary);
	margin:       0;
}

.landing__ctas {
	display: flex;
	gap:     var(--space-3);
	flex-wrap: wrap;
	justify-content: center;
}

/* Reuse global .btn classes from main.css — scoped overrides for sizing */
.landing__cta {
	min-width:  140px;
	font-size:  var(--text-base);
	padding:    var(--space-3) var(--space-6);
}

/* ── Reduced-motion: disable breathing ─────────────────────────────────────── */
@media (prefers-reduced-motion: reduce) {
	.landing__art { animation: none; opacity: 0.14; }
}
</style>
