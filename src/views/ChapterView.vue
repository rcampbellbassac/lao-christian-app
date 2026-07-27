<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faDisplay, faHighlighter, faPlay } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { useContentStore } from '@/stores/content'
import { usePresentationSelectionStore } from '@/stores/presentationSelection'
import { parseBlocks } from '@/utils/slideGenerators'
import BreadcrumbNav from '@/components/BreadcrumbNav.vue'

library.add(faDisplay, faHighlighter, faPlay)

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

function isSelectableBlock(block: { text: string }): boolean {
  // Some content uses empty paragraphs purely as visual spacers (e.g.
  // between song stanzas) -- there's nothing meaningful to select there.
  return block.text.length > 0
}

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
          class="icon-btn"
          :class="{ 'icon-btn--active': isSelectMode }"
          title="Select paragraphs"
          aria-label="Select paragraphs"
          @click="toggleSelectMode"
        >
          <font-awesome-icon icon="highlighter" />
        </button>
        <button
          v-if="isSelectMode && selectedIndices.size > 0"
          type="button"
          class="icon-btn icon-btn--primary"
          title="Present selection"
          aria-label="Present selection"
          @click="presentSelection"
        >
          <font-awesome-icon icon="play" />
          <span class="icon-btn-count">{{ selectedIndices.size }}</span>
        </button>
        <router-link
          :to="`/present/${fileId}/${bookId}/${chapterId}`"
          class="icon-btn icon-btn--primary"
          title="Presentation mode"
          aria-label="Presentation mode"
        >
          <font-awesome-icon icon="display" />
        </router-link>
      </div>
      <h1 class="app-section-title mb-3"><span v-html="chapter.name"></span></h1>
      <div class="prose prose-slate max-w-none dark:prose-invert app-content-scale">
        <div
          v-for="(block, index) in blocks"
          :key="index"
          class="content-block"
          :class="{
            'content-block--selectable': isSelectMode && isSelectableBlock(block),
            'content-block--selected': isSelectMode && selectedIndices.has(index),
          }"
          :role="isSelectMode && isSelectableBlock(block) ? 'button' : undefined"
          :tabindex="isSelectMode && isSelectableBlock(block) ? 0 : undefined"
          @click="isSelectMode && isSelectableBlock(block) && toggleBlockSelection(index)"
          @keydown.enter.prevent="isSelectMode && isSelectableBlock(block) && toggleBlockSelection(index)"
          @keydown.space.prevent="isSelectMode && isSelectableBlock(block) && toggleBlockSelection(index)"
        >
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
.icon-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  border-radius: 999px;
  width: 2.5rem;
  height: 2.5rem;
  justify-content: center;
  border: 1px solid rgb(15 118 110 / 0.6);
  color: rgb(15 118 110);
  background: transparent;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.icon-btn:hover {
  background: rgb(240 253 250);
}

.icon-btn--active {
  background: rgb(15 118 110);
  color: white;
}

.icon-btn--active:hover {
  background: rgb(15 118 110 / 0.9);
}

.icon-btn--primary {
  width: auto;
  padding: 0 0.9rem;
  background: rgb(15 118 110);
  color: white;
  border-color: transparent;
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.1);
}

.icon-btn--primary:hover {
  background: rgb(15 118 110 / 0.9);
}

.icon-btn-count {
  font-size: 0.8rem;
  font-weight: 700;
}

:global(.dark) .icon-btn {
  border-color: rgb(45 212 191 / 0.5);
  color: rgb(94 234 212);
}

:global(.dark) .icon-btn:hover {
  background: rgb(19 78 74 / 0.4);
}

.content-block {
  display: contents;
}

.content-block--selectable {
  display: block;
  cursor: pointer;
  border-radius: 0.5rem;
  padding: 0.15rem 0.5rem;
  margin: 0 -0.5rem;
  transition: background-color 0.15s ease, outline-color 0.15s ease;
  outline: 2px solid transparent;
  outline-offset: 2px;
}

.content-block--selectable:hover {
  background: rgba(15, 23, 42, 0.05);
}

.content-block--selectable:focus-visible {
  outline-color: rgb(15 118 110 / 0.6);
}

/* Highlighter-marker look: a warm translucent highlight behind the text,
   like the paragraph has been marked with a highlighter pen. */
.content-block--selected {
  background: rgba(250, 204, 21, 0.4);
}

.content-block--selected:hover {
  background: rgba(250, 204, 21, 0.5);
}

:global(.dark) .content-block--selectable:hover {
  background: rgba(226, 232, 240, 0.06);
}

:global(.dark) .content-block--selected {
  background: rgba(250, 204, 21, 0.22);
}

:global(.dark) .content-block--selected:hover {
  background: rgba(250, 204, 21, 0.3);
}

.content-block-body {
  min-width: 0;
}
</style>
