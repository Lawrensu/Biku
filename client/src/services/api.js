// Base fetch wrapper for all Biku API calls.
//
// All requests include credentials: 'include' so the browser sends the
// httpOnly JWT cookie automatically. The Vite dev server proxies /api/*
// to http://localhost:3000, so no absolute URL is needed.
//
// On a 401 response a custom DOM event is dispatched. App.vue listens for
// it and handles the redirect to /login, which sidesteps a circular import
// (api.js -> router -> stores -> api.js) we'd otherwise run into.


export async function apiFetch(path, options = {}) {
	const response = await fetch(path, {
		...options,
		credentials: 'include',
		headers: {
			'Content-Type': 'application/json',
			...options.headers,
		},
	})


	// Session expired or cookie invalid, so broadcast it and let App.vue react.
	//
	// login and register intentionally return 401 for bad credentials, and that's
	// a normal "try again" moment, not a stale session. If we treated it as one,
	// we'd (a) fire a spurious `biku:unauthorized` that wipes any cached auth state,
	// and (b) throw away the backend's actual message ("invalid credentials") in
	// favour of a flat "Unauthenticated" string, which is exactly the confusing
	// copy that showed up on a failed sign-in. So those two endpoints just fall
	// through to the normal error-parsing path below instead.
	const isCredentialsAttempt = path === '/api/auth/login' || path === '/api/auth/register'

	if (response.status === 401 && !isCredentialsAttempt) {
		window.dispatchEvent(new CustomEvent('biku:unauthorized'))

		const err       = new Error('Unauthenticated')
		err.code        = 'UNAUTHENTICATED'
		err.status      = 401
		throw err
	}

	// No-content responses (e.g. DELETE, logout)
	if (response.status === 204) return null

	const data = await response.json()

	if (!response.ok) {
		const err  = new Error(data.error || 'Request failed')
		err.code   = data.code
		err.status = response.status
		throw err
	}

	return data
}
