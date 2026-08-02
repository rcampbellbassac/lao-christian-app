<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useDeckStore } from '@/stores/decks'
import DeckSlideCanvas from '@/components/DeckSlideCanvas.vue'
import { deckChannelName, deckStorageKey, type DeckPresentationState } from '@/utils/deckBroadcast'
import { useStaticText } from '@/composables/useStaticText'

const route = useRoute()
const decks = useDeckStore()
const deckId = route.params.deckId as string
const currentIndex = ref(0)
const blank = ref(false)
const audienceOpen = ref(false)
const copy = useStaticText()
let channel: BroadcastChannel | null = null

const deck = computed(() => decks.getDeck(deckId))
const slides = computed(() => deck.value?.slides.filter(slide => !slide.hidden) ?? [])
const currentSlide = computed(() => slides.value[currentIndex.value])
const nextSlide = computed(() => slides.value[currentIndex.value + 1])

function broadcast(): void {
  const state: DeckPresentationState = { type: 'state', deckId, index: currentIndex.value, blank: blank.value, nonce: crypto.randomUUID() }
  channel?.postMessage(state)
  localStorage.setItem(deckStorageKey(deckId), JSON.stringify(state))
}

function previous(): void { currentIndex.value = Math.max(0, currentIndex.value - 1) }
function next(): void { currentIndex.value = Math.min(slides.value.length - 1, currentIndex.value + 1) }

function openAudience(): void {
  const url = new URL(`${import.meta.env.BASE_URL}audience/${deckId}`, window.location.origin)
  const popup = window.open(url, `laochristian-audience-${deckId}`, 'popup')
  audienceOpen.value = Boolean(popup)
  if (!popup) return
  window.setTimeout(broadcast, 400)
}

function onKeydown(event: KeyboardEvent): void {
  if (['ArrowRight', 'PageDown', ' '].includes(event.key)) { event.preventDefault(); next() }
  if (['ArrowLeft', 'PageUp'].includes(event.key)) { event.preventDefault(); previous() }
  if (event.key.toLowerCase() === 'b') blank.value = !blank.value
}

watch([currentIndex, blank], broadcast)

onMounted(async () => {
  await decks.load()
  if ('BroadcastChannel' in window) channel = new BroadcastChannel(deckChannelName(deckId))
  window.addEventListener('keydown', onKeydown)
  broadcast()
})

onBeforeUnmount(() => { channel?.close(); window.removeEventListener('keydown', onKeydown) })
</script>

<template>
  <main class="controller-shell">
    <header class="controller-toolbar">
      <router-link :to="`/decks/${deckId}`" class="controller-btn">← {{ copy.text('presenter.edit') }}</router-link>
      <strong class="min-w-0 flex-1 truncate">{{ deck?.name }}</strong>
      <span>{{ currentIndex + 1 }} / {{ slides.length }}</span>
      <button type="button" class="controller-btn" @click="openAudience">▣ {{ audienceOpen ? copy.text('presenter.reconnectAudience') : copy.text('presenter.openAudience') }}</button>
      <button type="button" class="controller-btn" @click="blank = !blank">{{ blank ? '◉' : '●' }} {{ blank ? copy.text('presenter.showSlide') : copy.text('presenter.blackScreen') }}</button>
    </header>
    <section v-if="deck && currentSlide" class="controller-grid">
      <div class="controller-current"><DeckSlideCanvas :slide="currentSlide" :aspect-ratio="deck.aspectRatio" :theme="deck.theme" :blank="blank" /></div>
      <aside class="controller-notes">
        <h2>{{ copy.text('studio.speakerNotes') }}</h2><p class="whitespace-pre-wrap">{{ currentSlide.speakerNotes || copy.text('presenter.noNotes') }}</p>
        <h2 class="mt-6">{{ copy.text('presenter.next') }}</h2><div v-if="nextSlide" class="next-card"><strong>{{ nextSlide.title }}</strong></div><p v-else class="app-muted">{{ copy.text('presenter.end') }}</p>
      </aside>
    </section>
    <footer class="controller-footer"><button type="button" class="controller-btn" :disabled="currentIndex === 0" @click="previous">← {{ copy.text('presenter.previous') }}</button><button type="button" class="controller-btn" :disabled="currentIndex >= slides.length - 1" @click="next">{{ copy.text('presenter.next') }} →</button></footer>
  </main>
</template>

<style scoped>
.controller-shell { min-height: 100vh; background: #081619; color: #f6f1e7; }
.controller-toolbar, .controller-footer { display: flex; align-items: center; gap: .7rem; padding: .75rem 1rem; background: #172f35; }
.controller-footer { justify-content: center; }
.controller-btn { border: 1px solid rgba(246,241,231,.35); border-radius: 999px; padding: .5rem .9rem; }
.controller-btn:disabled { opacity: .35; }
.controller-grid { display: grid; grid-template-columns: minmax(0, 2fr) minmax(16rem, 1fr); gap: 1rem; padding: 1rem; }
.controller-current { display: flex; align-items: center; min-height: 65vh; }
.controller-notes { border-radius: .7rem; background: #172f35; padding: 1rem; }
.next-card { margin-top: .5rem; border: 1px solid rgba(246,241,231,.2); border-radius: .5rem; padding: .8rem; }
@media (max-width: 800px) { .controller-grid { grid-template-columns: 1fr; } .controller-current { min-height: auto; } }
</style>
