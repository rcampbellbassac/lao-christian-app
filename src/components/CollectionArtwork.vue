<script setup lang="ts">
import { computed } from 'vue'
import bibleLight from '@/assets/img/study-light.webp'
import bibleDark from '@/assets/img/study-dark.webp'
import worshipLight from '@/assets/img/worship-light.webp'
import worshipDark from '@/assets/img/worship-dark.webp'
import studiesLight from '@/assets/img/studies-light.webp'
import studiesDark from '@/assets/img/studies-dark.webp'
import booksLight from '@/assets/img/books-light.webp'
import booksDark from '@/assets/img/books-dark.webp'
import storiesLight from '@/assets/img/sermons-light.webp'
import storiesDark from '@/assets/img/sermons-dark.webp'

const props = defineProps<{ collectionId: number }>()

const artwork = computed(() => {
  if (props.collectionId === 1) return { light: bibleLight, dark: bibleDark }
  if (props.collectionId === 2) return { light: worshipLight, dark: worshipDark }
  if (props.collectionId === 6) return { light: storiesLight, dark: storiesDark }
  if (props.collectionId === 4 || props.collectionId === 5) return { light: booksLight, dark: booksDark }
  return { light: studiesLight, dark: studiesDark }
})
</script>

<template>
  <div class="collection-artwork" aria-hidden="true">
    <div class="collection-artwork__image dark:hidden" :style="{ backgroundImage: `url(${artwork.light})` }"></div>
    <div class="collection-artwork__image hidden dark:block" :style="{ backgroundImage: `url(${artwork.dark})` }"></div>
  </div>
</template>

<style scoped>
.collection-artwork { display: block; width: min(100%, 23rem); flex: 0 1 23rem; }
.collection-artwork__image { width: 100%; aspect-ratio: 16 / 9; border-radius: 1rem; background-position: center; background-size: cover; box-shadow: var(--lc-shadow-soft); }
@media (max-width: 639px) { .collection-artwork { width: 100%; flex-basis: auto; } }
</style>
