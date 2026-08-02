<script setup lang="ts">
import BilingualText from '@/components/BilingualText.vue'

withDefaults(defineProps<{ dark?: boolean }>(), { dark: false })
</script>

<template>
  <p class="development-notice" :class="{ 'development-notice--dark': dark }" role="note">
    <span aria-hidden="true">⚒</span>
    <BilingualText text-key="development.featuresNotice" />
  </p>
</template>

<style scoped>
.development-notice { display: flex; align-items: center; gap: .55rem; margin: .75rem 0; border: 1px solid color-mix(in srgb, var(--lc-brand) 35%, transparent); border-radius: .65rem; padding: .65rem .8rem; background: var(--lc-soft); color: var(--app-ink); font-size: .82rem; }
.development-notice--dark { margin: 0; border-color: rgba(125, 211, 252, .3); border-radius: 0; background: rgba(14, 165, 233, .12); color: #e0f2fe; }
</style>
