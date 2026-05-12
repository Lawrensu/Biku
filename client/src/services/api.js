// Base fetch wrapper for all Biku API calls.
//
// All requests include credentials: 'include' so the browser sends the
// httpOnly JWT cookie automatically. The Vite dev server proxies /api/*
// to http://localhost:3000, so no absolute URL is needed.
//
// On a 401 response a custom DOM event is dispatched. App.vue listens for
// it and handles the redirect to /login — this avoids a circular import
// between api.js → router → stores → api.js.


export async function apiFetch(path, options = {}) {
	const response = await fetch(path, {
		...options,
		credentials: 'include',
		headers: {
			'Content-Type': 'application/json',
			...options.headers,
		},
	})


	// Session expired or cookie invalid — broadcast so App.vue can react
	if (response.status === 401) {
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
