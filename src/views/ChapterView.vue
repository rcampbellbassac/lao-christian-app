<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useContentStore } from '@/stores/content'
import { usePresentationSelectionStore } from '@/stores/presentationSelection'
import { parseBlocks } from '@/utils/slideGenerators'
import BreadcrumbNav from '@/components/BreadcrumbNav.vue'

const route = useRoute()
const router = useRouter()
const store = useContentStore()
const selectionStore = usePresentationSelectionStore()

const fileId = parseInt(route.params.fileid as string, 10)
const bookId = parseInt(route.params.bookid as string, 10)
const chapterId = parseInt(route.params.chapterid as string, 10)

onMounted(async () => {
  await store.loadIndex()
  const key = store.getKeyFromId(fileId)
  if (!key) {
    router.push({ name: 'home' })
    return
  }
  try {
    await store.loadContentSet(key)
  } catch (err) {
    console.error(err)
    router.push({ name: 'home' })
  }
})

const unit = computed(() =>
  store.currentSetData?.unit.find((unit) => unit.id === bookId)
)

const chapter = computed(() =>
  unit.value?.contents.find((c) => c.id === chapterId)
)

const blocks = computed(() => parseBlocks(chapter.value?.content || ''))

const isSelectMode = ref(false)
const selectedIndices = ref<Set<number>>(new Set())

// A fresh chapter's blocks means any in-progress selection no longer applies.
watch(blocks, () => {
  isSelectMode.value = false
  selectedIndices.value = new Set()
})

function toggleSelectMode(): void {
  isSelectMode.value = !isSelectMode.value
  if (!isSelectMode.value) {
    selectedIndices.value = new Set()
  }
}

function toggleBlockSelection(index: number): void {
  const next = new Set(selectedIndices.value)
  if (next.has(index)) {
    next.delete(index)
  } else {
    next.add(index)
  }
  selectedIndices.value = next
}

function presentSelection(): void {
  selectionStore.setSelection(chapterId, new Set(selectedIndices.value))
  router.push(`/present/${fileId}/${bookId}/${chapterId}`)
}
</script>

<template>
  <main class="app-page">
    <section class="app-panel">
      <BreadcrumbNav />
    <section v-if="chapter">
      <div class="mb-4 flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          class="inline-flex items-center rounded-full border border-teal-700 px-4 py-2 text-sm font-semibold text-teal-700 transition hover:bg-teal-50 dark:border-teal-400 dark:text-teal-300 dark:hover:bg-teal-950/40"
          @click="toggleSelectMode"
        >
          {{ isSelectMode ? 'Done selecting' : 'Select paragraphs' }}
        </button>
        <button
          v-if="isSelectMode && selectedIndices.size > 0"
          type="button"
          class="inline-flex items-center rounded-full bg-teal-700 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-teal-800"
          @click="presentSelection"
        >
          Present selection ({{ selectedIndices.size }})
        </button>
        <router-link
          :to="`/present/${fileId}/${bookId}/${chapterId}`"
          class="inline-flex items-center rounded-full bg-teal-700 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-teal-800"
        >
          Presentation mode
        </router-link>
      </div>
      <h1 class="app-section-title mb-3"><span v-html="chapter.name"></span></h1>
      <div class="prose prose-slate max-w-none dark:prose-invert app-content-scale">
        <div
          v-for="(block, index) in blocks"
          :key="index"
          class="content-block"
          :class="{ 'content-block--selectable': isSelectMode }"
        >
          <label v-if="isSelectMode" class="content-block-checkbox">
            <input
              type="checkbox"
              :checked="selectedIndices.has(index)"
              @change="toggleBlockSelection(index)"
            />
          </label>
          <div class="content-block-body" v-html="block.html"></div>
        </div>
      </div>
      <div v-if="chapter.audioembed || chapter.videoembed" class="mt-5 rounded-xl border border-slate-300/70 bg-white/75 p-3 dark:border-slate-500/50 dark:bg-slate-950/86">
        <div v-if="chapter.audioembed" v-html="chapter.audioembed" />
        <div v-if="chapter.videoembed" v-html="chapter.videoembed" />
      </div>
    </section>
    <section v-else>
      <p class="text-center text-slate-500 dark:text-slate-300">
        Loading chapter...
      </p>
    </section>
    </section>
  </main>
</template>

<style scoped>
.content-block {
  display: contents;
}

.content-block--selectable {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.5rem;
}

.content-block--selectable:hover {
  background: rgba(15, 23, 42, 0.04);
}

:global(.dark) .content-block--selectable:hover {
  background: rgba(226, 232, 240, 0.06);
}

.content-block-checkbox {
  margin-top: 0.4rem;
  flex-shrink: 0;
}

.content-block-body {
  flex: 1;
  min-width: 0;
}
</style>
