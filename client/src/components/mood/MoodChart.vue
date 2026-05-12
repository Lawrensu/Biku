<script setup>
import { computed } from 'vue'
import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	Tooltip,
	Legend,
	Filler,
} from 'chart.js'
import { Line } from 'vue-chartjs'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler)

const props = defineProps({
	// Array of { date, score } objects for the current user
	userEntries:    { type: Array, default: () => [] },
	// Array of { date, score } objects for the partner
	partnerEntries: { type: Array, default: () => [] },
	// Display name for the current user (chart legend)
	userName:       { type: String, default: 'you' },
	// Display name for the partner
	partnerName:    { type: String, default: 'partner' },
})

// Build a label list covering the last 30 days
const labels = computed(() => {
	const days = []
	for (let i = 29; i >= 0; i--) {
		const d = new Date()
		d.setDate(d.getDate() - i)
		days.push(d.toISOString().slice(0, 10))
	}
	return days
})

// Map entries into ordered score arrays aligned to the labels
function toScoreArray(entries, dayLabels) {
	const map = Object.fromEntries(entries.map((e) => [e.date?.slice(0, 10), e.score ?? e.mood_score]))
	return dayLabels.map((d) => map[d] ?? null)
}

const chartData = computed(() => ({
	labels: labels.value.map((d) =>
		new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
	),
	datasets: [
		{
			label:           props.userName,
			data:            toScoreArray(props.userEntries, labels.value),
			borderColor:     '#EDB1B0',   /* blush */
			backgroundColor: 'rgba(237,177,176,0.12)',
			pointBackgroundColor: '#EDB1B0',
			tension:         0.35,
			fill:            true,
			spanGaps:        true,
		},
		{
			label:           props.partnerName,
			data:            toScoreArray(props.partnerEntries, labels.value),
			borderColor:     '#5B6E7D',   /* slate */
			backgroundColor: 'rgba(91,110,125,0.08)',
			pointBackgroundColor: '#5B6E7D',
			tension:         0.35,
			fill:            true,
			spanGaps:        true,
		},
	],
}))

const chartOptions = {
	responsive:          true,
	maintainAspectRatio: false,
	interaction:         { mode: 'index', intersect: false },
	plugins: {
		legend: {
			position: 'top',
			labels:   { font: { family: 'Plus Jakarta Sans', size: 12 }, boxWidth: 12 },
		},
		tooltip: {
			callbacks: {
				// Show score as "3 / 5" in tooltip
				label: (ctx) => ` ${ctx.dataset.label}: ${ctx.parsed.y ?? '—'} / 5`,
			},
		},
	},
	scales: {
		y: {
			min:    1,
			max:    5,
			ticks:  { stepSize: 1, font: { family: 'Plus Jakarta Sans', size: 11 } },
			grid:   { color: 'rgba(91,110,125,0.1)' },
		},
		x: {
			ticks: {
				// Only show every 5th label to avoid crowding
				maxTicksLimit: 7,
				font: { family: 'Plus Jakarta Sans', size: 11 },
			},
			grid: { display: false },
		},
	},
}
</script>

<template>
	<div class="mood-chart">
		<Line :data="chartData" :options="chartOptions" />
	</div>
</template>

<style scoped>
.mood-chart {
	position: relative;
	height:   220px;
}
</style>
