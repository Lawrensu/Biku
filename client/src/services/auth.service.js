import { apiFetch } from './api.js'


export const fetchMe = () =>
	apiFetch('/api/auth/me')


export const login = (email, password) =>
	apiFetch('/api/auth/login', {
		method: 'POST',
		body:   JSON.stringify({ email, password }),
	})


export const register = (email, password, display_name) =>
	apiFetch('/api/auth/register', {
		method: 'POST',
		body:   JSON.stringify({ email, password, display_name }),
	})


export const logout = () =>
	apiFetch('/api/auth/logout', { method: 'POST' })
