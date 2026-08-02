<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useDeckStore } from '@/stores/decks'
import DeckSlideCanvas from '@/components/DeckSlideCanvas.vue'
import { deckChannelName, deckStorageKey, isDeckPresentationState } from '@/utils/deckBroadcast'

const route = useRoute()
const decks = useDeckStore()
const deckId = route.params.deckId as string
const index = ref(0)
const blank = ref(false)
let channel: BroadcastChannel | null = null

const deck = computed(() => decks.getDeck(deckId))
const slides = computed(() => deck.value?.slides.filter(slide => !slide.hidden) ?? [])
const slide = computed(() => slides.value[index.value])

function apply(value: unknown): void {
  if (!isDeckPresentationState(value, deckId)) return
  index.value = Math.max(0, Math.min(value.index, slides.value.length - 1))
  blank.value = value.blank
}

function onStorage(event: StorageEvent): void {
  if (event.key !== deckStorageKey(deckId) || !event.newValue) return
  try { apply(JSON.parse(event.newValue)) } catch { /* ignore malformed cross-tab state */ }
}

async function fullscreen(): Promise<void> { await document.documentElement.requestFullscreen() }

onMounted(async () => {
  await decks.load()
  if ('BroadcastChannel' in window) {
    channel = new BroadcastChannel(deckChannelName(deckId))
    channel.addEventListener('message', event => apply(event.data))
  }
  window.addEventListener('storage', onStorage)
  const stored = localStorage.getItem(deckStorageKey(deckId))
  if (stored) try { apply(JSON.parse(stored)) } catch { /* ignore stale malformed state */ }
})

onBeforeUnmount(() => { channel?.close(); window.removeEventListener('storage', onStorage) })
</script>

<template>
  <main class="audience-shell" @dblclick="fullscreen">
    <DeckSlideCanvas v-if="deck && slide" :slide="slide" :aspect-ratio="deck.aspectRatio" :theme="deck.theme" :blank="blank" />
    <p v-else>Waiting for presentation…</p>
    <button type="button" class="fullscreen-button" title="Fullscreen" aria-label="Fullscreen" @click="fullscreen">⛶</button>
  </main>
</template>

<style scoped>
.audience-shell { position: fixed; inset: 0; z-index: 100; display: flex; align-items: center; justify-content: center; background: #000; overflow: hidden; }
.audience-shell :deep(.deck-canvas) { max-width: 100vw; max-height: 100vh; border-radius: 0; box-shadow: none; }
.fullscreen-button { position: fixed; right: .75rem; bottom: .75rem; width: 2.5rem; height: 2.5rem; border-radius: 999px; background: rgba(0,0,0,.5); color: white; opacity: .25; }
.fullscreen-button:hover { opacity: 1; }
</style>
