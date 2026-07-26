<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toPng } from 'html-to-image'
import { useContentStore } from '@/stores/content'
import { FONT_SCALE_MAX, FONT_SCALE_MIN, FONT_SCALE_STEP, useSettingsStore } from '@/stores/settings'
import { usePresentationSelectionStore } from '@/stores/presentationSelection'
import { buildSlidesFromSelection, createSlideGenerator, parseBlocks, type Slide } from '@/utils/slideGenerators'
import { aspectRatioPresets, getAspectRatioPreset, type AspectRatioId } from '@/utils/aspectRatios'
import { exportSlidesAsPptx, exportSlidesAsZip, sanitizeFilename } from '@/utils/presentationExport'
import { laoFontPresets, getLaoFontPreset, type LaoFontId } from '@/utils/laoFonts'
import {
  presentationThemePresets,
  getPresentationThemePreset,
  type PresentationThemeId,
} from '@/utils/presentationThemes'
import type { PresentationTextAlign } from '@/stores/settings'

const route = useRoute()
const router = useRouter()
const store = useContentStore()
const settings = useSettingsStore()
const selectionStore = usePresentationSelectionStore()

const fileId = parseInt(route.params.fileid as string, 10)
const bookId = parseInt(route.params.bookid as string, 10)
const chapterId = parseInt(route.params.chapterid as string, 10)

const currentSlideIndex = ref(0)
const isFullscreen = ref(false)
const slideCanvas = ref<HTMLElement | null>(null)
const isSelectionPanelOpen = ref(false)
const isCustomizePanelOpen = ref(false)
const isExporting = ref(false)
const selectedSlideIds = ref<Set<string>>(new Set())
const rangeStart = ref(1)
const rangeEnd = ref(1)

const hasSavedSelection = computed(() => selectionStore.hasSelectionFor(chapterId))
const slideSourceMode = ref<'full' | 'selection'>(
  selectionStore.hasSelectionFor(chapterId) ? 'selection' : 'full'
)

onMounted(async () => {
  await settings.load()
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
    return
  }

  document.addEventListener('keydown', handleKeydown)
  document.addEventListener('fullscreenchange', onFullscreenChange)
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.removeEventListener('fullscreenchange', onFullscreenChange)
  window.removeEventListener('resize', handleResize)
})

function handleResize(): void {
  void measureFit()
}

const unit = computed(() =>
  store.currentSetData?.unit.find((entry) => entry.id === bookId)
)

const chapter = computed(() =>
  unit.value?.contents.find((entry) => entry.id === chapterId)
)

const slideGenerator = computed(() =>
  createSlideGenerator(store.getCurrentContentType())
)

const slides = computed<Slide[]>(() => {
  if (!chapter.value) return []

  const context = {
    title: chapter.value.name,
    html: chapter.value.content || '',
    bookTitle: unit.value?.name,
  }

  try {
    if (slideSourceMode.value === 'selection' && selectionStore.hasSelectionFor(chapterId)) {
      const allBlocks = parseBlocks(context.html)
      const selectedBlocks = allBlocks.filter((_, index) => selectionStore.selectedBlockIndices.has(index))
      return buildSlidesFromSelection(context, selectedBlocks, selectionStore.groupingMode)
    }

    return slideGenerator.value.generate(context)
  } catch (err) {
    console.error('Failed to generate presentation slides', err)
    return []
  }
})

const contentSlides = computed(() => slides.value.slice(1))

// Reset slide selection whenever a new chapter's slides are (re)generated.
watch(slides, (newSlides) => {
  selectedSlideIds.value = new Set(newSlides.map((slide) => slide.id))
  currentSlideIndex.value = 0
  rangeStart.value = 1
  rangeEnd.value = Math.max(newSlides.length - 1, 1)
})

const activeSlides = computed<Slide[]>(() =>
  slides.value.filter((slide) => selectedSlideIds.value.has(slide.id))
)

watch(activeSlides, (list) => {
  if (currentSlideIndex.value >= list.length) {
    currentSlideIndex.value = Math.max(list.length - 1, 0)
  }
})

const currentSlide = computed(() => activeSlides.value[currentSlideIndex.value] || null)

// Auto-shrinks slide text to fit the fixed slide box instead of scrolling --
// a scrollbar would mean the PNG/PPTX export (which renders at a fixed pixel
// size) silently crops whatever doesn't fit on screen.
const fitScale = ref(1)
const MIN_FIT_SCALE = 0.4

async function measureFit(): Promise<void> {
  fitScale.value = 1
  await nextTick()

  const el = slideCanvas.value
  if (!el) return

  let iterations = 0
  while (el.scrollHeight > el.clientHeight + 1 && fitScale.value > MIN_FIT_SCALE && iterations < 6) {
    const ratio = el.clientHeight / el.scrollHeight
    fitScale.value = Math.max(MIN_FIT_SCALE, fitScale.value * ratio * 0.97)
    await nextTick()
    iterations += 1
  }
}

watch(
  [currentSlide, () => settings.presentationAspectRatio, () => settings.presentationFontScale],
  () => {
    void measureFit()
  }
)

watch(slideCanvas, (el) => {
  if (el) void measureFit()
})

const progressLabel = computed(() => {
  if (activeSlides.value.length === 0) return '0 / 0'
  return `${currentSlideIndex.value + 1} / ${activeSlides.value.length}`
})

const hasAutoSplitSlides = computed(() => contentSlides.value.length > 1)
const isTitleSlideIncluded = computed(() => selectedSlideIds.value.has('title'))
const selectedContentSlideCount = computed(
  () => contentSlides.value.filter((slide) => selectedSlideIds.value.has(slide.id)).length
)

const currentPreset = computed(() => getAspectRatioPreset(settings.presentationAspectRatio))
const currentTheme = computed(() => getPresentationThemePreset(settings.presentationTheme))
const currentFont = computed(() => getLaoFontPreset(settings.presentationFontFamily))

function goNext(): void {
  if (currentSlideIndex.value < activeSlides.value.length - 1) {
    currentSlideIndex.value += 1
  }
}

function goPrev(): void {
  if (currentSlideIndex.value > 0) {
    currentSlideIndex.value -= 1
  }
}

function handleKeydown(event: KeyboardEvent): void {
  if (event.key === 'ArrowRight' || event.key === 'PageDown' || event.key === ' ') {
    event.preventDefault()
    goNext()
    return
  }

  if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
    event.preventDefault()
    goPrev()
    return
  }

  if (event.key.toLowerCase() === 'f') {
    event.preventDefault()
    void toggleFullscreen()
    return
  }

  if (event.key.toLowerCase() === 'e') {
    event.preventDefault()
    void exportCurrentSlide()
  }
}

function slidePreview(slide: Slide): string {
  const text = slide.html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  return text.length > 70 ? `${text.slice(0, 70)}…` : text
}

function toggleSlideSelection(id: string): void {
  const next = new Set(selectedSlideIds.value)
  if (next.has(id)) {
    next.delete(id)
  } else {
    next.add(id)
  }
  selectedSlideIds.value = next
}

function selectAllSlides(): void {
  selectedSlideIds.value = new Set(slides.value.map((slide) => slide.id))
}

function selectNoContentSlides(): void {
  selectedSlideIds.value = isTitleSlideIncluded.value ? new Set(['title']) : new Set()
}

function applyRange(): void {
  const total = contentSlides.value.length
  if (total === 0) return

  const start = Math.min(Math.max(Math.round(rangeStart.value) || 1, 1), total)
  const end = Math.min(Math.max(Math.round(rangeEnd.value) || start, start), total)
  rangeStart.value = start
  rangeEnd.value = end

  const rangeIds = new Set(contentSlides.value.slice(start - 1, end).map((slide) => slide.id))
  if (isTitleSlideIncluded.value) rangeIds.add('title')
  selectedSlideIds.value = rangeIds
}

function setAspectRatio(id: AspectRatioId): void {
  settings.setPresentationAspectRatio(id)
}

function setTheme(id: PresentationThemeId): void {
  settings.setPresentationTheme(id)
}

function setTextAlign(value: PresentationTextAlign): void {
  settings.setPresentationTextAlign(value)
}

function setFontFamily(id: LaoFontId): void {
  settings.setPresentationFontFamily(id)
}

function increaseFontScale(): void {
  settings.setPresentationFontScale(
    Math.round((settings.presentationFontScale + FONT_SCALE_STEP) * 100) / 100
  )
}

function decreaseFontScale(): void {
  settings.setPresentationFontScale(
    Math.round((settings.presentationFontScale - FONT_SCALE_STEP) * 100) / 100
  )
}

async function exportCurrentSlide(): Promise<void> {
  if (!slideCanvas.value || !currentSlide.value) return

  const image = await toPng(slideCanvas.value, {
    cacheBust: true,
    pixelRatio: 2,
  })

  const link = document.createElement('a')
  link.download = `${sanitizeFilename(currentSlide.value.title)}.png`
  link.href = image
  link.click()
}

async function renderSlideForExport(slide: { id: string }): Promise<HTMLElement> {
  const index = activeSlides.value.findIndex((candidate) => candidate.id === slide.id)
  if (index === -1) throw new Error('Slide not found in current selection')

  currentSlideIndex.value = index
  await nextTick()
  // Give fonts/layout a beat to settle before rasterizing.
  await new Promise((resolve) => setTimeout(resolve, 60))

  if (!slideCanvas.value) throw new Error('Slide canvas not ready')
  return slideCanvas.value
}

async function exportZip(): Promise<void> {
  if (!activeSlides.value.length || isExporting.value) return

  isExporting.value = true
  const originalIndex = currentSlideIndex.value
  try {
    await exportSlidesAsZip(
      activeSlides.value,
      currentPreset.value,
      renderSlideForExport,
      chapter.value?.name ?? 'presentation'
    )
  } catch (err) {
    console.error('Failed to export slides as ZIP', err)
  } finally {
    currentSlideIndex.value = originalIndex
    isExporting.value = false
  }
}

async function exportPptx(): Promise<void> {
  if (!activeSlides.value.length || isExporting.value) return

  isExporting.value = true
  const originalIndex = currentSlideIndex.value
  try {
    await exportSlidesAsPptx(
      activeSlides.value,
      currentPreset.value,
      renderSlideForExport,
      chapter.value?.name ?? 'presentation'
    )
  } catch (err) {
    console.error('Failed to export slides as PPTX', err)
  } finally {
    currentSlideIndex.value = originalIndex
    isExporting.value = false
  }
}

async function toggleFullscreen(): Promise<void> {
  if (!document.fullscreenElement) {
    await document.documentElement.requestFullscreen()
    return
  }
  await document.exitFullscreen()
}

function onFullscreenChange(): void {
  isFullscreen.value = Boolean(document.fullscreenElement)
}
</script>

<template>
  <main class="presentation-shell">
    <header class="presentation-toolbar">
      <router-link
        :to="`/content/${fileId}/${bookId}/${chapterId}`"
        class="presentation-btn"
        title="Exit presentation (Esc)"
      >
        Exit
      </router-link>
      <span class="presentation-progress">{{ progressLabel }}</span>
      <span v-if="hasAutoSplitSlides" class="presentation-split-badge">
        {{ selectedContentSlideCount }} / {{ contentSlides.length }} slides selected
      </span>

      <div v-if="hasSavedSelection" class="presentation-field">
        <span class="presentation-field-label">Slides from</span>
        <button
          class="presentation-btn presentation-btn-compact"
          type="button"
          :class="{ 'presentation-btn-active': slideSourceMode === 'full' }"
          @click="slideSourceMode = 'full'"
        >
          Full chapter
        </button>
        <button
          class="presentation-btn presentation-btn-compact"
          type="button"
          :class="{ 'presentation-btn-active': slideSourceMode === 'selection' }"
          @click="slideSourceMode = 'selection'"
        >
          My selection
        </button>
      </div>

      <div v-if="slideSourceMode === 'selection'" class="presentation-field">
        <span class="presentation-field-label">Grouping</span>
        <button
          class="presentation-btn presentation-btn-compact"
          type="button"
          :class="{ 'presentation-btn-active': selectionStore.groupingMode === 'grouped' }"
          @click="selectionStore.setGroupingMode('grouped')"
        >
          Grouped
        </button>
        <button
          class="presentation-btn presentation-btn-compact"
          type="button"
          :class="{ 'presentation-btn-active': selectionStore.groupingMode === 'split' }"
          @click="selectionStore.setGroupingMode('split')"
        >
          Split
        </button>
      </div>

      <button class="presentation-btn" type="button" title="Previous slide (Left arrow, Page Up)" @click="goPrev">Prev</button>
      <button class="presentation-btn" type="button" title="Next slide (Right arrow, Page Down, Space)" @click="goNext">Next</button>

      <label class="presentation-field">
        <span class="presentation-field-label">Size</span>
        <select
          class="presentation-select"
          :value="settings.presentationAspectRatio"
          @change="setAspectRatio(($event.target as HTMLSelectElement).value as AspectRatioId)"
        >
          <option v-for="preset in aspectRatioPresets" :key="preset.id" :value="preset.id">
            {{ preset.label }}
          </option>
        </select>
      </label>

      <div class="presentation-field">
        <span class="presentation-field-label">Font</span>
        <button
          class="presentation-btn presentation-btn-compact"
          type="button"
          title="Decrease slide font size"
          :disabled="settings.presentationFontScale <= FONT_SCALE_MIN"
          @click="decreaseFontScale"
        >
          −
        </button>
        <span class="presentation-scale-value">{{ Math.round(settings.presentationFontScale * 100) }}%</span>
        <button
          class="presentation-btn presentation-btn-compact"
          type="button"
          title="Increase slide font size"
          :disabled="settings.presentationFontScale >= FONT_SCALE_MAX"
          @click="increaseFontScale"
        >
          +
        </button>
        <button
          class="presentation-btn presentation-btn-compact"
          type="button"
          title="Reset slide font size to 100%"
          :disabled="settings.presentationFontScale === 1"
          @click="settings.resetPresentationFontScale"
        >
          ↺
        </button>
      </div>

      <button
        class="presentation-btn"
        type="button"
        title="Choose which slides to include"
        @click="isSelectionPanelOpen = !isSelectionPanelOpen"
      >
        {{ isSelectionPanelOpen ? 'Close selection' : 'Select slides' }}
      </button>

      <button
        class="presentation-btn"
        type="button"
        title="Customize theme, alignment, and font"
        @click="isCustomizePanelOpen = !isCustomizePanelOpen"
      >
        {{ isCustomizePanelOpen ? 'Close customize' : 'Customize' }}
      </button>

      <button class="presentation-btn" type="button" :title="isFullscreen ? 'Exit fullscreen (F)' : 'Toggle fullscreen (F)'" @click="toggleFullscreen">
        {{ isFullscreen ? 'Windowed' : 'Fullscreen' }}
      </button>
      <button class="presentation-btn" type="button" title="Export current slide as PNG (E)" @click="exportCurrentSlide">Export PNG</button>
      <button class="presentation-btn" type="button" :disabled="isExporting" title="Export selected slides as a ZIP of PNGs" @click="exportZip">
        {{ isExporting ? 'Exporting…' : 'Export ZIP' }}
      </button>
      <button class="presentation-btn" type="button" :disabled="isExporting" title="Export selected slides as a PowerPoint file" @click="exportPptx">
        {{ isExporting ? 'Exporting…' : 'Export PPTX' }}
      </button>
    </header>

    <section v-if="isSelectionPanelOpen" class="selection-panel">
      <div class="selection-panel-row">
        <label class="selection-title-toggle">
          <input type="checkbox" :checked="isTitleSlideIncluded" @change="toggleSlideSelection('title')" />
          Include title slide
        </label>
        <button class="presentation-btn presentation-btn-compact" type="button" @click="selectAllSlides">Select all</button>
        <button class="presentation-btn presentation-btn-compact" type="button" @click="selectNoContentSlides">Select none</button>
      </div>

      <div v-if="contentSlides.length > 1" class="selection-panel-row">
        <span class="presentation-field-label">Slides</span>
        <input v-model.number="rangeStart" type="number" min="1" :max="contentSlides.length" class="presentation-range-input" />
        <span>to</span>
        <input v-model.number="rangeEnd" type="number" min="1" :max="contentSlides.length" class="presentation-range-input" />
        <button class="presentation-btn presentation-btn-compact" type="button" @click="applyRange">Apply range</button>
      </div>

      <ul class="selection-list">
        <li v-for="(slide, index) in contentSlides" :key="slide.id" class="selection-list-item">
          <label>
            <input
              type="checkbox"
              :checked="selectedSlideIds.has(slide.id)"
              @change="toggleSlideSelection(slide.id)"
            />
            <span class="selection-list-index">{{ index + 1 }}.</span>
            <span class="selection-list-preview">{{ slidePreview(slide) }}</span>
          </label>
        </li>
      </ul>
    </section>

    <section v-if="isCustomizePanelOpen" class="selection-panel">
      <div class="selection-panel-row">
        <span class="presentation-field-label">Theme</span>
        <select
          class="presentation-select"
          :value="settings.presentationTheme"
          @change="setTheme(($event.target as HTMLSelectElement).value as PresentationThemeId)"
        >
          <option v-for="preset in presentationThemePresets" :key="preset.id" :value="preset.id">
            {{ preset.label }}
          </option>
        </select>
      </div>

      <div class="selection-panel-row">
        <span class="presentation-field-label">Text align</span>
        <button
          class="presentation-btn presentation-btn-compact"
          type="button"
          :class="{ 'presentation-btn-active': settings.presentationTextAlign === 'left' }"
          @click="setTextAlign('left')"
        >
          Left
        </button>
        <button
          class="presentation-btn presentation-btn-compact"
          type="button"
          :class="{ 'presentation-btn-active': settings.presentationTextAlign === 'center' }"
          @click="setTextAlign('center')"
        >
          Center
        </button>
      </div>

      <div class="selection-panel-row">
        <span class="presentation-field-label">Font</span>
        <select
          class="presentation-select"
          :value="settings.presentationFontFamily"
          @change="setFontFamily(($event.target as HTMLSelectElement).value as LaoFontId)"
        >
          <option v-for="preset in laoFontPresets" :key="preset.id" :value="preset.id">
            {{ preset.label }}
          </option>
        </select>
      </div>
    </section>

    <section
      class="slide-canvas"
      :style="{
        '--slide-ratio': currentPreset.ratio,
        '--slide-font-scale': settings.presentationFontScale * fitScale,
        '--slide-background': currentTheme.background,
        '--slide-text-color': currentTheme.textColor,
        '--slide-muted-color': currentTheme.mutedColor,
        '--slide-text-align': settings.presentationTextAlign,
        '--slide-font-family': currentFont.cssFamily,
      }"
    >
      <article
        v-if="currentSlide"
        ref="slideCanvas"
        class="slide-content"
        :class="{ 'slide-content--title': currentSlide.id === 'title' }"
      >
        <h1
          class="slide-title"
          :class="{ 'slide-title--header': currentSlide.id !== 'title' }"
          v-html="currentSlide.title"
        ></h1>
        <div v-if="currentSlide.id === 'title'" class="slide-subtitle" v-html="currentSlide.html"></div>
        <div v-else class="slide-body" v-html="currentSlide.html"></div>
      </article>
      <article v-else-if="!chapter" class="slide-empty">Loading chapter...</article>
      <article v-else class="slide-empty">No slides selected — use "Select slides" to choose which slides to include.</article>
    </section>
  </main>
</template>

<style scoped>
.presentation-shell {
  min-height: 100vh;
  background: #0f172a;
  color: #f8fafc;
  display: grid;
  grid-template-rows: auto auto 1fr;
  padding-bottom: env(safe-area-inset-bottom);
}

.presentation-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  padding: 0.75rem;
  background: rgba(15, 23, 42, 0.95);
  border-bottom: 1px solid rgba(148, 163, 184, 0.35);
}

.presentation-progress {
  margin-right: auto;
  margin-left: 0.5rem;
  color: #cbd5e1;
  font-size: 0.9rem;
}

.presentation-split-badge {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 0.35rem 0.65rem;
  margin-left: 0.25rem;
  background: rgba(14, 165, 233, 0.18);
  border: 1px solid rgba(125, 211, 252, 0.35);
  color: #cffafe;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.presentation-btn {
  border: 1px solid rgba(148, 163, 184, 0.35);
  border-radius: 0.4rem;
  padding: 0.45rem 0.7rem;
  font-size: 0.9rem;
  background: #1e293b;
  color: #f8fafc;
  text-decoration: none;
  cursor: pointer;
}

.presentation-btn:hover {
  background: #334155;
}

.presentation-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.presentation-btn-active {
  background: rgba(56, 189, 248, 0.25);
  border-color: rgba(125, 211, 252, 0.5);
}

.presentation-btn-compact {
  padding: 0.3rem 0.55rem;
  font-size: 0.85rem;
}

.presentation-field {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.presentation-field-label {
  font-size: 0.78rem;
  color: #cbd5e1;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.presentation-select {
  border: 1px solid rgba(148, 163, 184, 0.35);
  border-radius: 0.4rem;
  padding: 0.4rem 0.5rem;
  font-size: 0.85rem;
  background: #1e293b;
  color: #f8fafc;
}

.presentation-scale-value {
  min-width: 3ch;
  text-align: center;
  font-size: 0.85rem;
  color: #e2e8f0;
}

.selection-panel {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding: 0.75rem 1rem;
  background: rgba(15, 23, 42, 0.88);
  border-bottom: 1px solid rgba(148, 163, 184, 0.25);
}

.selection-panel-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.85rem;
  color: #e2e8f0;
}

.selection-title-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.presentation-range-input {
  width: 4.5rem;
  border: 1px solid rgba(148, 163, 184, 0.35);
  border-radius: 0.35rem;
  padding: 0.3rem 0.4rem;
  background: #1e293b;
  color: #f8fafc;
}

.selection-list {
  list-style: none;
  margin: 0;
  padding: 0;
  max-height: 220px;
  overflow-y: auto;
  border-radius: 0.5rem;
  border: 1px solid rgba(148, 163, 184, 0.2);
}

.selection-list-item {
  border-bottom: 1px solid rgba(148, 163, 184, 0.12);
}

.selection-list-item:last-child {
  border-bottom: none;
}

.selection-list-item label {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.4rem 0.6rem;
  font-size: 0.82rem;
  color: #dbeafe;
  cursor: pointer;
}

.selection-list-item label:hover {
  background: rgba(148, 163, 184, 0.1);
}

.selection-list-index {
  color: #94a3b8;
  flex-shrink: 0;
}

.selection-list-preview {
  overflow-wrap: anywhere;
}

.slide-canvas {
  display: grid;
  place-items: center;
  padding: 2rem;
  overflow: auto;
}

.slide-content {
  aspect-ratio: var(--slide-ratio, 1.7778);
  width: min(1200px, 96vw, calc(78vh * var(--slide-ratio, 1.7778)));
  background: var(--slide-background, radial-gradient(circle at top right, rgba(56, 189, 248, 0.18), rgba(15, 23, 42, 0.95)));
  color: var(--slide-text-color, #f8fafc);
  font-family: var(--slide-font-family, inherit);
  text-align: var(--slide-text-align, left);
  border: 2px solid rgba(148, 163, 184, 0.3);
  border-radius: 1rem;
  padding: 2.5rem;
  box-shadow: 0 30px 70px rgba(2, 6, 23, 0.55);
  /* Text is auto-shrunk to fit (see fitScale) instead of scrolling, so a
     PNG/PPTX export never silently crops content that doesn't fit. */
  overflow: hidden;
}

.slide-content--title {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.slide-content--title .slide-title {
  text-align: center;
}

.slide-title {
  margin: 0;
  font-size: calc(clamp(1.6rem, 3vw, 3rem) * var(--slide-font-scale, 1));
  line-height: 1.1;
}

/* Content slides show "Book — Chapter" as a running header rather than a
   dominant title, so it doesn't compete with the actual slide content. */
.slide-title--header {
  font-size: calc(clamp(1rem, 1.6vw, 1.4rem) * var(--slide-font-scale, 1));
  font-weight: 600;
  color: var(--slide-muted-color, #cbd5e1);
  opacity: 0.85;
}

.slide-subtitle {
  margin-top: 0.75rem;
  font-size: calc(clamp(1rem, 1.6vw, 1.5rem) * var(--slide-font-scale, 1));
  color: var(--slide-muted-color, #cbd5e1);
}

.slide-body {
  margin-top: 1.5rem;
  font-size: calc(clamp(1.1rem, 2vw, 2rem) * var(--slide-font-scale, 1));
  line-height: 1.5;
}

.slide-body :deep(p) {
  margin: 0 0 0.9rem;
}

.slide-body :deep(ul),
.slide-body :deep(ol) {
  padding-left: 1.4rem;
}

.slide-empty {
  color: #cbd5e1;
  font-size: 1.25rem;
  max-width: 40ch;
  text-align: center;
}

@media (max-width: 768px) {
  .presentation-toolbar {
    justify-content: center;
  }

  .presentation-progress {
    width: 100%;
    margin: 0;
    text-align: center;
    order: -1;
  }

  .slide-canvas {
    padding: 1rem;
  }

  .slide-content {
    width: min(1200px, 96vw);
    padding: 1.25rem;
  }
}
</style>
