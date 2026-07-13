<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faMoon, faSun } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

library.add(faMoon, faSun)

const prefersDark = typeof window !== 'undefined' && typeof window.matchMedia === 'function'
  ? window.matchMedia('(prefers-color-scheme: dark)')
  : { matches: false }
const isDark = ref(false)

onMounted(() => {
  const saved = window.localStorage.getItem('theme')
  if (saved === 'dark') {
    isDark.value = true
  } else if (saved === 'light') {
    isDark.value = false
  } else {
    isDark.value = prefersDark.matches
  }
  applyTheme()
})

const label = computed(() => (isDark.value ? 'Light mode' : 'Dark mode'))

function toggleTheme(): void {
  isDark.value = !isDark.value
  window.localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
  applyTheme()
}

function applyTheme(): void {
  document.body.classList.toggle('dark', isDark.value)
}
</script>

<template>
  <button
    type="button"
    :aria-label="label"
    class="inline-flex items-center gap-1 rounded-full border border-slate-300/70 bg-white/85 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 dark:border-slate-500 dark:bg-slate-800/85 dark:text-amber-300 dark:hover:bg-slate-700"
    @click="toggleTheme"
  >
    <font-awesome-icon :icon="isDark ? 'sun' : 'moon'" class="text-xs" />
    <span>{{ isDark ? 'Light' : 'Dark' }}</span>
  </button>
</template>
