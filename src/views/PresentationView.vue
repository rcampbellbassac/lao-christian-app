<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toPng } from 'html-to-image'
import { useContentStore } from '@/stores/content'
import { createSlideGenerator, type Slide } from '@/utils/slideGenerators'

const route = useRoute()
const router = useRouter()
const store = useContentStore()

const fileId = parseInt(route.params.fileid as string, 10)
const bookId = parseInt(route.params.bookid as string, 10)
const chapterId = parseInt(route.params.chapterid as string, 10)

const currentSlideIndex = ref(0)
const isFullscreen = ref(false)
const slideCanvas = ref<HTMLElement | null>(null)

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
    return
  }

  document.addEventListener('keydown', handleKeydown)
  document.addEventListener('fullscreenchange', onFullscreenChange)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.removeEventListener('fullscreenchange', onFullscreenChange)
})

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

  try {
    return slideGenerator.value.generate({
      title: chapter.value.name,
      html: chapter.value.content || '',
    })
  } catch (err) {
    console.error('Failed to generate presentation slides', err)
    return []
  }
})

const currentSlide = computed(() => slides.value[currentSlideIndex.value] || null)

const progressLabel = computed(() => {
  if (slides.value.length === 0) return '0 / 0'
  return `${currentSlideIndex.value + 1} / ${slides.value.length}`
})

function goNext(): void {
  if (currentSlideIndex.value < slides.value.length - 1) {
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

async function exportAllSlides(): Promise<void> {
  if (!slides.value.length) return

  const originalIndex = currentSlideIndex.value
  for (let i = 0; i < slides.value.length; i += 1) {
    currentSlideIndex.value = i
    await nextTick()
    await exportCurrentSlide()
  }
  currentSlideIndex.value = originalIndex
}

function sanitizeFilename(value: string): string {
  return value
    .replace(/<[^>]*>/g, '')
    .replace(/[^a-zA-Z0-9\u0E80-\u0EFF\s_-]/g, '')
    .trim()
    .replace(/\s+/g, '-') || 'slide'
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
      >
        Exit
      </router-link>
      <span class="presentation-progress">{{ progressLabel }}</span>
      <button class="presentation-btn" type="button" @click="goPrev">Prev</button>
      <button class="presentation-btn" type="button" @click="goNext">Next</button>
      <button class="presentation-btn" type="button" @click="toggleFullscreen">
        {{ isFullscreen ? 'Windowed' : 'Fullscreen' }}
      </button>
      <button class="presentation-btn" type="button" @click="exportCurrentSlide">Export PNG</button>
      <button class="presentation-btn" type="button" @click="exportAllSlides">Export All</button>
    </header>

    <section ref="slideCanvas" class="slide-canvas">
      <article v-if="currentSlide" class="slide-content">
        <h1 class="slide-title" v-html="currentSlide.title"></h1>
        <div class="slide-body" v-html="currentSlide.html"></div>
      </article>
      <article v-else class="slide-empty">Loading chapter...</article>
    </section>
  </main>
</template>

<style scoped>
.presentation-shell {
  min-height: 100vh;
  background: #0f172a;
  color: #f8fafc;
  display: grid;
  grid-template-rows: auto 1fr;
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

.slide-canvas {
  display: grid;
  place-items: center;
  padding: 2rem;
}

.slide-content {
  width: min(1200px, 96vw);
  min-height: min(700px, 78vh);
  background: radial-gradient(circle at top right, rgba(56, 189, 248, 0.18), rgba(15, 23, 42, 0.95));
  border: 2px solid rgba(148, 163, 184, 0.3);
  border-radius: 1rem;
  padding: 2.5rem;
  box-shadow: 0 30px 70px rgba(2, 6, 23, 0.55);
}

.slide-title {
  margin: 0;
  font-size: clamp(1.6rem, 3vw, 3rem);
  line-height: 1.1;
}

.slide-body {
  margin-top: 1.5rem;
  font-size: clamp(1.1rem, 2vw, 2rem);
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
    min-height: 70vh;
    padding: 1.25rem;
  }
}
</style>
