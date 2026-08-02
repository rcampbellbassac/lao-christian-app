<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDeckStore, type Deck, type DeckSlide } from '@/stores/decks'
import { aspectRatioPresets } from '@/utils/aspectRatios'
import { presentationThemePresets } from '@/utils/presentationThemes'
import { sanitizeContentHtml } from '@/utils/sanitize'
import { getAspectRatioPreset } from '@/utils/aspectRatios'
import DeckSlideCanvas from '@/components/DeckSlideCanvas.vue'

const route = useRoute()
const router = useRouter()
const decks = useDeckStore()
const selectedSlideId = ref<string | null>(null)
const status = ref('')
const isExporting = ref(false)
const exportSlide = ref<DeckSlide | undefined>()
const exportStage = ref<HTMLElement | null>(null)

const deck = computed(() => route.params.deckId ? decks.getDeck(route.params.deckId as string) : undefined)
const selectedIndex = computed(() => deck.value?.slides.findIndex(slide => slide.id === selectedSlideId.value) ?? -1)
const selectedSlide = computed(() => selectedIndex.value >= 0 ? deck.value?.slides[selectedIndex.value] : undefined)

onMounted(async () => {
  await decks.load()
  if (deck.value?.slides[0]) selectedSlideId.value = deck.value.slides[0].id
})

watch(() => route.params.deckId, () => {
  selectedSlideId.value = deck.value?.slides[0]?.id ?? null
})

async function newDeck(): Promise<void> {
  const created = await decks.createDeck()
  await decks.addSlide(created)
  await router.push(`/decks/${created.id}`)
}

function textFromHtml(html: string): string {
  return new DOMParser().parseFromString(html, 'text/html').body.textContent ?? ''
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>')
}

async function updateSlideBody(slide: DeckSlide, event: Event): Promise<void> {
  slide.html = `<p>${escapeHtml((event.target as HTMLTextAreaElement).value)}</p>`
  if (deck.value) await decks.saveDeck(deck.value)
  status.value = 'Saved locally'
}

async function saveDeck(): Promise<void> {
  if (!deck.value) return
  await decks.saveDeck(deck.value)
  status.value = 'Saved locally'
}

async function deleteDeck(target: Deck): Promise<void> {
  await decks.removeDeck(target.id)
  await router.push('/decks')
}

async function renderForExport(slide: { id: string }): Promise<HTMLElement> {
  exportSlide.value = deck.value?.slides.find(item => item.id === slide.id)
  await nextTick()
  await document.fonts?.ready
  const canvas = exportStage.value?.querySelector<HTMLElement>('.deck-canvas')
  if (!canvas) throw new Error('Slide canvas is unavailable.')
  return canvas
}

async function runExport(kind: 'png' | 'zip' | 'pptx'): Promise<void> {
  if (!deck.value || isExporting.value) return
  const visibleSlides = deck.value.slides.filter(slide => !slide.hidden)
  if (!visibleSlides.length) { status.value = 'No visible slides to export'; return }
  isExporting.value = true
  status.value = 'Preparing export…'
  try {
    const exporter = await import('@/utils/presentationExport')
    const preset = getAspectRatioPreset(deck.value.aspectRatio)
    if (kind === 'png') {
      const slide = selectedSlide.value && !selectedSlide.value.hidden ? selectedSlide.value : visibleSlides[0]!
      await exporter.exportSlideAsPng({ ...slide, element: await renderForExport(slide) }, preset, deck.value.name)
    } else if (kind === 'zip') {
      await exporter.exportSlidesAsZip(visibleSlides, preset, renderForExport, deck.value.name)
    } else {
      await exporter.exportSlidesAsPptx(visibleSlides, preset, renderForExport, deck.value.name)
    }
    status.value = 'Export complete'
  } catch (error) {
    console.error('Deck export failed', error)
    status.value = 'Export failed'
  } finally {
    isExporting.value = false
    exportSlide.value = undefined
  }
}
</script>

<template>
  <main class="app-page">
    <section v-if="!deck" class="app-panel">
      <div class="flex items-center justify-between gap-3"><div><h1 class="app-section-title">ສະຕູດິໂອສະໄລ້</h1><p class="app-muted">Slide Studio · Decks stay on this device</p></div><button type="button" class="studio-primary" @click="newDeck">＋ New deck</button></div>
      <ul class="mt-6 grid gap-3 sm:grid-cols-2">
        <li v-for="item in decks.decks" :key="item.id" class="lc-card p-4">
          <router-link :to="`/decks/${item.id}`" class="app-link text-lg">{{ item.name }}</router-link>
          <p class="app-muted mt-1 text-sm">{{ item.slides.length }} slides · {{ new Date(item.updatedAt).toLocaleDateString() }}</p>
        </li>
      </ul>
      <p v-if="decks.isLoaded && !decks.decks.length" class="app-muted py-12 text-center">No saved decks yet. Create one here or save a generated presentation.</p>
    </section>

    <section v-else class="studio-shell">
      <header class="studio-toolbar">
        <router-link to="/decks" class="app-chip">← Decks</router-link>
        <input v-model="deck.name" class="studio-title" aria-label="Deck name" @change="saveDeck">
        <span class="app-muted text-xs">{{ status }}</span>
        <router-link :to="`/present/deck/${deck.id}`" class="studio-primary">Present</router-link>
        <button type="button" class="app-chip" :disabled="isExporting" @click="runExport('png')">PNG</button>
        <button type="button" class="app-chip" :disabled="isExporting" @click="runExport('zip')">ZIP</button>
        <button type="button" class="app-chip" :disabled="isExporting" @click="runExport('pptx')">PPTX</button>
        <button type="button" class="app-chip" @click="deleteDeck(deck)">Delete deck</button>
      </header>
      <div class="studio-grid">
        <aside class="studio-sidebar">
          <button type="button" class="studio-primary w-full" @click="decks.addSlide(deck)">＋ Add slide</button>
          <ol class="mt-3 grid gap-2">
            <li v-for="(slide, index) in deck.slides" :key="slide.id" class="studio-slide-item" :class="{ 'studio-slide-item--active': slide.id === selectedSlideId }" @click="selectedSlideId = slide.id">
              <span>{{ index + 1 }}</span><span class="min-w-0 flex-1 truncate">{{ slide.title }}</span><span v-if="slide.hidden">◌</span>
            </li>
          </ol>
        </aside>
        <section v-if="selectedSlide" class="studio-editor">
          <div class="studio-slide-preview"><h2>{{ selectedSlide.title }}</h2><div v-html="sanitizeContentHtml(selectedSlide.html)"></div></div>
          <label>Slide title<input v-model="selectedSlide.title" class="studio-input" @change="saveDeck"></label>
          <label>Slide text<textarea :value="textFromHtml(selectedSlide.html)" rows="7" class="studio-input" @change="updateSlideBody(selectedSlide, $event)"></textarea></label>
          <label>Speaker notes<textarea v-model="selectedSlide.speakerNotes" rows="4" class="studio-input" @change="saveDeck"></textarea></label>
          <div class="flex flex-wrap gap-2">
            <button type="button" class="app-chip" @click="decks.moveSlide(deck, selectedIndex, -1)">↑ Move</button>
            <button type="button" class="app-chip" @click="decks.moveSlide(deck, selectedIndex, 1)">↓ Move</button>
            <button type="button" class="app-chip" @click="decks.duplicateSlide(deck, selectedIndex)">Duplicate</button>
            <button type="button" class="app-chip" @click="selectedSlide.hidden = !selectedSlide.hidden; saveDeck()">{{ selectedSlide.hidden ? 'Show' : 'Hide' }}</button>
            <button type="button" class="app-chip" @click="decks.removeSlide(deck, selectedIndex); selectedSlideId = deck.slides[0]?.id ?? null">Delete slide</button>
          </div>
          <div class="grid gap-3 sm:grid-cols-2">
            <label>Aspect ratio<select v-model="deck.aspectRatio" class="studio-input" @change="saveDeck"><option v-for="preset in aspectRatioPresets" :key="preset.id" :value="preset.id">{{ preset.label }}</option></select></label>
            <label>Theme<select v-model="deck.theme" class="studio-input" @change="saveDeck"><option v-for="theme in presentationThemePresets" :key="theme.id" :value="theme.id">{{ theme.label }}</option></select></label>
          </div>
        </section>
      </div>
      <div ref="exportStage" class="export-stage" aria-hidden="true">
        <DeckSlideCanvas v-if="exportSlide" :slide="exportSlide" :aspect-ratio="deck.aspectRatio" :theme="deck.theme" />
      </div>
    </section>
  </main>
</template>

<style scoped>
.studio-shell { overflow: hidden; border: 1px solid var(--lc-border); border-radius: .95rem; background: var(--app-panel); }
.studio-toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: .6rem; padding: .8rem; border-bottom: 1px solid var(--lc-border); }
.studio-title { min-width: 10rem; flex: 1; border: 0; background: transparent; color: var(--app-ink); font-size: 1.2rem; font-weight: 600; }
.studio-primary { border-radius: 999px; padding: .55rem 1rem; background: var(--lc-brand); color: #f6f1e7; font-weight: 600; }
.studio-grid { display: grid; grid-template-columns: minmax(12rem, 16rem) 1fr; min-height: 35rem; }
.studio-sidebar { border-right: 1px solid var(--lc-border); padding: .8rem; }
.studio-slide-item { display: flex; cursor: pointer; align-items: center; gap: .5rem; border: 1px solid var(--lc-border); border-radius: .55rem; padding: .6rem; }
.studio-slide-item--active { background: var(--lc-soft); border-color: var(--lc-brand); }
.studio-editor { display: grid; align-content: start; gap: 1rem; padding: 1rem; }
.studio-editor label { display: grid; gap: .35rem; font-size: .85rem; font-weight: 600; }
.studio-input { width: 100%; border: 1px solid var(--lc-border); border-radius: .55rem; padding: .6rem; background: var(--lc-paper); color: var(--app-ink); }
.studio-slide-preview { aspect-ratio: 16/9; display: grid; align-content: center; justify-items: center; overflow: hidden; border-radius: .6rem; padding: 5%; background: var(--lc-dark-bg); color: #f6f1e7; text-align: center; }
.export-stage { position: fixed; left: -10000px; top: 0; width: 1920px; pointer-events: none; }
@media (max-width: 700px) { .studio-grid { grid-template-columns: 1fr; } .studio-sidebar { border-right: 0; border-bottom: 1px solid var(--lc-border); max-height: 14rem; overflow: auto; } }
</style>
