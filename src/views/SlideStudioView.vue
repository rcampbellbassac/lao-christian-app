<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDeckStore, type Deck, type DeckSlide } from '@/stores/decks'
import { aspectRatioPresets } from '@/utils/aspectRatios'
import { getAspectRatioPreset } from '@/utils/aspectRatios'
import DeckSlideCanvas from '@/components/DeckSlideCanvas.vue'
import PresentationThemePicker from '@/components/PresentationThemePicker.vue'
import BilingualText from '@/components/BilingualText.vue'
import DevelopmentNotice from '@/components/DevelopmentNotice.vue'
import { useStaticText } from '@/composables/useStaticText'
import { FONT_SCALE_MAX, FONT_SCALE_MIN, FONT_SCALE_STEP, useSettingsStore } from '@/stores/settings'
import { laoFontPresets } from '@/utils/laoFonts'

const route = useRoute()
const router = useRouter()
const decks = useDeckStore()
const selectedSlideId = ref<string | null>(null)
const status = ref('')
const isExporting = ref(false)
const exportSlide = ref<DeckSlide | undefined>()
const exportStage = ref<HTMLElement | null>(null)
const copy = useStaticText()
const settings = useSettingsStore()

const deck = computed(() => route.params.deckId ? decks.getDeck(route.params.deckId as string) : undefined)
const selectedIndex = computed(() => deck.value?.slides.findIndex(slide => slide.id === selectedSlideId.value) ?? -1)
const selectedSlide = computed(() => selectedIndex.value >= 0 ? deck.value?.slides[selectedIndex.value] : undefined)

onMounted(async () => {
  await decks.load()
  await settings.load()
  if (deck.value?.slides[0]) selectedSlideId.value = deck.value.slides[0].id
})

watch(() => route.params.deckId, () => {
  selectedSlideId.value = deck.value?.slides[0]?.id ?? null
})

async function newDeck(): Promise<void> {
  const created = await decks.createDeck()
  created.fontScale = settings.presentationFontScale
  created.fontFamily = settings.presentationFontFamily
  created.textAlign = settings.presentationTextAlign
  await decks.addSlide(created)
  await router.push(`/decks/${created.id}`)
}

function changeDeckFont(step: number): void {
  if (!deck.value) return
  deck.value.fontScale = Math.min(FONT_SCALE_MAX, Math.max(FONT_SCALE_MIN, Math.round((deck.value.fontScale + step) * 10) / 10))
  void saveDeck()
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
  status.value = copy.text('studio.saved')
}

async function saveDeck(): Promise<void> {
  if (!deck.value) return
  await decks.saveDeck(deck.value)
  status.value = copy.text('studio.saved')
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
  if (!visibleSlides.length) { status.value = copy.text('studio.noVisible'); return }
  isExporting.value = true
  status.value = copy.text('studio.preparing')
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
    status.value = copy.text('studio.exportComplete')
  } catch (error) {
    console.error('Deck export failed', error)
    status.value = copy.text('studio.exportFailed')
  } finally {
    isExporting.value = false
    exportSlide.value = undefined
  }
}
</script>

<template>
  <main class="app-page">
    <section v-if="!deck" class="app-panel">
      <DevelopmentNotice />
      <div class="flex items-center justify-between gap-3"><div><h1 class="app-section-title">ສະຕູດິໂອສະໄລ້</h1><p class="app-muted"><BilingualText text-key="studio.localHelp" /></p></div><button type="button" class="studio-primary" @click="newDeck">＋ {{ copy.text('studio.newDeck') }}</button></div>
      <ul class="mt-6 grid gap-3 sm:grid-cols-2">
        <li v-for="item in decks.decks" :key="item.id" class="lc-card p-4">
          <router-link :to="`/decks/${item.id}`" class="app-link text-lg">{{ item.name }}</router-link>
          <p class="app-muted mt-1 text-sm">{{ item.slides.length }} {{ copy.text('studio.slides') }} · {{ new Date(item.updatedAt).toLocaleDateString() }}</p>
        </li>
      </ul>
      <p v-if="decks.isLoaded && !decks.decks.length" class="app-muted py-12 text-center"><BilingualText text-key="studio.empty" /></p>
    </section>

    <section v-else class="studio-shell">
      <DevelopmentNotice />
      <header class="studio-toolbar">
        <router-link to="/decks" class="app-chip">← {{ copy.text('studio.back') }}</router-link>
        <input v-model="deck.name" class="studio-title" :aria-label="copy.text('studio.deckName')" @change="saveDeck">
        <span class="app-muted text-xs">{{ status }}</span>
        <router-link :to="`/present/deck/${deck.id}`" class="studio-primary">▶ {{ copy.text('studio.present') }}</router-link>
        <button type="button" class="app-chip" :disabled="isExporting" :title="copy.text('presentation.exportPng')" @click="runExport('png')">PNG</button>
        <button type="button" class="app-chip" :disabled="isExporting" :title="copy.text('presentation.exportZip')" @click="runExport('zip')">ZIP</button>
        <button type="button" class="app-chip" :disabled="isExporting" :title="copy.text('presentation.exportPptx')" @click="runExport('pptx')">PPTX</button>
        <button type="button" class="app-chip" :title="copy.text('studio.deleteDeck')" :aria-label="copy.text('studio.deleteDeck')" @click="deleteDeck(deck)">⌫</button>
      </header>
      <div class="studio-grid">
        <aside class="studio-sidebar">
          <button type="button" class="studio-primary w-full" @click="decks.addSlide(deck)">＋ {{ copy.text('studio.addSlide') }}</button>
          <ol class="studio-slide-list mt-3 grid gap-2">
            <li v-for="(slide, index) in deck.slides" :key="slide.id" class="studio-slide-item" :class="{ 'studio-slide-item--active': slide.id === selectedSlideId }" @click="selectedSlideId = slide.id">
              <span class="studio-slide-number">{{ index + 1 }}</span><span class="studio-slide-name" :title="slide.title">{{ slide.title }}</span><span v-if="slide.hidden">◌</span>
            </li>
          </ol>
        </aside>
        <section v-if="selectedSlide" class="studio-editor">
          <div class="studio-slide-preview"><DeckSlideCanvas :slide="selectedSlide" :aspect-ratio="deck.aspectRatio" :theme="deck.theme" :font-scale="deck.fontScale" :font-family="deck.fontFamily" :text-align="deck.textAlign" /></div>
          <label>{{ copy.text('studio.slideTitle') }}<input v-model="selectedSlide.title" class="studio-input" @change="saveDeck"></label>
          <label>{{ copy.text('studio.slideText') }}<textarea :value="textFromHtml(selectedSlide.html)" rows="7" class="studio-input" @change="updateSlideBody(selectedSlide, $event)"></textarea></label>
          <label>{{ copy.text('studio.speakerNotes') }}<textarea v-model="selectedSlide.speakerNotes" rows="4" class="studio-input" @change="saveDeck"></textarea></label>
          <div class="flex flex-wrap gap-2">
            <button type="button" class="app-chip" :title="copy.text('studio.moveUp')" :aria-label="copy.text('studio.moveUp')" @click="decks.moveSlide(deck, selectedIndex, -1)">↑</button>
            <button type="button" class="app-chip" :title="copy.text('studio.moveDown')" :aria-label="copy.text('studio.moveDown')" @click="decks.moveSlide(deck, selectedIndex, 1)">↓</button>
            <button type="button" class="app-chip" :title="copy.text('studio.duplicate')" :aria-label="copy.text('studio.duplicate')" @click="decks.duplicateSlide(deck, selectedIndex)">⧉</button>
            <button type="button" class="app-chip" :title="selectedSlide.hidden ? copy.text('studio.show') : copy.text('studio.hide')" :aria-label="selectedSlide.hidden ? copy.text('studio.show') : copy.text('studio.hide')" @click="selectedSlide.hidden = !selectedSlide.hidden; saveDeck()">{{ selectedSlide.hidden ? '◉' : '◌' }}</button>
            <button type="button" class="app-chip" :title="copy.text('studio.deleteSlide')" :aria-label="copy.text('studio.deleteSlide')" @click="decks.removeSlide(deck, selectedIndex); selectedSlideId = deck.slides[0]?.id ?? null">×</button>
          </div>
          <label>{{ copy.text('studio.aspectRatio') }}<select v-model="deck.aspectRatio" class="studio-input" @change="saveDeck"><option v-for="preset in aspectRatioPresets" :key="preset.id" :value="preset.id">{{ copy.text(preset.labelKey) }}</option></select></label>
          <label>{{ copy.text('studio.theme') }}<PresentationThemePicker v-model="deck.theme" :aspect-ratio="deck.aspectRatio" @update:model-value="saveDeck" /></label>
          <div class="studio-format-grid">
            <label>{{ copy.text('presentation.font') }}<select v-model="deck.fontFamily" class="studio-input" @change="saveDeck"><option v-for="preset in laoFontPresets" :key="preset.id" :value="preset.id">{{ preset.label }}</option></select></label>
            <div class="studio-control-group">
              <span>{{ copy.text('presentation.fontSize') }}</span>
              <div class="flex items-center gap-2"><button type="button" class="app-chip" :disabled="deck.fontScale <= FONT_SCALE_MIN" @click="changeDeckFont(-FONT_SCALE_STEP)">−</button><strong>{{ Math.round(deck.fontScale * 100) }}%</strong><button type="button" class="app-chip" :disabled="deck.fontScale >= FONT_SCALE_MAX" @click="changeDeckFont(FONT_SCALE_STEP)">＋</button></div>
            </div>
            <label>{{ copy.text('presentation.textAlign') }}<select v-model="deck.textAlign" class="studio-input" @change="saveDeck"><option value="left">{{ copy.text('action.left') }}</option><option value="center">{{ copy.text('action.center') }}</option></select></label>
          </div>
        </section>
      </div>
      <div ref="exportStage" class="export-stage" aria-hidden="true">
        <DeckSlideCanvas v-if="exportSlide" :slide="exportSlide" :aspect-ratio="deck.aspectRatio" :theme="deck.theme" :font-scale="deck.fontScale" :font-family="deck.fontFamily" :text-align="deck.textAlign" />
      </div>
    </section>
  </main>
</template>

<style scoped>
.studio-shell { overflow: hidden; border: 1px solid var(--lc-border); border-radius: .95rem; background: var(--app-panel); }
.studio-toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: .6rem; padding: .8rem; border-bottom: 1px solid var(--lc-border); }
.studio-title { min-width: 10rem; flex: 1; border: 0; background: transparent; color: var(--app-ink); font-size: 1.2rem; font-weight: 600; }
.studio-primary { border-radius: 999px; padding: .55rem 1rem; background: var(--lc-brand); color: #f6f1e7; font-weight: 600; }
.studio-grid { display: grid; grid-template-columns: minmax(12rem, 16rem) minmax(0, 1fr); min-height: 35rem; }
.studio-sidebar { min-width: 0; overflow: hidden; border-right: 1px solid var(--lc-border); padding: .8rem; }
.studio-slide-list { min-width: 0; }
.studio-slide-item { display: flex; min-width: 0; width: 100%; cursor: pointer; align-items: flex-start; gap: .5rem; border: 1px solid var(--lc-border); border-radius: .55rem; padding: .6rem; }
.studio-slide-number { flex: 0 0 auto; }
.studio-slide-name { display: -webkit-box; min-width: 0; flex: 1; overflow: hidden; overflow-wrap: anywhere; line-height: 1.35; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
.studio-slide-item--active { background: var(--lc-soft); border-color: var(--lc-brand); }
.studio-editor { display: grid; align-content: start; gap: 1rem; padding: 1rem; }
.studio-editor label { display: grid; gap: .35rem; font-size: .85rem; font-weight: 600; }
.studio-input { width: 100%; border: 1px solid var(--lc-border); border-radius: .55rem; padding: .6rem; background: var(--lc-paper); color: var(--app-ink); }
.studio-format-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: .8rem; }
.studio-control-group { display: grid; align-content: start; gap: .35rem; font-size: .85rem; font-weight: 600; }
.studio-slide-preview { display: grid; max-height: 32rem; place-items: center; overflow: hidden; border-radius: .6rem; background: var(--lc-dark-bg); }
.studio-slide-preview :deep(.deck-canvas) { max-height: 32rem; }
.export-stage { position: fixed; left: -10000px; top: 0; width: 1920px; pointer-events: none; }
@media (max-width: 700px) { .studio-grid { grid-template-columns: 1fr; } .studio-sidebar { border-right: 0; border-bottom: 1px solid var(--lc-border); max-height: 14rem; overflow: auto; } .studio-format-grid { grid-template-columns: 1fr; } }
</style>
