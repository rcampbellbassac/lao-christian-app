<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faMoon, faSun } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { useUiText } from '@/composables/useUiText'

library.add(faMoon, faSun)

const prefersDark = typeof window !== 'undefined' && typeof window.matchMedia === 'function'
  ? window.matchMedia('(prefers-color-scheme: dark)')
  : { matches: false }
const isDark = ref(false)
const text = useUiText()

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

const label = computed(() => isDark.value ? text.accessible('lightMode') : text.accessible('darkMode'))

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
    :title="label"
    class="lc-icon-control"
    @click="toggleTheme"
  >
    <font-awesome-icon :icon="isDark ? 'sun' : 'moon'" />
  </button>
</template>
