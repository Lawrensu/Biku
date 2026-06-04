<script setup>
import { ref }              from 'vue'
import { useRouter }        from 'vue-router'
import { useAuthStore }     from '../stores/auth.store.js'
import { useCoupleStore }   from '../stores/couple.store.js'
import BaseInput            from '../components/base/BaseInput.vue'
import BaseButton           from '../components/base/BaseButton.vue'
import { inviteCodeRules }  from '../utils/validators.js'

const router = useRouter()
const auth   = useAuthStore()
const couple = useCoupleStore()

// ── Section A: generate an invite code ───────────────────────────────────────
const generatedCode  = ref('')
const generateLoading = ref(false)
const generateError   = ref('')

async function generateCode() {
	generateLoading.value = true
	generateError.value   = ''
	try {
		const data = await couple.createCouple()
		generatedCode.value = data?.invite_code ?? data?.couple?.inviteCode ?? ''
		// Force re-fetch so isPaired is updated on next navigation guard check
		await auth.fetchMe(true)
	} catch (e) {
		generateError.value = e.message || 'could not generate a code'
	} finally {
		generateLoading.value = false
	}
}

// ── Section B: join using a code ─────────────────────────────────────────────
const joinCode    = ref('')
const joinLoading = ref(false)
const joinError   = ref('')
const joinCodeRef = ref(null)

async function joinWithCode() {
	if (joinCodeRef.value?.validate() === false) return
	joinLoading.value = true
	joinError.value   = ''
	try {
		await couple.joinCouple(joinCode.value.trim())
		// JWT was reissued by the server — force re-fetch to pick it up
		await auth.fetchMe(true)
		router.push('/dashboard')
	} catch (e) {
		if (e.code === 'SELF_JOIN')   joinError.value = "that's your own code — share it with your partner"
		else if (e.code === 'CODE_EXPIRED') joinError.value = 'this code has already been used'
		else if (e.code === 'INVALID_CODE') joinError.value = 'code not found — double-check and try again'
		else joinError.value = e.message || 'could not join'
	} finally {
		joinLoading.value = false
	}
}
</script>

<template>
	<div class="pair-page">
		<div class="page-watermark" aria-hidden="true">♡</div>
		<div class="pair-page__inner">
			<h1 class="pair-page__heading">pair with your partner</h1>
			<p class="pair-page__sub">generate a code and share it, or enter the code your partner sent you</p>

			<!-- Generate code section -->
			<section class="pair-card card">
				<h2 class="pair-card__title">invite your partner</h2>
				<p class="pair-card__desc">generate a 6-character code and share it with your partner</p>

				<div v-if="!generatedCode">
					<BaseButton variant="primary" :loading="generateLoading" @click="generateCode">
						generate invite code
					</BaseButton>
					<p v-if="generateError" class="pair-card__error">{{ generateError }}</p>
				</div>

				<div v-else class="pair-card__code-display">
					<p class="pair-card__code">{{ generatedCode }}</p>
					<p class="pair-card__code-hint">share this code with your partner, it expires once used</p>
					<p class="pair-card__code-hint">
						waiting for them to join… once they enter this code you'll both land on the dashboard.
					</p>
					<BaseButton variant="secondary" @click="router.push('/dashboard')">
						go to dashboard
					</BaseButton>
				</div>
			</section>

			<!-- Join with code section -->
			<section class="pair-card card">
				<h2 class="pair-card__title">enter a code</h2>
				<p class="pair-card__desc">enter the invite code your partner shared with you</p>

				<form class="pair-card__form" @submit.prevent="joinWithCode">
					<BaseInput
						id="join-code"
						ref="joinCodeRef"
						v-model="joinCode"
						label="invite code"
						placeholder="XXXXXX"
						:rules="inviteCodeRules"
						:error="joinError"
						sanitize="uppercase"
					/>
					<BaseButton type="submit" variant="primary" :loading="joinLoading">
						join
					</BaseButton>
				</form>
			</section>
		</div>
	</div>
</template>

<style scoped>
.pair-page {
	min-height:      100dvh;
	background:      var(--surface-base);
	display:         flex;
	align-items:     flex-start;
	justify-content: center;
	padding:         var(--space-8) var(--space-4);
}

.pair-page__inner {
	position:   relative; /* above the fixed watermark */
	z-index:    1;
	width:      100%;
	max-width:  480px;
	display:    flex;
	flex-direction: column;
	gap:        var(--space-5);
}

.pair-page__heading {
	margin:      0;
	font-family: var(--font-heading);
	font-size:   var(--text-2xl);
	font-weight: 800;
	color:       var(--text-primary);
}

.pair-page__sub {
	margin:      0;
	font-family: var(--font-body);
	font-size:   var(--text-sm);
	color:       var(--text-muted);
}

.pair-card__title {
	margin:      0 0 var(--space-1);
	font-family: var(--font-heading);
	font-size:   var(--text-lg);
	font-weight: 700;
	color:       var(--text-primary);
}

.pair-card__desc {
	margin:      0 0 var(--space-4);
	font-family: var(--font-body);
	font-size:   var(--text-sm);
	color:       var(--text-muted);
}

.pair-card__form {
	display:        flex;
	flex-direction: column;
	gap:            var(--space-4);
}

.pair-card__error {
	margin:      var(--space-3) 0 0;
	font-size:   var(--text-xs);
	color:       var(--error-text);
	font-family: var(--font-heading);
}

.pair-card__code-display {
	display:        flex;
	flex-direction: column;
	gap:            var(--space-3);
}

.pair-card__code {
	margin:        0;
	font-family:   var(--font-heading);
	font-size:     var(--text-4xl);
	font-weight:   800;
	letter-spacing: 0.15em;
	color:         var(--accent-warm);
}

.pair-card__code-hint {
	margin:      0;
	font-family: var(--font-body);
	font-size:   var(--text-xs);
	color:       var(--text-muted);
}
</style>
