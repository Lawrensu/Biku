<script setup>
import { ref, reactive }   from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore }     from '../stores/auth.store.js'
import BaseInput            from '../components/base/BaseInput.vue'
import BaseButton           from '../components/base/BaseButton.vue'

const router = useRouter()
const route  = useRoute()
const auth   = useAuthStore()

const form    = reactive({ email: '', password: '' })
const errors  = reactive({ email: '', password: '', general: '' })
const loading = ref(false)

function validate() {
	errors.email   = ''
	errors.password = ''
	errors.general  = ''
	let ok = true
	if (!form.email.includes('@'))  { errors.email    = 'enter a valid email'; ok = false }
	if (!form.password)             { errors.password = 'password is required'; ok = false }
	return ok
}

async function submit() {
	if (!validate()) return
	loading.value = true
	try {
		await auth.login(form.email, form.password)
		// Redirect to the page the user was trying to reach, or dashboard
		const redirect = route.query.redirect || '/dashboard'
		router.push(String(redirect))
	} catch (e) {
		errors.general = e.message || 'incorrect email or password'
	} finally {
		loading.value = false
	}
}
</script>

<template>
	<div class="auth-page">
		<div class="auth-card card">
			<h1 class="auth-card__heading">welcome back</h1>
			<p class="auth-card__sub">no account yet? <RouterLink to="/register">create one</RouterLink></p>

			<form class="auth-form" @submit.prevent="submit">
				<BaseInput
					id="login-email"
					v-model="form.email"
					label="email"
					type="email"
					placeholder="you@example.com"
					:error="errors.email"
				/>
				<BaseInput
					id="login-password"
					v-model="form.password"
					label="password"
					type="password"
					placeholder="your password"
					:error="errors.password"
				/>

				<p v-if="errors.general" class="auth-form__error">{{ errors.general }}</p>

				<BaseButton type="submit" variant="primary" :loading="loading">
					sign in
				</BaseButton>
			</form>
		</div>
	</div>
</template>

<style scoped>
.auth-page {
	min-height:      100dvh;
	display:         flex;
	align-items:     center;
	justify-content: center;
	padding:         var(--space-4);
	background:      var(--surface-base);
}

.auth-card {
	width:     100%;
	max-width: 420px;
}

.auth-card__heading {
	margin:      0 0 var(--space-1);
	font-family: var(--font-heading);
	font-size:   var(--text-2xl);
	font-weight: 800;
	color:       var(--text-primary);
}

.auth-card__sub {
	margin:      0 0 var(--space-6);
	font-family: var(--font-body);
	font-size:   var(--text-sm);
	color:       var(--text-muted);
}
.auth-card__sub a { color: var(--accent-warm); }

.auth-form {
	display:        flex;
	flex-direction: column;
	gap:            var(--space-4);
}

.auth-form__error {
	margin:      0;
	font-size:   var(--text-xs);
	color:       var(--error-text);
	font-family: var(--font-heading);
}
</style>
