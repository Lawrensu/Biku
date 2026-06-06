<script setup>
import { onMounted }      from 'vue'
import { useMemories }    from '../composables/useMemories.js'
import MemoryCard         from '../components/memory/MemoryCard.vue'
import MemorySkeleton     from '../components/memory/MemorySkeleton.vue'
import BaseButton         from '../components/base/BaseButton.vue'
import RandomiserNudge    from '../components/base/RandomiserNudge.vue'

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
			<p>no memories yet — go make our first one together</p>
			<RouterLink to="/memories/new" class="btn btn--primary">add memory</RouterLink>
			<RandomiserNudge
				class="memories-page__nudge"
				text="don't know where to start? the randomiser can dream up our first date together"
			/>
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
				<p v-else class="memories-page__end">go make more memories</p>
			</div>

		</template>

		<!--
			always-present nudge toward the randomiser, pinned to the bottom of
			the page with flex `margin-top: auto` (see
			`.memories-page__nudge--anchored`) rather than sitting right under
			the grid. on shorter grids it used to land mid-viewport, dead centre
			on top of the fixed page-watermark symbol (the large ✦ sits centred
			at `inset: 0`). anchoring it to the bottom keeps it clear of the
			watermark on every viewport, and it reads like a calm closing note
			instead of competing with the grid above it.
		-->
		<RandomiserNudge
			v-if="memories.length"
			class="memories-page__nudge memories-page__nudge--anchored"
			text="need an idea for the next one?"
		/>
		</div><!-- /.memories-page__body -->
	</main>
</template>

<style scoped>
.memories-page {
	position:       relative;
	/* flex column filling the viewport, so the bottom-anchored nudge below
	   has somewhere to push to. see `.memories-page__nudge--anchored` */
	display:        flex;
	flex-direction: column;
	min-height:     100dvh;
}

.memories-page__body {
	position:       relative;
	z-index:        1;
	padding:        var(--space-6) var(--space-4) calc(var(--space-16) + env(safe-area-inset-bottom));
	max-width:      1080px;
	margin:         0 auto;
	width:          100%;
	display:        flex;
	flex-direction: column;
	flex:           1;
}

/* pins the closing randomiser nudge to the bottom of the page, clear of the
   centred page-watermark, on every viewport whether the grid is short or long */
.memories-page__nudge--anchored {
	margin-top: auto;
	padding-top: var(--space-10);
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

/* the empty-state nudge sits snugly beneath the "add memory" button. the
   bottom-anchored variant gets its spacing from `.memories-page__nudge--anchored` instead */
.memories-page__empty .memories-page__nudge { margin-top: var(--space-2); }
</style>
