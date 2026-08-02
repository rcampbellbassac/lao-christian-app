<script setup lang="ts">
import { useStaticText, type StaticTextKey } from '@/composables/useStaticText'

defineProps<{ textKey: StaticTextKey }>()
const copy = useStaticText()
</script>

<template>
  <span class="bilingual-copy">
    <span lang="lo">{{ copy.lao(textKey) }}</span>
    <span v-if="copy.english(textKey)" class="bilingual-copy-english" lang="en">{{ copy.english(textKey) }}</span>
  </span>
</template>

<style scoped>
.bilingual-copy { display: contents; }
.bilingual-copy-english { display: block; margin-top: .2em; color: var(--app-muted); font-size: .8em; font-weight: 400; line-height: 1.45; }
</style>
