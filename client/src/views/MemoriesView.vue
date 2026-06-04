<script setup>
import { onMounted }      from 'vue'
import { useMemories }    from '../composables/useMemories.js'
import MemoryCard         from '../components/memory/MemoryCard.vue'
import MemorySkeleton     from '../components/memory/MemorySkeleton.vue'
import BaseButton         from '../components/base/BaseButton.vue'

const { memories, loading, error, hasMore, fetchMemories, loadMore } = useMemories()

onMounted(fetchMemories)
</script>

<template>
	<main class="memories-page">
		<div class="page-watermark" aria-hidden="true">✦</div>
		<div class="memories-page__body">
		<header class="memories-page__header">
			<h1 class="memories-page__title">our memories</h1>
			<RouterLink to="/memories/new" class="btn btn--primary">add memory</RouterLink>
		</header>

		<!-- Loading skeletons -->
		<div v-if="loading && !memories.length" class="memories-grid">
			<MemorySkeleton v-for="n in 9" :key="n" />
		</div>

		<!-- Error state -->
		<p v-else-if="error" class="memories-page__error">{{ error }}</p>

		<!-- Empty state -->
		<div v-else-if="!memories.length" class="memories-page__empty">
			<p>no memories yet — start by adding your first one</p>
			<RouterLink to="/memories/new" class="btn btn--primary">add memory</RouterLink>
		</div>

		<!-- Memory grid -->
		<template v-else>
			<div class="memories-grid">
				<MemoryCard v-for="m in memories" :key="m.id" :memory="m" />
			</div>

			<!-- Load more / loading indicator -->
			<div class="memories-page__footer">
				<MemorySkeleton v-if="loading" class="memories-page__loading-skeleton" />
				<BaseButton v-else-if="hasMore" variant="secondary" @click="loadMore">
					load more
				</BaseButton>
				<p v-else class="memories-page__end">that's all of them</p>
			</div>
		</template>
		</div><!-- /.memories-page__body -->
	</main>
</template>

<style scoped>
.memories-page {
	position:  relative;
}

.memories-page__body {
	position:  relative;
	z-index:   1;
	padding:   var(--space-6) var(--space-4) calc(var(--space-16) + env(safe-area-inset-bottom));
	max-width: 1080px;
	margin:    0 auto;
}

@media (min-width: 768px) {
	.memories-page__body {
		margin-left:  max(var(--sidebar-w), calc((100vw - 1080px) / 2));
		margin-right: auto;
		padding-top:  var(--space-8);
	}
}

.memories-page__header {
	display:         flex;
	align-items:     center;
	justify-content: space-between;
	margin-bottom:   var(--space-6);
}

.memories-page__title {
	margin:      0;
	font-family: var(--font-heading);
	font-size:   var(--text-2xl);
	font-weight: 800;
	color:       var(--text-primary);
}

.memories-grid {
	display:               grid;
	grid-template-columns: 1fr;
	gap:                   var(--space-4);
}
@media (min-width: 640px)  { .memories-grid { grid-template-columns: repeat(2, 1fr); } }
@media (min-width: 1024px) { .memories-grid { grid-template-columns: repeat(3, 1fr); } }

.memories-page__footer {
	display:         flex;
	justify-content: center;
	margin-top:      var(--space-8);
}

.memories-page__end,
.memories-page__error {
	font-family: var(--font-body);
	font-size:   var(--text-sm);
	color:       var(--text-muted);
}

.memories-page__empty {
	text-align:     center;
	padding:        var(--space-16) var(--space-4);
	display:        flex;
	flex-direction: column;
	align-items:    center;
	gap:            var(--space-4);
	color:          var(--text-muted);
	font-family:    var(--font-body);
}
</style>
