import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
	fetchCouple as apiFetchCouple,
	patchCouple as apiPatchCouple,
} from '../services/couple.service.js'


export const useCoupleStore = defineStore('couple', () => {
	const couple  = ref(null)
	const partner = ref(null)


	async function fetchCouple() {
		try {
			const data    = await apiFetchCouple()
			couple.value  = data.couple
			partner.value = data.partner
		} catch {
			couple.value  = null
			partner.value = null
		}
	}


	async function patchCouple(updates) {
		const data   = await apiPatchCouple(updates)
		couple.value = data.couple
	}


	function clearCouple() {
		couple.value  = null
		partner.value = null
	}


	return {
		couple,
		partner,
		fetchCouple,
		patchCouple,
		clearCouple,
	}
})
