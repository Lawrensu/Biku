<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute }         from 'vue-router'
import { useAuthStore }     from '../../stores/auth.store.js'
import { useUiStore }       from '../../stores/ui.store.js'
import AppLogo              from '../base/AppLogo.vue'
import {
	LayoutDashboard,
	Images,
	Map,
	List,
	Heart,
	Calendar,
	Shuffle,
	Settings,
	Sun,
	Moon,
	MoreHorizontal,
	X,
} from 'lucide-vue-next'

const route    = useRoute()
const auth     = useAuthStore()
const ui       = useUiStore()

// the 5 primary tabs shown in the mobile bottom bar and sidebar
const primaryNav = [
	{ name: 'dashboard',  label: 'home',      icon: LayoutDashboard },
	{ name: 'memories',   label: 'memories',  icon: Images },
	{ name: 'map',        label: 'map',        icon: Map },
	{ name: 'lists',      label: 'lists',      icon: List },
	{ name: 'mood',       label: 'mood',       icon: Heart },
]

// secondary nav: the full set lives in the desktop sidebar, and the same
// three (dates, randomiser, settings) also show up through the mobile "more"
// sheet, since small screens otherwise give them no entry point at all.
const secondaryNav = [
	{ name: 'dates',      label: 'dates',      icon: Calendar },
	{ name: 'randomiser', label: 'randomiser', icon: Shuffle },
	{ name: 'settings',   label: 'settings',   icon: Settings },
]

// "more" sheet: surfaces the routes that don't have any other home on mobile.
// it closes automatically whenever the route changes, whether that's a link
// tap or the browser's back/forward.
const moreOpen = ref(false)
function toggleMore() { moreOpen.value = !moreOpen.value }
function closeMore()  { moreOpen.value = false }
watch(() => route.name, closeMore)

// active when the current route is one of the sheet's own destinations, so
// the "more" tab itself lights up the same way the other tabs do.
const isMoreActive = computed(() => secondaryNav.some((item) => item.name === route.name))

// derive user initials from display_name for the avatar fallback
const initials = computed(() => {
	const name = auth.user?.displayName || auth.user?.display_name || ''
	return name
		.split(' ')
		.slice(0, 2)
		.map((w) => w[0]?.toUpperCase() ?? '')
		.join('')
})
</script>

<template>
	<!-- mobile: fixed bottom tab bar (under 640px) -->
	<nav class="nav-mobile" aria-label="primary navigation">
		<RouterLink
			v-for="item in primaryNav"
			:key="item.name"
			:to="`/${item.name === 'dashboard' ? 'dashboard' : item.name}`"
			:class="['nav-mobile__item', { 'nav-mobile__item--active': route.name === item.name }]"
			:aria-label="item.label"
		>
			<component :is="item.icon" :size="22" />
			<span class="nav-mobile__label">{{ item.label }}</span>
		</RouterLink>

		<!-- 6th tab opens a slide-up sheet with dates, randomiser and settings,
		     since those routes don't otherwise have an entry point on small screens -->
		<button
			type="button"
			:class="['nav-mobile__item', 'nav-mobile__item--button', { 'nav-mobile__item--active': isMoreActive || moreOpen }]"
			aria-label="more"
			:aria-expanded="moreOpen"
			@click="toggleMore"
		>
			<MoreHorizontal :size="22" />
			<span class="nav-mobile__label">more</span>
		</button>
	</nav>

	<!-- mobile "more" sheet, teleported so it layers above everything else -->
	<Teleport to="body">
		<Transition name="more-sheet-fade">
			<div v-if="moreOpen" class="more-sheet__backdrop" @click="closeMore" />
		</Transition>
		<Transition name="more-sheet-slide">
			<div v-if="moreOpen" class="more-sheet" role="dialog" aria-modal="true" aria-label="more navigation">
				<div class="more-sheet__handle" />
				<div class="more-sheet__header">
					<span class="more-sheet__title">more</span>
					<button type="button" class="more-sheet__close" aria-label="close" @click="closeMore">
						<X :size="20" />
					</button>
				</div>
				<RouterLink
					v-for="item in secondaryNav"
					:key="item.name"
					:to="`/${item.name}`"
					:class="['more-sheet__item', { 'more-sheet__item--active': route.name === item.name }]"
				>
					<component :is="item.icon" :size="20" />
					<span>{{ item.label }}</span>
				</RouterLink>
			</div>
		</Transition>
	</Teleport>

	<!-- tablet + desktop: fixed left sidebar (768px and up) -->
	<nav class="nav-sidebar" aria-label="primary navigation">
		<!-- logo at the top, clicking it navigates back to the dashboard -->
		<RouterLink to="/dashboard" class="nav-sidebar__logo" aria-label="biku home">
			<!-- icon only on tablet, full logo on desktop -->
			<AppLogo class="nav-sidebar__logo--icon" variant="icon" :size="28" />
			<AppLogo class="nav-sidebar__logo--full" variant="full"  :size="32" animate-on-hover />
		</RouterLink>

		<!-- primary links -->
		<ul class="nav-sidebar__list" role="list">
			<li v-for="item in primaryNav" :key="item.name">
				<RouterLink
					:to="`/${item.name}`"
					:class="['nav-sidebar__item', { 'nav-sidebar__item--active': route.name === item.name }]"
					:aria-label="item.label"
				>
					<component :is="item.icon" :size="20" class="nav-sidebar__icon" />
					<span class="nav-sidebar__label">{{ item.label }}</span>
				</RouterLink>
			</li>
		</ul>

		<div class="nav-sidebar__divider" />

		<!-- secondary links -->
		<ul class="nav-sidebar__list" role="list">
			<li v-for="item in secondaryNav" :key="item.name">
				<RouterLink
					:to="`/${item.name}`"
					:class="['nav-sidebar__item', { 'nav-sidebar__item--active': route.name === item.name }]"
					:aria-label="item.label"
				>
					<component :is="item.icon" :size="20" class="nav-sidebar__icon" />
					<span class="nav-sidebar__label">{{ item.label }}</span>
				</RouterLink>
			</li>
		</ul>

		<!-- bottom: dark mode toggle + user avatar -->
		<div class="nav-sidebar__bottom">
			<button
				class="nav-sidebar__theme-btn"
				:aria-label="ui.theme === 'dark' ? 'switch to light mode' : 'switch to dark mode'"
				@click="ui.toggleTheme()"
			>
				<Sun  v-if="ui.theme === 'dark'" :size="20" />
				<Moon v-else                      :size="20" />
				<span class="nav-sidebar__label">{{ ui.theme === 'dark' ? 'light' : 'dark' }}</span>
			</button>

			<RouterLink to="/settings" class="nav-sidebar__avatar" aria-label="settings">
				<img
					v-if="auth.user?.avatarUrl"
					:src="auth.user.avatarUrl"
					:alt="auth.user.displayName"
					class="nav-sidebar__avatar-img"
				/>
				<span v-else class="nav-sidebar__avatar-initials">{{ initials || '?' }}</span>
			</RouterLink>
		</div>
	</nav>
</template>

<style scoped>
/* mobile bottom tab bar */

/*
	going for the iOS/Material "frosted glass" pane look here, since a flat
	opaque strip felt too heavy for this app. it takes three layers to read
	as glass though, especially against our near-uniform dark backgrounds
	where `--surface-card` and `--surface-base` sit close enough in tone that
	a flat translucent tint alone barely shows up:
	  1. a vertical gradient, lighter at the top and denser toward the bottom,
	     so it mimics how a glass pane catches ambient light unevenly and
	     gets some depth instead of looking like a flat tinted slab.
	  2. an inset highlight along the top edge for that light-catch-on-a-rim
	     look, plus a soft outward shadow that lifts the bar off the page.
	  3. backdrop blur with a saturation boost, so whatever sits behind it
	     (images, cards, colour) visibly refracts through. that's really the
	     cue that sells "glass", the tint alone can't carry it.
	`color-mix` keeps all three layers theme-aware without duplicating rules
	per theme, and falls back to a plain translucent tint on browsers that
	don't support `backdrop-filter`.
*/
.nav-mobile {
	display:          flex;
	position:         fixed;
	bottom:           0;
	left:             0;
	right:            0;
	z-index:          100;
	background: linear-gradient(
		180deg,
		color-mix(in srgb, var(--surface-card) 50%, transparent)   0%,
		color-mix(in srgb, var(--surface-card) 80%, transparent) 100%
	);
	-webkit-backdrop-filter: blur(20px) saturate(160%);
	backdrop-filter:         blur(20px) saturate(160%);
	box-shadow:
		inset 0 1px 0 color-mix(in srgb, var(--color-linen) 14%, transparent),
		0 -6px 28px rgba(0, 0, 0, 0.14);
	border-top:       1px solid color-mix(in srgb, var(--border-subtle) 50%, transparent);
	padding-bottom:   env(safe-area-inset-bottom, 0);
}

.nav-mobile__item {
	flex:            1;
	display:         flex;
	flex-direction:  column;
	align-items:     center;
	justify-content: center;
	gap:             2px;
	padding:         var(--space-2) 0;
	color:           var(--text-muted);
	text-decoration: none;
	transition:      color var(--duration-fast) var(--ease-tender);
}

.nav-mobile__item--active,
.nav-mobile__item:hover {
	color: var(--accent-warm);
}

/* the "more" tab is a <button>, not a <RouterLink>, so reset its native
   styles to match its siblings exactly */
.nav-mobile__item--button {
	background: none;
	border:     none;
	cursor:     pointer;
	font:       inherit;
}

.nav-mobile__label {
	font-family: var(--font-heading);
	font-size:   10px;
	font-weight: 600;
}

/* hide the mobile bar from tablet up */
@media (min-width: 768px) {
	.nav-mobile { display: none; }
}


/* "more" sheet (mobile) */

.more-sheet__backdrop {
	position:   fixed;
	inset:      0;
	z-index:    199;
	background: rgba(27, 28, 32, 0.40);
	backdrop-filter: blur(2px);
}

.more-sheet {
	position:        fixed;
	left:            0;
	right:           0;
	bottom:          0;
	z-index:         200;
	display:         flex;
	flex-direction:  column;
	gap:             var(--space-1);
	padding:         var(--space-3) var(--space-5) calc(var(--space-6) + env(safe-area-inset-bottom, 0));
	background:      var(--surface-card);
	border-top-left-radius:  var(--radius-lg);
	border-top-right-radius: var(--radius-lg);
	border:          1px solid var(--border-subtle);
	border-bottom:   none;
	box-shadow:      0 -8px 32px rgba(27, 28, 32, 0.16);
}
[data-theme='dark'] .more-sheet {
	box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.40);
}

/* hide the sheet entirely from tablet up, since those routes already live in the sidebar */
@media (min-width: 768px) {
	.more-sheet,
	.more-sheet__backdrop { display: none; }
}

.more-sheet__handle {
	width:         36px;
	height:        4px;
	border-radius: var(--radius-full);
	background:    var(--border-default);
	margin:        0 auto var(--space-3);
}

.more-sheet__header {
	display:         flex;
	align-items:     center;
	justify-content: space-between;
	margin-bottom:   var(--space-2);
}

.more-sheet__title {
	font-family: var(--font-heading);
	font-size:   var(--text-sm);
	font-weight: 600;
	color:       var(--text-muted);
	letter-spacing: 0.04em;
	text-transform: lowercase;
}

.more-sheet__close {
	display:         flex;
	align-items:     center;
	justify-content: center;
	width:           36px;
	height:          36px;
	border-radius:   50%;
	border:          none;
	background:      var(--surface-raised);
	color:           var(--text-muted);
	cursor:          pointer;
	transition:      color var(--duration-fast) var(--ease-tender),
	                 background var(--duration-fast) var(--ease-tender);
}
.more-sheet__close:hover {
	color:      var(--text-primary);
	background: var(--border-subtle);
}

.more-sheet__item {
	display:         flex;
	align-items:     center;
	gap:             var(--space-4);
	padding:         var(--space-4);
	border-radius:   var(--radius-md);
	color:           var(--text-secondary);
	text-decoration: none;
	font-family:     var(--font-heading);
	font-size:       var(--text-base);
	font-weight:     500;
	transition:      color var(--duration-fast) var(--ease-tender),
	                 background var(--duration-fast) var(--ease-tender);
}
.more-sheet__item--active,
.more-sheet__item:hover {
	color:      var(--accent-warm);
	background: var(--surface-raised);
}

/* backdrop: simple fade */
.more-sheet-fade-enter-active,
.more-sheet-fade-leave-active { transition: opacity var(--duration-normal) var(--ease-tender); }
.more-sheet-fade-enter-from,
.more-sheet-fade-leave-to     { opacity: 0; }

/* sheet: slides up from the bottom edge */
.more-sheet-slide-enter-active,
.more-sheet-slide-leave-active { transition: transform var(--duration-normal) var(--ease-tender); }
.more-sheet-slide-enter-from,
.more-sheet-slide-leave-to     { transform: translateY(100%); }

@media (prefers-reduced-motion: reduce) {
	.more-sheet-fade-enter-active,
	.more-sheet-fade-leave-active,
	.more-sheet-slide-enter-active,
	.more-sheet-slide-leave-active { transition: none; }
}


/* sidebar (tablet + desktop) */

.nav-sidebar {
	display:        none;
	position:       fixed;
	top:            0;
	left:           0;
	bottom:         0;
	z-index:        100;
	flex-direction: column;
	background:     var(--surface-card);
	border-right:   1px solid var(--border-subtle);
	overflow:       hidden;
}

/* show the sidebar from tablet up */
@media (min-width: 768px) {
	.nav-sidebar {
		display: flex;
		width:   64px;      /* icons only */
	}
}

/* expand to full width on desktop */
@media (min-width: 1024px) {
	.nav-sidebar {
		width: 200px;
	}
}

/* wider sidebar on large screens */
@media (min-width: 1280px) {
	.nav-sidebar {
		width: 240px;
	}
}

.nav-sidebar__logo {
	display:         flex;
	align-items:     center;
	justify-content: center;    /* tablet, centre the icon in the 64px strip */
	padding:         var(--space-5) 0 var(--space-4);
	text-decoration: none;      /* reset RouterLink underline */
	color:           inherit;
}

/* show the icon on tablet, the full logo on desktop */
.nav-sidebar__logo--icon { display: block; }
.nav-sidebar__logo--full { display: none;  }

@media (min-width: 1024px) {
	.nav-sidebar__logo {
		justify-content: flex-start;           /* left-align with the nav items */
		padding-left:    var(--space-4);       /* matches .nav-sidebar__item indent */
	}
	.nav-sidebar__logo--icon { display: none;        }
	/*
		this has to be inline-flex, not block. block overrides AppLogo's own
		display: inline-flex, which makes the heart SVG and text stack vertically
		instead of sitting side by side.
	*/
	.nav-sidebar__logo--full { display: inline-flex; }
}

.nav-sidebar__list {
	list-style: none;
	margin:     0;
	padding:    var(--space-2) 0;
}

.nav-sidebar__item {
	display:         flex;
	align-items:     center;
	gap:             var(--space-3);
	padding:         var(--space-3) 0;
	justify-content: center;
	color:           var(--text-muted);
	text-decoration: none;
	font-family:     var(--font-heading);
	font-size:       var(--text-sm);
	font-weight:     500;
	transition:      color var(--duration-fast) var(--ease-tender),
	                 background var(--duration-fast) var(--ease-tender);
	border-radius:   var(--radius-sm);
	margin:          0 var(--space-2);
}

.nav-sidebar__item--active,
.nav-sidebar__item:hover {
	color:      var(--accent-warm);
	background: var(--surface-raised);
}

/* labels hidden on tablet, shown on desktop */
.nav-sidebar__label { display: none; }

@media (min-width: 1024px) {
	.nav-sidebar__label  { display: inline; }
	.nav-sidebar__item   { justify-content: flex-start; padding-left: var(--space-4); }
}

.nav-sidebar__divider {
	margin:     var(--space-2) var(--space-3);
	border-top: 1px solid var(--border-subtle);
}

.nav-sidebar__bottom {
	margin-top:      auto;
	padding:         var(--space-4) 0;
	display:         flex;
	flex-direction:  column;
	align-items:     center;
	gap:             var(--space-3);
}

@media (min-width: 1024px) {
	.nav-sidebar__bottom { align-items: flex-start; padding-left: var(--space-4); }
}

.nav-sidebar__theme-btn {
	display:         flex;
	align-items:     center;
	gap:             var(--space-3);
	padding:         var(--space-2);
	background:      transparent;
	border:          none;
	border-radius:   var(--radius-sm);
	color:           var(--text-muted);
	font-family:     var(--font-heading);
	font-size:       var(--text-sm);
	cursor:          pointer;
	transition:      color var(--duration-fast) var(--ease-tender),
	                 background var(--duration-fast) var(--ease-tender);
}
.nav-sidebar__theme-btn:hover {
	color:      var(--text-primary);
	background: var(--surface-raised);
}

.nav-sidebar__avatar {
	width:           36px;
	height:          36px;
	border-radius:   50%;
	overflow:        hidden;
	background:      var(--accent-warm);
	display:         flex;
	align-items:     center;
	justify-content: center;
	text-decoration: none;
	flex-shrink:     0;
}
.nav-sidebar__avatar-img {
	width:   100%;
	height:  100%;
	object-fit: cover;
}
.nav-sidebar__avatar-initials {
	font-family: var(--font-heading);
	font-size:   var(--text-xs);
	font-weight: 700;
	color:       var(--color-cherry);
}
</style>
