import { ref }             from 'vue'
import { listMemories }    from '../services/memory.service.js'


export function useMemories(pageSize = 12) {
	const memories = ref([])
	const loading  = ref(false)
	const error    = ref(null)
	const hasMore  = ref(true)

	let currentPage = 0

	async function fetchMemories() {
		// Reset to the first page
		currentPage = 0
		memories.value = []
		hasMore.value  = true
		await loadMore()
	}

	async function loadMore() {
		if (!hasMore.value || loading.value) return
		loading.value = true
		error.value   = null
		try {
			currentPage++
			const data = await listMemories(currentPage, pageSize)
			const page = data?.memories ?? []
			memories.value.push(...page)
			// If we got fewer than a full page, we've hit the end
			hasMore.value = page.length === pageSize
		} catch (e) {
			error.value = e.message || 'could not load memories'
		} finally {
			loading.value = false
		}
	}

	return { memories, loading, error, hasMore, fetchMemories, loadMore }
}
