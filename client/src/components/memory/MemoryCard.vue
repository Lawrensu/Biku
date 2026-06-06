<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
	memory: { type: Object, required: true },
})

const router = useRouter()

// format the stored date string. Drizzle returns memoryDate (camelCase)
const formattedDate = computed(() => {
	const d = props.memory.memoryDate || props.memory.date
	if (!d) return ''
	return new Date(d).toLocaleDateString(undefined, {
		year: 'numeric', month: 'short', day: 'numeric',
	})
})

function navigate() {
	router.push(`/memories/${props.memory.id}`)
}
</script>

<template>
	<article class="memory-card card card-interactive" @click="navigate">
		<!-- Cover image -->
		<div class="memory-card__cover">
			<img
				v-if="memory.imageUrl || memory.image_url"
				:src="memory.imageUrl || memory.image_url"
				:alt="memory.title"
				class="memory-card__img"
			/>
			<div v-else class="memory-card__img-placeholder">
				<span>&#9825;</span>
			</div>
		</div>

		<!-- Card body -->
		<div class="memory-card__body">
			<h3 class="memory-card__title">{{ memory.title }}</h3>

			<div class="memory-card__meta">
				<span v-if="formattedDate" class="memory-card__date">{{ formattedDate }}</span>
				<span v-if="memory.locationName || memory.location" class="memory-card__location">{{ memory.locationName || memory.location }}</span>
			</div>
		</div>
	</article>
</template>

<style scoped>
.memory-card {
	padding:        0;
	overflow:       hidden;
	cursor:         pointer;
}

.memory-card__cover {
	aspect-ratio: 16 / 9;
	overflow:     hidden;
	background:   var(--surface-raised);
}

.memory-card__img {
	width:      100%;
	height:     100%;
	object-fit: cover;
	transition: transform var(--duration-slow) var(--ease-tender);
}
.memory-card:hover .memory-card__img {
	transform: scale(1.04);
}

.memory-card__img-placeholder {
	width:           100%;
	height:          100%;
	display:         flex;
	align-items:     center;
	justify-content: center;
	font-size:       2.5rem;
	color:           var(--text-muted);
}

.memory-card__body {
	padding: var(--space-4);
}

.memory-card__title {
	margin:      0 0 var(--space-2);
	font-family: var(--font-heading);
	font-size:   var(--text-base);
	font-weight: 700;
	color:       var(--text-primary);
	/* Clamp to 2 lines */
	display:            -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
	overflow:           hidden;
}

.memory-card__meta {
	display:     flex;
	flex-wrap:   wrap;
	gap:         var(--space-2);
	font-family: var(--font-body);
	font-size:   var(--text-xs);
	color:       var(--text-muted);
}

.memory-card__location::before { content: '· '; }
</style>
