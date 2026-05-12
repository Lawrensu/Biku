import { defineStore } from 'pinia'
import { ref, watch } from 'vue'


export const useUiStore = defineStore('ui', () => {
	// Read persisted preference on store creation; fall back to light mode.
	// In a future iteration this could also check prefers-color-scheme as a
	// default before the user has ever made a choice.
	const theme = ref(localStorage.getItem('biku-theme') || 'light')


	function toggleTheme() {
		theme.value = theme.value === 'light' ? 'dark' : 'light'
	}


	// Sync the data-theme attribute on <html> and persist to localStorage.
	// { immediate: true } ensures the attribute is applied on first load
	// before any component renders, preventing a flash of the wrong theme.
	watch(theme, (val) => {
		document.documentElement.setAttribute('data-theme', val)
		localStorage.setItem('biku-theme', val)
	}, { immediate: true })


	return { theme, toggleTheme }
})
