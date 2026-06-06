import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
	fetchMe  as apiFetchMe,
	login    as apiLogin,
	register as apiRegister,
	logout   as apiLogout,
} from '../services/auth.service.js'


export const useAuthStore = defineStore('auth', () => {
	const user     = ref(null)
	// Tracks whether we've already resolved auth state this session.
	// The router guard calls fetchMe() on every navigation, so this flag
	// stops it from firing the same request over and over once we already know.
	const _fetched = ref(false)


	const isLoggedIn = computed(() => !!user.value)
	const isPaired   = computed(() => !!user.value?.coupleId)


	// Resolves current auth state from the server. Called by the router guard.
	// Pass force = true to bypass the cache (e.g. after pairing).
	//
	// _fetched is always set to true in the finally block so repeated navigations
	// don't fire redundant network requests once auth state is known (logged-in or
	// not). clearUser() resets it to false so an explicit logout or a page refresh
	// forces a fresh check on the very next navigation.
	async function fetchMe(force = false) {
		if (_fetched.value && !force) return

		try {
			const data = await apiFetchMe()
			user.value = data.user
		} catch {
			// 401 is handled globally in apiFetch (dispatches biku:unauthorized).
			// any other error means we still can't confirm auth, so just treat them as a guest
			user.value = null
		} finally {
			_fetched.value = true
		}
	}


	async function login(email, password) {
		const data     = await apiLogin(email, password)
		user.value     = data.user
		_fetched.value = true
	}


	async function register(email, password, displayName) {
		const data     = await apiRegister(email, password, displayName)
		user.value     = data.user
		_fetched.value = true
	}


	async function logout() {
		await apiLogout()
		clearUser()
	}


	// Called by App.vue when the global 'biku:unauthorized' event fires
	function clearUser() {
		user.value     = null
		_fetched.value = false
	}


	return {
		user,
		isLoggedIn,
		isPaired,
		fetchMe,
		login,
		register,
		logout,
		clearUser,
	}
})
