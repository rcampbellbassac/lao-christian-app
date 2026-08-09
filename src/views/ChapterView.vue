<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { library } from '@fortawesome/fontawesome-svg-core'
import {
  faDisplay,
  faHighlighter,
  faPlay,
  faBookmark,
  faShareNodes,
  faNoteSticky,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { useContentStore } from '@/stores/content'
import { usePresentationSelectionStore } from '@/stores/presentationSelection'
import { parseBlocks } from '@/utils/slideGenerators'
import BreadcrumbNav from '@/components/BreadcrumbNav.vue'
import { useStudyStore, type ContentLocation } from '@/stores/study'
import { applyInlineHighlights, contentHtmlToText, sanitizeContentHtml } from '@/utils/sanitize'
import SafeMediaLinks from '@/components/SafeMediaLinks.vue'
import { useStaticText } from '@/composables/useStaticText'
import BilingualText from '@/components/BilingualText.vue'
import StudyNoteDialog from '@/components/StudyNoteDialog.vue'

library.add(faDisplay, faHighlighter, faPlay, faBookmark, faShareNodes, faNoteSticky)

const route = useRoute()
const router = useRouter()
const store = useContentStore()
const selectionStore = usePresentationSelectionStore()
const studyStore = useStudyStore()
const copy = useStaticText()

const fileId = parseInt(route.params.fileid as string, 10)
const bookId = parseInt(route.params.bookid as string, 10)
const chapterId = parseInt(route.params.chapterid as string, 10)

onMounted(async () => {
  await studyStore.load()
  await store.loadIndex()
  const key = store.getKeyFromId(fileId)
  if (!key) {
    router.push({ name: 'home' })
    return
  }
  try {
    await store.loadContentSet(key)
    if (chapter.value) {
      await studyStore.recordVisit(chapterLocation())
      await nextTick()
      const target = route.hash ? document.querySelector<HTMLElement>(route.hash) : null
      target?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      target?.classList.add('content-block--targeted')
    }
  } catch (err) {
    console.error(err)
    router.push({ name: 'home' })
  }
})

const unit = computed(() => store.currentSetData?.unit.find((unit) => unit.id === bookId))

const chapter = computed(() => unit.value?.contents.find((c) => c.id === chapterId))

const blocks = computed(() => parseBlocks(sanitizeContentHtml(chapter.value?.content)))

const isSelectMode = ref(false)
const selectedIndices = ref<Set<number>>(new Set())
const noteEditorOpen = ref(false)
const noteInitialBody = ref('')
const noteBlockIndex = ref<number | undefined>(undefined)
const selectedPhrase = ref<{
  blockIndex: number
  exact: string
  prefix: string
  suffix: string
} | null>(null)

function chapterLocation(blockIndex?: number): ContentLocation {
  return {
    fileId,
    bookId,
    chapterId,
    blockIndex,
    title: contentHtmlToText(chapter.value?.name) || 'Untitled chapter',
    bookTitle: unit.value?.name,
    quote: blockIndex === undefined ? undefined : blocks.value[blockIndex]?.text,
  }
}

const chapterBookmarked = computed(() => studyStore.isBookmarked(chapterLocation()))

async function shareChapter(): Promise<void> {
  const shareData = { title: chapterLocation().title, url: window.location.href }
  if (navigator.share) {
    await navigator.share(shareData)
  } else {
    await navigator.clipboard.writeText(window.location.href)
  }
}

function openNote(blockIndex?: number, initialBody = ''): void {
  noteBlockIndex.value = blockIndex
  noteInitialBody.value = initialBody
  noteEditorOpen.value = true
}

function createNoteFromSelectedPhrase(): void {
  if (!selectedPhrase.value) return
  openNote(selectedPhrase.value.blockIndex, `${selectedPhrase.value.exact}\n\n`)
  selectedPhrase.value = null
}

async function saveNote(body: string): Promise<void> {
  await studyStore.saveNote(chapterLocation(noteBlockIndex.value), body)
  noteEditorOpen.value = false
  noteInitialBody.value = ''
}

function renderedBlockHtml(index: number, html: string): string {
  const phrases = studyStore
    .textHighlights(chapterLocation(index))
    .filter((item) => !item.unmatched)
    .map((item) => item.exact || '')
    .filter(Boolean)
  return applyInlineHighlights(html, phrases)
}

function captureTextSelection(index: number, event: MouseEvent): void {
  if (isSelectMode.value) return
  const selection = window.getSelection()
  const exact = selection?.toString().trim() ?? ''
  if (exact.length < 2) return
  const body = (event.currentTarget as HTMLElement).querySelector('.content-block-body')
  if (
    !body ||
    !selection?.anchorNode ||
    !selection.focusNode ||
    !body.contains(selection.anchorNode) ||
    !body.contains(selection.focusNode)
  )
    return
  const full = body.textContent ?? ''
  const offset = full.indexOf(exact)
  selectedPhrase.value = {
    blockIndex: index,
    exact,
    prefix: offset < 0 ? '' : full.slice(Math.max(0, offset - 40), offset),
    suffix: offset < 0 ? '' : full.slice(offset + exact.length, offset + exact.length + 40),
  }
}

async function saveSelectedPhrase(): Promise<void> {
  if (!selectedPhrase.value) return
  await studyStore.addTextHighlight(
    chapterLocation(selectedPhrase.value.blockIndex),
    selectedPhrase.value.exact,
    selectedPhrase.value.prefix,
    selectedPhrase.value.suffix,
  )
  selectedPhrase.value = null
  window.getSelection()?.removeAllRanges()
}

async function shareSelectedPhrase(): Promise<void> {
  if (!selectedPhrase.value) return
  const payload = {
    title: chapterLocation().title,
    text: selectedPhrase.value.exact,
    url: window.location.href,
  }
  if (navigator.share) await navigator.share(payload)
  else await navigator.clipboard.writeText(`${payload.text}\n${payload.url}`)
}

// A fresh chapter's blocks means any in-progress selection no longer applies.
watch(blocks, () => {
  isSelectMode.value = false
  selectedIndices.value = new Set()
  void studyStore.reconcileTextHighlights(
    chapterLocation(),
    blocks.value.map((block) => block.text),
  )
  void studyStore.reconcileParagraphRecords(
    chapterLocation(),
    blocks.value.map((block) => block.text),
  )
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
          <router-link
            to="/study"
            class="icon-btn"
            :title="copy.text('reader.myStudy')"
            :aria-label="copy.text('reader.myStudy')"
          >
            <font-awesome-icon icon="note-sticky" />
          </router-link>
          <button
            type="button"
            class="icon-btn"
            :class="{ 'icon-btn--active': chapterBookmarked }"
            :title="copy.text('reader.bookmark')"
            :aria-label="copy.text('reader.bookmark')"
            @click="studyStore.toggleBookmark(chapterLocation())"
          >
            <font-awesome-icon icon="bookmark" />
          </button>
          <button
            type="button"
            class="icon-btn"
            :title="copy.text('reader.note')"
            :aria-label="copy.text('reader.note')"
            @click="openNote()"
          >
            <font-awesome-icon icon="note-sticky" />
          </button>
          <button
            type="button"
            class="icon-btn"
            :title="copy.text('reader.share')"
            :aria-label="copy.text('reader.share')"
            @click="shareChapter"
          >
            <font-awesome-icon icon="share-nodes" />
          </button>
          <button
            type="button"
            class="icon-btn"
            :class="{ 'icon-btn--active': isSelectMode }"
            :title="copy.text('reader.select')"
            :aria-label="copy.text('reader.select')"
            @click="toggleSelectMode"
          >
            <font-awesome-icon icon="highlighter" />
          </button>
          <button
            v-if="isSelectMode && selectedIndices.size > 0"
            type="button"
            class="icon-btn icon-btn--primary"
            :title="copy.text('reader.presentSelection')"
            :aria-label="copy.text('reader.presentSelection')"
            @click="presentSelection"
          >
            <font-awesome-icon icon="play" />
            <span class="icon-btn-count">{{ selectedIndices.size }}</span>
          </button>
          <router-link
            :to="`/present/${fileId}/${bookId}/${chapterId}`"
            class="icon-btn icon-btn--primary"
            :title="copy.text('reader.presentation')"
            :aria-label="copy.text('reader.presentation')"
          >
            <font-awesome-icon icon="display" />
          </router-link>
        </div>
        <h1 class="app-section-title mb-3">
          <span v-html="sanitizeContentHtml(chapter.name)"></span>
        </h1>
        <div class="prose prose-slate max-w-none dark:prose-invert app-content-scale">
          <div
            v-for="(block, index) in blocks"
            :id="`study-block-${index}`"
            :key="index"
            class="content-block"
            :class="{
              'content-block--selectable': isSelectMode && isSelectableBlock(block),
              'content-block--selected': isSelectMode && selectedIndices.has(index),
              'content-block--highlighted': studyStore.isParagraphHighlighted(
                chapterLocation(index),
              ),
            }"
            :role="isSelectMode && isSelectableBlock(block) ? 'button' : undefined"
            :tabindex="isSelectMode && isSelectableBlock(block) ? 0 : undefined"
            @click="isSelectMode && isSelectableBlock(block) && toggleBlockSelection(index)"
            @keydown.enter.prevent="
              isSelectMode && isSelectableBlock(block) && toggleBlockSelection(index)
            "
            @keydown.space.prevent="
              isSelectMode && isSelectableBlock(block) && toggleBlockSelection(index)
            "
            @mouseup="captureTextSelection(index, $event)"
          >
            <div class="content-block-body" v-html="renderedBlockHtml(index, block.html)"></div>
            <div v-if="isSelectableBlock(block) && !isSelectMode" class="study-block-actions">
              <button
                type="button"
                :class="{
                  'study-block-action--active': studyStore.isBookmarked(chapterLocation(index)),
                }"
                :aria-label="
                  studyStore.isBookmarked(chapterLocation(index))
                    ? copy.text('study.removeBookmark')
                    : copy.text('reader.bookmarkParagraph')
                "
                :title="copy.text('reader.bookmarkParagraph')"
                @click.stop="studyStore.toggleBookmark(chapterLocation(index))"
              >
                <font-awesome-icon icon="bookmark" />
              </button>
              <button
                type="button"
                :aria-label="
                  studyStore.isHighlighted(chapterLocation(index))
                    ? copy.text('reader.removeHighlight')
                    : copy.text('reader.highlightParagraph')
                "
                :title="copy.text('reader.highlightParagraph')"
                @click.stop="studyStore.toggleParagraphHighlight(chapterLocation(index))"
              >
                <font-awesome-icon icon="highlighter" />
              </button>
              <button
                type="button"
                :aria-label="copy.text('reader.addNote')"
                :title="copy.text('reader.addNote')"
                @click.stop="openNote(index)"
              >
                <font-awesome-icon icon="note-sticky" />
              </button>
            </div>
          </div>
        </div>
        <div
          v-if="selectedPhrase"
          class="selection-actions"
          role="toolbar"
          :aria-label="copy.text('reader.selectedActions')"
        >
          <span class="line-clamp-1 min-w-0 flex-1">“{{ selectedPhrase.exact }}”</span>
          <button
            type="button"
            class="app-chip"
            :title="copy.text('reader.highlight')"
            :aria-label="copy.text('reader.highlight')"
            @click="saveSelectedPhrase"
          >
            <font-awesome-icon icon="highlighter" />
          </button>
          <button
            type="button"
            class="app-chip"
            :title="copy.text('reader.addNote')"
            :aria-label="copy.text('reader.addNote')"
            @click="createNoteFromSelectedPhrase"
          >
            <font-awesome-icon icon="note-sticky" />
          </button>
          <button
            type="button"
            class="app-chip"
            :title="copy.text('reader.shareSelection')"
            :aria-label="copy.text('reader.shareSelection')"
            @click="shareSelectedPhrase"
          >
            <font-awesome-icon icon="share-nodes" />
          </button>
          <button
            type="button"
            :aria-label="copy.text('reader.close')"
            :title="copy.text('reader.close')"
            @click="selectedPhrase = null"
          >
            ×
          </button>
        </div>
        <StudyNoteDialog
          :open="noteEditorOpen"
          :quote="noteBlockIndex === undefined ? '' : blocks[noteBlockIndex]?.text"
          :initial-body="noteInitialBody"
          @save="saveNote"
          @cancel="noteEditorOpen = false"
        />
        <SafeMediaLinks
          :audio-url="chapter.audiourl"
          :video-url="chapter.videourl"
          :audio-embed="chapter.audioembed"
          :video-embed="chapter.videoembed"
        />
      </section>
      <section v-else>
        <p class="text-center text-slate-500 dark:text-slate-300">
          <BilingualText text-key="reader.loading" />
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
  width: 2.75rem;
  height: 2.75rem;
  justify-content: center;
  border: 1px solid var(--lc-border);
  color: var(--lc-brand);
  background: var(--app-panel);
  transition:
    background-color 0.15s ease,
    color 0.15s ease;
}

.icon-btn:hover {
  background: var(--lc-soft);
}

.icon-btn--active {
  background: var(--lc-brand);
  color: #f6f1e7;
}

.icon-btn--active:hover {
  background: color-mix(in srgb, var(--lc-brand), black 8%);
}

.icon-btn--primary {
  width: auto;
  padding: 0 0.9rem;
  background: var(--lc-brand);
  color: #f6f1e7;
  border-color: transparent;
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.1);
}

.icon-btn--primary:hover {
  background: color-mix(in srgb, var(--lc-brand), black 8%);
}

.icon-btn-count {
  font-size: 0.8rem;
  font-weight: 700;
}

.dark .icon-btn {
  color: var(--lc-gold);
}
.dark .icon-btn--active,
.dark .icon-btn--primary {
  background: var(--lc-gold);
  color: #102b34;
}

.content-block {
  display: block;
  position: relative;
}

.content-block--selectable {
  display: block;
  cursor: pointer;
  border-radius: 0.5rem;
  padding: 0.15rem 0.5rem;
  margin: 0 -0.5rem;
  transition:
    background-color 0.15s ease,
    outline-color 0.15s ease;
  outline: 2px solid transparent;
  outline-offset: 2px;
}

.content-block--selectable:hover {
  background: rgba(15, 23, 42, 0.05);
}

.content-block--selectable:focus-visible {
  outline-color: color-mix(in srgb, var(--lc-brand), transparent 35%);
}

/* Highlighter-marker look: a warm translucent highlight behind the text,
   like the paragraph has been marked with a highlighter pen. */
.content-block--selected {
  background: rgba(250, 204, 21, 0.4);
}

.content-block--selected:hover {
  background: rgba(250, 204, 21, 0.5);
}

.dark .content-block--selectable:hover {
  background: rgba(226, 232, 240, 0.06);
}

.dark .content-block--selected {
  background: rgba(250, 204, 21, 0.22);
}

.dark .content-block--selected:hover {
  background: rgba(250, 204, 21, 0.3);
}

.content-block-body {
  min-width: 0;
}

.content-block--highlighted {
  display: block;
  background: color-mix(in srgb, var(--lc-gold), transparent 63%);
  border-radius: 0.45rem;
  padding: 0.15rem 0.5rem;
  margin: 0 -0.5rem;
}
.study-block-actions {
  position: absolute;
  right: 0.2rem;
  top: 0.2rem;
  display: flex;
  gap: 0.2rem;
  opacity: 0;
  transition: opacity 0.15s ease;
}
.content-block:hover .study-block-actions,
.study-block-actions:focus-within {
  opacity: 1;
}
.study-block-actions button {
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 999px;
  background: var(--app-panel);
  color: var(--lc-brand);
  border: 1px solid var(--lc-border);
}
.study-block-actions button:hover,
.study-block-action--active {
  background: var(--lc-soft);
  color: var(--lc-brand);
}
.content-block--targeted {
  animation: study-target 2.6s ease-out;
  scroll-margin: 6rem;
}
@keyframes study-target {
  from {
    background: color-mix(in srgb, var(--lc-gold), transparent 42%);
  }
  to {
    background: transparent;
  }
}
.selection-actions {
  position: sticky;
  bottom: 1rem;
  z-index: 21;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
  padding: 0.7rem;
  border: 1px solid var(--lc-border);
  border-radius: 999px;
  background: var(--app-panel);
  box-shadow: var(--app-panel-shadow);
}
:deep(mark.study-inline-highlight) {
  border-radius: 0.15em;
  background: color-mix(in srgb, var(--lc-gold), transparent 38%);
  color: inherit;
  padding: 0 0.08em;
}

@media (hover: none) {
  .study-block-actions {
    position: static;
    justify-content: flex-end;
    opacity: 1;
  }
}
</style>
