<script setup>
import { onMounted, ref } from 'vue'
import { useAuthStore }   from './stores/auth.store.js'
import { useUiStore }     from './stores/ui.store.js'
import { useCoupleStore } from './stores/couple.store.js'
import { apiFetch }       from './services/api.js'

const auth   = useAuthStore()
const ui     = useUiStore()
const couple = useCoupleStore()

const healthResult = ref(null)
const authResult   = ref(null)
const log          = ref([])

function note(msg) { log.value.push(msg) }

onMounted(async () => {
	// ── Test 1: health endpoint (verifies Vite proxy → backend) ──────────
	note('Testing proxy → GET /api/health …')
	try {
		const h = await apiFetch('/api/health')
		healthResult.value = h?.ok === true ? '✅ proxy works' : '❌ unexpected response'
	} catch (e) {
		healthResult.value = `❌ ${e.message}`
	}

	// ── Test 2: auth store fetchMe (no session) ───────────────────────────
	note('Testing authStore.fetchMe() with no session …')
	await auth.fetchMe()
	authResult.value = !auth.isLoggedIn
		? '✅ isLoggedIn = false (no session)'
		: '❌ unexpected logged-in state'

	// ── Test 3: ui store theme toggle ────────────────────────────────────
	note('Testing uiStore.toggleTheme() …')
	const before = ui.theme
	ui.toggleTheme()
	const after = ui.theme
	const htmlAttr = document.documentElement.getAttribute('data-theme')
	ui.toggleTheme() // reset back
	note(before !== after && htmlAttr === after
		? `✅ theme toggled ${before} → ${after}, data-theme updated`
		: '❌ theme toggle failed')

	note('All tests complete.')
})
</script>

<template>
	<div style="font-family: monospace; padding: 2rem; background: var(--surface-base); min-height: 100vh; color: var(--text-primary);">
		<h2 style="font-family: var(--font-heading); margin-bottom: 1rem;">Biku — store / service verification</h2>

		<p><strong>Proxy check:</strong> {{ healthResult ?? 'running…' }}</p>
		<p><strong>Auth store:</strong> {{ authResult ?? 'running…' }}</p>

		<hr style="margin: 1rem 0; border-color: var(--border-subtle);">

		<p v-for="(entry, i) in log" :key="i" style="margin: 0.25rem 0;">{{ entry }}</p>

		<hr style="margin: 1rem 0; border-color: var(--border-subtle);">

		<p>
			<strong>Current theme:</strong> {{ ui.theme }}
			&nbsp;
			<button
				@click="ui.toggleTheme()"
				style="padding: 4px 12px; cursor: pointer; font-family: var(--font-heading);"
			>
				toggle dark mode
			</button>
		</p>
		<p style="margin-top: 0.5rem; font-size: 0.85rem; color: var(--text-muted);">
			Background colour should change when toggled — confirms CSS tokens + data-theme wiring.
		</p>
	</div>
</template>
