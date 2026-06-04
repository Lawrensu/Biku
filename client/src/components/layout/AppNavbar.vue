<script setup>
import { computed }         from 'vue'
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
} from 'lucide-vue-next'

const route    = useRoute()
const auth     = useAuthStore()
const ui       = useUiStore()

// The 5 primary tabs shown in the mobile bottom bar and sidebar
const primaryNav = [
	{ name: 'dashboard',  label: 'home',      icon: LayoutDashboard },
	{ name: 'memories',   label: 'memories',  icon: Images },
	{ name: 'map',        label: 'map',        icon: Map },
	{ name: 'lists',      label: 'lists',      icon: List },
	{ name: 'mood',       label: 'mood',       icon: Heart },
]

// Secondary nav shown only in the expanded desktop sidebar
const secondaryNav = [
	{ name: 'dates',      label: 'dates',      icon: Calendar },
	{ name: 'randomiser', label: 'randomiser', icon: Shuffle },
	{ name: 'settings',   label: 'settings',   icon: Settings },
]

// Derive user initials from display_name for the avatar fallback
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
	<!-- ── Mobile: fixed bottom tab bar (< 640px) ───────────────────────────── -->
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
	</nav>

	<!-- ── Tablet + Desktop: fixed left sidebar (≥ 768px) ──────────────────── -->
	<nav class="nav-sidebar" aria-label="primary navigation">
		<!-- Logo at the top -->
		<div class="nav-sidebar__logo">
			<!-- Icon-only on tablet, full logo on desktop -->
			<AppLogo class="nav-sidebar__logo--icon" variant="icon" :size="28" />
			<AppLogo class="nav-sidebar__logo--full" variant="full"  :size="24" />
		</div>

		<!-- Primary links -->
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

		<!-- Secondary links -->
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

		<!-- Bottom: dark mode toggle + user avatar -->
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
/* ── Mobile bottom tab bar ─────────────────────────────────────────────────── */

.nav-mobile {
	display:          flex;
	position:         fixed;
	bottom:           0;
	left:             0;
	right:            0;
	z-index:          100;
	background:       var(--surface-card);
	border-top:       1px solid var(--border-subtle);
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

.nav-mobile__label {
	font-family: var(--font-heading);
	font-size:   10px;
	font-weight: 600;
}

/* Hide mobile bar on tablet and up */
@media (min-width: 768px) {
	.nav-mobile { display: none; }
}


/* ── Sidebar (tablet + desktop) ────────────────────────────────────────────── */

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

/* Show sidebar from tablet up */
@media (min-width: 768px) {
	.nav-sidebar {
		display: flex;
		width:   64px;      /* icons only */
	}
}

/* Expand to full width on desktop */
@media (min-width: 1024px) {
	.nav-sidebar {
		width: 200px;
	}
}

/* Wider sidebar on large screens */
@media (min-width: 1280px) {
	.nav-sidebar {
		width: 240px;
	}
}

.nav-sidebar__logo {
	display:         flex;
	align-items:     center;
	justify-content: center;
	padding:         var(--space-5) 0 var(--space-4);
}

/* Show icon on tablet, full logo on desktop */
.nav-sidebar__logo--icon { display: block; }
.nav-sidebar__logo--full { display: none;  }

@media (min-width: 1024px) {
	.nav-sidebar__logo--icon { display: none;  }
	.nav-sidebar__logo--full { display: block; padding-left: var(--space-4); }
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

/* Labels hidden on tablet, shown on desktop */
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
