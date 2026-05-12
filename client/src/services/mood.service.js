import { apiFetch } from './api.js'


export const getMoods  = (days = 30) =>
	apiFetch(`/api/moods?days=${days}`)

export const logMood   = (score, note = '') =>
	apiFetch('/api/moods', { method: 'POST', body: JSON.stringify({ mood_score: score, note }) })

export const updateMood = (id, score, note = '') =>
	apiFetch(`/api/moods/${id}`, { method: 'PATCH', body: JSON.stringify({ mood_score: score, note }) })
