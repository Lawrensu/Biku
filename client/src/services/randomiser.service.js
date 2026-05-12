import { apiFetch } from './api.js'


// filters: { budget?: string, category?: string, max_duration?: number }
export const getIdea = (filters = {}) => {
	const params = new URLSearchParams()
	if (filters.budget)       params.set('budget',       filters.budget)
	if (filters.category)     params.set('category',     filters.category)
	if (filters.max_duration) params.set('max_duration', filters.max_duration)

	const qs = params.toString()
	return apiFetch(`/api/date-ideas${qs ? `?${qs}` : ''}`)
}
