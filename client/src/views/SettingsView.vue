<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter }               from 'vue-router'
import { useAuthStore }            from '../stores/auth.store.js'
import { useCoupleStore }          from '../stores/couple.store.js'
import { useUiStore }              from '../stores/ui.store.js'
import BaseInput                   from '../components/base/BaseInput.vue'
import BaseButton                  from '../components/base/BaseButton.vue'
import PendingInviteBanner         from '../components/base/PendingInviteBanner.vue'

const router = useRouter()
const auth   = useAuthStore()
const couple = useCoupleStore()
const ui     = useUiStore()

// ── Couple settings ───────────────────────────────────────────────────────────
const coupleForm = reactive({
	couple_name:      couple.couple?.coupleName ?? '',
	anniversary_date: couple.couple?.anniversaryDate ?? '',
})
const coupleLoading = ref(false)
const coupleSuccess = ref(false)
const coupleError   = ref('')

async function saveCouple() {
	coupleLoading.value = true
	coupleError.value   = ''
	coupleSuccess.value = false
	try {
		const updates = {}
		if (coupleForm.couple_name.trim())      updates.couple_name      = coupleForm.couple_name.trim()
		if (coupleForm.anniversary_date)        updates.anniversary_date = coupleForm.anniversary_date
		if (!Object.keys(updates).length) { coupleLoading.value = false; return }
		await couple.patchCouple(updates)
		coupleSuccess.value = true
		setTimeout(() => { coupleSuccess.value = false }, 3000)
	} catch (e) {
		coupleError.value = e.message || 'could not save'
	} finally {
		coupleLoading.value = false
	}
}

// ── Logout ────────────────────────────────────────────────────────────────────
const logoutLoading = ref(false)

async function logout() {
	logoutLoading.value = true
	try {
		await auth.logout()
		router.push('/login')
	} finally {
		logoutLoading.value = false
	}
}

// Partner display. While we're still in solo setup mode there's no partner
// row to read a name from yet, so this reads as an invitation rather than a
// blank dash
const partnerName = computed(() =>
	couple.partner?.displayName || couple.partner?.display_name || 'still finding their way to us'
)
</script>

<template>
	<main class="settings-page">
		<div class="page-watermark" aria-hidden="true">◎</div>
		<h1 class="settings-page__title">settings</h1>

		<!-- Couple settings section -->
		<section class="settings-section card">
			<h2 class="settings-section__title">our couple</h2>

			<PendingInviteBanner
				v-if="!couple.hasPartner && couple.couple?.inviteCode"
				compact
				:code="couple.couple.inviteCode"
			/>

			<p class="settings-section__partner">
				partner: <strong>{{ partnerName }}</strong>
			</p>

			<form class="settings-form" @submit.prevent="saveCouple">
				<BaseInput
					id="set-couple-name"
					v-model="coupleForm.couple_name"
					label="couple name"
					placeholder="e.g. biku ♡"
					:helper="`current: ${couple.couple?.coupleName || 'not set'}`"
				/>
				<BaseInput
					id="set-anniversary"
					v-model="coupleForm.anniversary_date"
					label="anniversary date"
					type="date"
				/>

				<p v-if="coupleError"   class="settings-form__error">{{ coupleError }}</p>
				<p v-if="coupleSuccess" class="settings-form__success">saved!</p>

				<BaseButton type="submit" variant="primary" :loading="coupleLoading">save changes</BaseButton>
			</form>
		</section>

		<!-- Appearance section -->
		<section class="settings-section card">
			<h2 class="settings-section__title">appearance</h2>

			<div class="settings-theme">
				<span class="settings-theme__label">theme</span>
				<button class="settings-theme__toggle btn btn--secondary" @click="ui.toggleTheme()">
					{{ ui.theme === 'dark' ? '☀ light mode' : '☾ dark mode' }}
				</button>
			</div>
		</section>

		<!-- Account section -->
		<section class="settings-section card">
			<h2 class="settings-section__title">account</h2>
			<p class="settings-section__email">{{ auth.user?.email }}</p>

			<BaseButton variant="danger" :loading="logoutLoading" @click="logout">sign out</BaseButton>
		</section>
	</main>
</template>

<style scoped>
.settings-page {
	padding:   var(--space-6) var(--space-4) calc(var(--space-16) + env(safe-area-inset-bottom));
	position:  relative;
	z-index:   1;
	max-width: 700px;
	margin:    0 auto;
}

@media (min-width: 768px) {
	.settings-page {
		margin-left:  max(var(--sidebar-w), calc((100vw - 700px) / 2));
		margin-right: auto;
		padding-top:  var(--space-8);
		/* without this, width:100% + margin-left overflows the right edge on narrow tablets */
		max-width:    min(700px, calc(100vw - var(--sidebar-w)));
	}
}

.settings-page__title {
	margin:      0 0 var(--space-6);
	font-family: var(--font-heading);
	font-size:   var(--text-2xl);
	font-weight: 800;
	color:       var(--text-primary);
}

.settings-section {
	margin-bottom: var(--space-5);
}

.settings-section__title {
	margin:      0 0 var(--space-4);
	font-family: var(--font-heading);
	font-size:   var(--text-lg);
	font-weight: 700;
	color:       var(--text-primary);
}

.settings-section__partner {
	margin:      0 0 var(--space-4);
	font-family: var(--font-body);
	font-size:   var(--text-sm);
	color:       var(--text-muted);
}

.settings-section__email {
	margin:      0 0 var(--space-4);
	font-family: var(--font-body);
	font-size:   var(--text-sm);
	color:       var(--text-secondary);
}

.settings-form {
	display:        flex;
	flex-direction: column;
	gap:            var(--space-4);
}

.settings-form__error   { margin: 0; font-size: var(--text-xs); color: var(--error-text);   font-family: var(--font-heading); }
.settings-form__success { margin: 0; font-size: var(--text-xs); color: var(--color-slate);  font-family: var(--font-heading); }

.settings-theme {
	display:     flex;
	align-items: center;
	gap:         var(--space-4);
}

.settings-theme__label {
	font-family: var(--font-heading);
	font-size:   var(--text-sm);
	font-weight: 600;
	color:       var(--text-primary);
	min-width:   60px;
}
</style>
