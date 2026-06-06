import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth.store.js'


// ─────────────────────────────────────────────────────────────────────────────
// Route definitions
// All view imports are dynamic (code-split), so each view only loads when it's needed.
// meta flags:
//   requiresAuth   redirects to /login if you're not logged in
//   requiresUnauth redirects to /dashboard if you're already logged in (login/register pages)
//   requiresPaired redirects to /pair if you're logged in but not yet paired
//   hideNav        hides AppNavbar (landing, auth, pair flows)
// ─────────────────────────────────────────────────────────────────────────────

const routes = [
	{
		path:      '/',
		name:      'landing',
		component: () => import('../views/LandingView.vue'),
		meta:      { hideNav: true },
	},
	{
		path:      '/register',
		name:      'register',
		component: () => import('../views/RegisterView.vue'),
		meta:      { requiresUnauth: true, hideNav: true },
	},
	{
		path:      '/login',
		name:      'login',
		component: () => import('../views/LoginView.vue'),
		meta:      { requiresUnauth: true, hideNav: true },
	},
	{
		path:      '/pair',
		name:      'pair',
		component: () => import('../views/PairView.vue'),
		meta:      { requiresAuth: true, hideNav: true },
	},
	{
		path:      '/dashboard',
		name:      'dashboard',
		component: () => import('../views/DashboardView.vue'),
		meta:      { requiresAuth: true },
	},
	{
		path:      '/memories',
		name:      'memories',
		component: () => import('../views/MemoriesView.vue'),
		meta:      { requiresAuth: true, requiresPaired: true },
	},
	{
		path:      '/memories/new',
		name:      'memory-new',
		component: () => import('../views/MemoryFormView.vue'),
		meta:      { requiresAuth: true, requiresPaired: true },
	},
	{
		path:      '/memories/:id',
		name:      'memory-detail',
		component: () => import('../views/MemoryDetailView.vue'),
		meta:      { requiresAuth: true, requiresPaired: true },
	},
	{
		path:      '/map',
		name:      'map',
		component: () => import('../views/MapView.vue'),
		meta:      { requiresAuth: true, requiresPaired: true },
	},
	{
		path:      '/lists',
		name:      'lists',
		component: () => import('../views/ListsView.vue'),
		meta:      { requiresAuth: true, requiresPaired: true },
	},
	{
		path:      '/mood',
		name:      'mood',
		component: () => import('../views/MoodView.vue'),
		meta:      { requiresAuth: true, requiresPaired: true },
	},
	{
		path:      '/dates',
		name:      'dates',
		component: () => import('../views/DatesView.vue'),
		meta:      { requiresAuth: true, requiresPaired: true },
	},
	{
		path:      '/randomiser',
		name:      'randomiser',
		component: () => import('../views/RandomiserView.vue'),
		meta:      { requiresAuth: true, requiresPaired: true },
	},
	{
		path:      '/settings',
		name:      'settings',
		component: () => import('../views/SettingsView.vue'),
		meta:      { requiresAuth: true, requiresPaired: true },
	},
	// catch-all: send unknown paths back to the landing page
	{
		path:      '/:pathMatch(.*)*',
		redirect:  '/',
	},
]


const router = createRouter({
	history: createWebHistory(),
	routes,
	scrollBehavior(_to, _from, savedPosition) {
		// Restore scroll position on back/forward; scroll to top otherwise
		return savedPosition ?? { top: 0 }
	},
})


// ─────────────────────────────────────────────────────────────────────────────
// Navigation guard
//
// The order of these checks matters. We go from most restrictive to least:
//   1. make sure auth state is hydrated (fetchMe is idempotent after the first call)
//   2. requiresAuth: unauthenticated visitors can only reach public pages
//   3. requiresUnauth: logged-in users shouldn't land back on login/register
//   4. requiresPaired: unpaired users get sent to /pair to finish setup
// ─────────────────────────────────────────────────────────────────────────────

router.beforeEach(async (to) => {
	// Pinia stores are not available until after createPinia() has run; we
	// import the store lazily here so the router can be instantiated first.
	const auth = useAuthStore()

	// Hydrate auth state from the server cookie exactly once per session
	await auth.fetchMe()

	const loggedIn = auth.isLoggedIn
	const paired   = auth.isPaired

	// Unauthenticated user trying to reach a protected page
	if (to.meta.requiresAuth && !loggedIn) {
		return { name: 'login', query: { redirect: to.fullPath } }
	}

	// Authenticated user trying to reach login/register
	if (to.meta.requiresUnauth && loggedIn) {
		return { name: 'dashboard' }
	}

	// logged in but not paired yet, so send them to /pair to finish setup
	// (the dashboard is the one exception, it works fine unpaired with an onboarding state)
	if (to.meta.requiresPaired && loggedIn && !paired) {
		return { name: 'pair' }
	}

	// already paired, so there's no reason to land back on /pair
	if (to.name === 'pair' && loggedIn && paired) {
		return { name: 'dashboard' }
	}
})


export default router
