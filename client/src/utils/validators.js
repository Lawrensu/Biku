// Biku client-side validation rules
//
// Each validator returns a function (value: string) => true | string.
// true   = valid
// string = error message to display
//
// All messages follow the brand voice: lowercase-first, warm, specific.
// keep them away from generic copy like "this field is required". always be specific and human about it.


// ── Core validators ───────────────────────────────────────────────────────────

export const required = (msg = 'this one is needed to continue') =>
	(v) => (v ?? '').trim().length > 0 || msg


export const isEmail = () =>
	(v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((v ?? '').trim()) ||
		"that doesn't look like an email — try name@example.com"


export const minLen = (n, msg) =>
	(v) => (v ?? '').length >= n || (msg ?? `needs at least ${n} characters`)


export const maxLen = (n, msg) =>
	(v) => (v ?? '').length <= n || (msg ?? `keep it under ${n} characters`)


export const exactLen = (n, msg) =>
	(v) => (v ?? '').length === n || (msg ?? `must be exactly ${n} characters`)


// Pass a getter function so the comparison always uses the latest value
// e.g. matches(() => form.password, "these don't match yet")
export const matches = (getOther, msg = "these don't match yet — check and try again") =>
	(v) => v === getOther() || msg


export const pattern = (re, msg = 'invalid format') =>
	(v) => re.test(v ?? '') || msg


// ── Preset rules for common fields ───────────────────────────────────────────

export const nameRules = [
	required("we'd love to know your name"),
	minLen(2, 'just a couple more letters'),
]

export const emailRules = [
	required('your email is how you\'ll sign back in'),
	isEmail(),
]

export const passwordRules = [
	required('pick a password to keep things secure'),
	minLen(8, 'a little short — 8 characters or more keeps things secure'),
]

export const inviteCodeRules = [
	required('enter the code your partner shared with you'),
	exactLen(6, 'codes are exactly 6 characters — check and try again'),
	pattern(/^[A-Z0-9]+$/, 'uppercase letters and numbers only'),
]
