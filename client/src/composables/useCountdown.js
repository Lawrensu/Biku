import { ref, onUnmounted, watchEffect, toValue } from 'vue'


// Returns a live countdown to targetDate.
// If recursYearly is true, it always counts to the next future occurrence of
// the same month/day (anniversaries, birthdays, etc.).
export function useCountdown(targetDate, recursYearly = false) {
	const days    = ref(0)
	const hours   = ref(0)
	const minutes = ref(0)
	const seconds = ref(0)
	const isPast  = ref(false)

	let interval = null

	function getNextTarget(dateStr) {
		const base = new Date(dateStr)
		const now  = new Date()

		if (!recursYearly) return base

		// Build this year's occurrence; if it's already passed, use next year's
		const thisYear = new Date(now.getFullYear(), base.getMonth(), base.getDate())
		if (thisYear > now) return thisYear

		return new Date(now.getFullYear() + 1, base.getMonth(), base.getDate())
	}

	function tick() {
		// toValue() unwraps refs/computed, or passes plain values straight through
		const date = toValue(targetDate)
		if (!date) return

		const target  = getNextTarget(date)
		const diffMs  = target - Date.now()

		if (diffMs <= 0) {
			isPast.value   = true
			days.value     = 0
			hours.value    = 0
			minutes.value  = 0
			seconds.value  = 0
			return
		}

		isPast.value   = false
		const diffSec  = Math.floor(diffMs / 1000)
		days.value     = Math.floor(diffSec / 86400)
		hours.value    = Math.floor((diffSec % 86400) / 3600)
		minutes.value  = Math.floor((diffSec % 3600) / 60)
		seconds.value  = diffSec % 60
	}

	// Restart interval whenever targetDate changes.
	// watchEffect tracks toValue(targetDate) so it re-runs when a computed ref resolves.
	watchEffect(() => {
		if (interval) clearInterval(interval)
		if (!toValue(targetDate)) return
		tick()
		interval = setInterval(tick, 1000)
	})

	onUnmounted(() => { if (interval) clearInterval(interval) })

	return { days, hours, minutes, seconds, isPast }
}
