import { apiFetch } from './api.js'


export const fetchCouple = () =>
	apiFetch('/api/couples/me')


// Creates a new couple for the current user and returns { couple, invite_code }
export const createCouple = () =>
	apiFetch('/api/couples', { method: 'POST' })


// Joins an existing couple using the partner's invite code
export const joinCouple = (invite_code) =>
	apiFetch('/api/couples/join', {
		method: 'POST',
		body:   JSON.stringify({ invite_code }),
	})


export const patchCouple = (updates) =>
	apiFetch('/api/couples/me', {
		method: 'PATCH',
		body:   JSON.stringify(updates),
	})
