import { defineStore } from 'pinia'
import { ref, watch } from 'vue'


export const useUiStore = defineStore('ui', () => {
	// Read persisted preference first; fall back to the OS colour scheme.
	// The blocking inline script in index.html already applied this attribute
	// before Vue mounted — this store just keeps it in sync reactively.
	const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
	const theme = ref(localStorage.getItem('biku-theme') || (systemPrefersDark ? 'dark' : 'light'))


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
