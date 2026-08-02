<script setup lang="ts">
import { computed } from 'vue'
import { extractSafeEmbedLink, safeExternalUrl } from '@/utils/sanitize'

const props = defineProps<{
  audioUrl?: string
  videoUrl?: string
  audioEmbed?: string
  videoEmbed?: string
}>()

const audio = computed(() => safeExternalUrl(props.audioUrl) ?? extractSafeEmbedLink(props.audioEmbed))
const video = computed(() => safeExternalUrl(props.videoUrl) ?? extractSafeEmbedLink(props.videoEmbed))
</script>

<template>
  <div v-if="audio || video" class="mt-5 flex flex-wrap gap-2 rounded-xl border border-[var(--lc-border)] bg-[var(--lc-soft)] p-3">
    <a v-if="audio" :href="audio" target="_blank" rel="noopener noreferrer" class="app-chip">♫ Open audio</a>
    <a v-if="video" :href="video" target="_blank" rel="noopener noreferrer" class="app-chip">▶ Open video</a>
  </div>
</template>
