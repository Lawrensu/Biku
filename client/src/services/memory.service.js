import { apiFetch } from './api.js'


export const listMemories  = (page = 1, limit = 12) =>
	apiFetch(`/api/memories?page=${page}&limit=${limit}`)

export const getMemory     = (id) =>
	apiFetch(`/api/memories/${id}`)

export const getMapMemories = () =>
	apiFetch('/api/memories/map')

export const createMemory  = (data) =>
	apiFetch('/api/memories', { method: 'POST', body: JSON.stringify(data) })

export const updateMemory  = (id, data) =>
	apiFetch(`/api/memories/${id}`, { method: 'PATCH', body: JSON.stringify(data) })

export const deleteMemory  = (id) =>
	apiFetch(`/api/memories/${id}`, { method: 'DELETE' })
