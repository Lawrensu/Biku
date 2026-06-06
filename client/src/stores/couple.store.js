import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
	fetchCouple  as apiFetchCouple,
	createCouple as apiCreateCouple,
	joinCouple   as apiJoinCouple,
	patchCouple  as apiPatchCouple,
} from '../services/couple.service.js'


export const useCoupleStore = defineStore('couple', () => {
	const couple  = ref(null)
	const partner = ref(null)

	// true once someone has actually joined with the invite code. having a
	// couple record (auth.isPaired) just means "we've set our space up" —
	// this is the narrower flag for "we're both here now"
	const hasPartner = computed(() => !!couple.value?.partnerBId)


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


	// Creates a new couple and returns { couple, invite_code }
	async function createCouple() {
		const data   = await apiCreateCouple()
		couple.value = data.couple
		return data
	}


	// Joins an existing couple by invite code; returns { couple }
	async function joinCouple(invite_code) {
		const data   = await apiJoinCouple(invite_code)
		couple.value = data.couple
		return data
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
		hasPartner,
		fetchCouple,
		createCouple,
		joinCouple,
		patchCouple,
		clearCouple,
	}
})
