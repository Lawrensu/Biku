<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter }               from 'vue-router'
import { useAuthStore }            from '../stores/auth.store.js'
import BaseInput                   from '../components/base/BaseInput.vue'
import BaseButton                  from '../components/base/BaseButton.vue'
import { nameRules, emailRules, passwordRules, matches, required } from '../utils/validators.js'

const router = useRouter()
const auth   = useAuthStore()

const form = reactive({ displayName: '', email: '', password: '', confirmPassword: '' })
const generalError = ref('')
const loading      = ref(false)

// Template refs — used to trigger validation on all fields at submit time
const nameRef    = ref(null)
const emailRef   = ref(null)
const passRef    = ref(null)
const confirmRef = ref(null)

// confirmPassword rules depend on form.password reactively
const confirmRules = computed(() => [
	required('confirm your password before continuing'),
	matches(() => form.password),
])

async function submit() {
	generalError.value = ''

	// Trigger validation on every field so errors appear even if user skipped them
	const results = [
		nameRef.value?.validate(),
		emailRef.value?.validate(),
		passRef.value?.validate(),
		confirmRef.value?.validate(),
	]
	if (results.some((r) => r === false)) return

	loading.value = true
	try {
		await auth.register(form.email, form.password, form.displayName)
		router.push('/pair')
	} catch (e) {
		generalError.value = e.message || 'registration failed — please try again'
	} finally {
		loading.value = false
	}
}
</script>

<template>
	<div class="auth-page">
		<div class="page-watermark" aria-hidden="true">♡</div>
		<div class="auth-card card">
			<h1 class="auth-card__heading">create your account</h1>
			<p class="auth-card__sub">already have one? <RouterLink to="/login">sign in</RouterLink></p>

			<form class="auth-form" @submit.prevent="submit">
				<BaseInput
					id="reg-name"
					ref="nameRef"
					v-model="form.displayName"
					label="your name"
					placeholder="what should we call you?"
					:rules="nameRules"
				/>
				<BaseInput
					id="reg-email"
					ref="emailRef"
					v-model="form.email"
					label="email"
					type="email"
					placeholder="you@example.com"
					:rules="emailRules"
					sanitize="email"
				/>
				<BaseInput
					id="reg-password"
					ref="passRef"
					v-model="form.password"
					label="password"
					type="password"
					placeholder="at least 8 characters"
					:rules="passwordRules"
					sanitize="no-spaces"
				/>
				<BaseInput
					id="reg-confirm"
					ref="confirmRef"
					v-model="form.confirmPassword"
					label="confirm password"
					type="password"
					placeholder="same as above"
					:rules="confirmRules"
					sanitize="no-spaces"
				/>

				<p v-if="generalError" class="auth-form__error">{{ generalError }}</p>

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
	position:  relative; /* above watermark */
	z-index:   1;
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
