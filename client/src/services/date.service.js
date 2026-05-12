import { apiFetch } from './api.js'


export const getDates    = () =>
	apiFetch('/api/dates')

export const createDate  = (data) =>
	apiFetch('/api/dates', { method: 'POST', body: JSON.stringify(data) })

export const updateDate  = (id, data) =>
	apiFetch(`/api/dates/${id}`, { method: 'PATCH', body: JSON.stringify(data) })

export const deleteDate  = (id) =>
	apiFetch(`/api/dates/${id}`, { method: 'DELETE' })
