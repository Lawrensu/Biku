<script setup>
import { ref, reactive }   from 'vue'
import { useRouter }        from 'vue-router'
import { useAuthStore }     from '../stores/auth.store.js'
import BaseInput            from '../components/base/BaseInput.vue'
import BaseButton           from '../components/base/BaseButton.vue'

const router = useRouter()
const auth   = useAuthStore()

const form = reactive({ displayName: '', email: '', password: '', confirmPassword: '' })
const errors  = reactive({ displayName: '', email: '', password: '', confirmPassword: '', general: '' })
const loading = ref(false)

function validate() {
	errors.displayName    = ''
	errors.email          = ''
	errors.password       = ''
	errors.confirmPassword = ''
	errors.general        = ''

	let ok = true

	if (!form.displayName.trim()) {
		errors.displayName = 'name is required'; ok = false
	}
	if (!form.email.includes('@')) {
		errors.email = 'enter a valid email'; ok = false
	}
	if (form.password.length < 8) {
		errors.password = 'password must be at least 8 characters'; ok = false
	}
	if (form.password !== form.confirmPassword) {
		errors.confirmPassword = 'passwords do not match'; ok = false
	}

	return ok
}

async function submit() {
	if (!validate()) return
	loading.value = true
	try {
		await auth.register(form.email, form.password, form.displayName)
		router.push('/pair')
	} catch (e) {
		errors.general = e.message || 'registration failed'
	} finally {
		loading.value = false
	}
}
</script>

<template>
	<div class="auth-page">
		<div class="auth-card card">
			<h1 class="auth-card__heading">create your account</h1>
			<p class="auth-card__sub">already have one? <RouterLink to="/login">sign in</RouterLink></p>

			<form class="auth-form" @submit.prevent="submit">
				<BaseInput
					id="reg-name"
					v-model="form.displayName"
					label="your name"
					placeholder="what should we call you?"
					:error="errors.displayName"
				/>
				<BaseInput
					id="reg-email"
					v-model="form.email"
					label="email"
					type="email"
					placeholder="you@example.com"
					:error="errors.email"
				/>
				<BaseInput
					id="reg-password"
					v-model="form.password"
					label="password"
					type="password"
					placeholder="at least 8 characters"
					:error="errors.password"
				/>
				<BaseInput
					id="reg-confirm"
					v-model="form.confirmPassword"
					label="confirm password"
					type="password"
					placeholder="same as above"
					:error="errors.confirmPassword"
				/>

				<p v-if="errors.general" class="auth-form__error">{{ errors.general }}</p>

				<BaseButton type="submit" variant="primary" :loading="loading">
					create account
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
