<script setup>
import { onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute }    from 'vue-router'
import { useAuthStore }           from './stores/auth.store.js'
import { useUiStore }             from './stores/ui.store.js'
import AppNavbar                  from './components/layout/AppNavbar.vue'

const router    = useRouter()
const route     = useRoute()
const authStore = useAuthStore()
const uiStore   = useUiStore()   // calling this activates the immediate theme watcher


// ─────────────────────────────────────────────────────────────────────────────
// Global 401 handler
//
// apiFetch dispatches 'biku:unauthorized' before throwing so we can react
// without creating a circular import (api → router → stores → api).
// We clear the user state and redirect to /login only if the current page
// actually requires auth. public pages like landing and login should just stay put.
// ─────────────────────────────────────────────────────────────────────────────

function handleUnauthorized() {
	authStore.clearUser()
	if (route.meta.requiresAuth) {
		router.push('/login')
	}
}

onMounted(()  => window.addEventListener('biku:unauthorized', handleUnauthorized))
onUnmounted(() => window.removeEventListener('biku:unauthorized', handleUnauthorized))
</script>

<template>
	<!-- Navbar is hidden on landing, auth, and pair routes via meta.hideNav -->
	<AppNavbar v-if="!route.meta.hideNav" />

	<RouterView v-slot="{ Component }">
		<Transition name="page" mode="out-in">
			<component :is="Component" />
		</Transition>
	</RouterView>
</template>
