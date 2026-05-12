import { apiFetch } from './api.js'


// type: 'bucket' | 'grocery' | 'wishlist'
export const getList      = (type) =>
	apiFetch(`/api/lists/${type}`)

export const addItem      = (type, content) =>
	apiFetch(`/api/lists/${type}/items`, { method: 'POST', body: JSON.stringify({ content }) })

export const updateItem   = (id, data) =>
	apiFetch(`/api/lists/items/${id}`, { method: 'PATCH', body: JSON.stringify(data) })

export const deleteItem   = (id) =>
	apiFetch(`/api/lists/items/${id}`, { method: 'DELETE' })

export const reorderItems = (type, orderedIds) =>
	apiFetch(`/api/lists/${type}/reorder`, { method: 'PATCH', body: JSON.stringify({ ordered_ids: orderedIds }) })
