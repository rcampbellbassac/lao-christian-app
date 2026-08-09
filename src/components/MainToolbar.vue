<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'
import DarkToggle from './DarkToggle.vue'
import FontSizeControl from './FontSizeControl.vue'
import MobileNavigation from './MobileNavigation.vue'
import PwaStatus from './PwaStatus.vue'
import { library } from '@fortawesome/fontawesome-svg-core'
import {
  faBookOpenReader,
  faCircleInfo,
  faGear,
  faHouse,
  faLanguage,
  faLayerGroup,
  faMagnifyingGlass,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { useUiText, type UiMessageKey } from '@/composables/useUiText'
import { useSettingsStore } from '@/stores/settings'

library.add(
  faBookOpenReader,
  faCircleInfo,
  faGear,
  faHouse,
  faLanguage,
  faLayerGroup,
  faMagnifyingGlass,
)

const text = useUiText()
const settings = useSettingsStore()
const route = useRoute()
const menuItems: Array<{ name: UiMessageKey; to: string; icon: string }> = [
  { name: 'home', to: '/', icon: 'fa-solid fa-house' },
  { name: 'myStudy', to: '/study', icon: 'fa-solid fa-book-open-reader' },
  { name: 'slideStudio', to: '/decks', icon: 'fa-solid fa-layer-group' },
  { name: 'about', to: '/about', icon: 'fa-solid fa-circle-info' },
  { name: 'settings', to: '/settings', icon: 'fa-solid fa-gear' },
]

function isActive(to: string): boolean {
  if (to === '/') return route.path === '/' || route.path.startsWith('/content/')
  return route.path === to || route.path.startsWith(`${to}/`)
}
</script>

<template>
  <header
    class="desktop-toolbar sticky top-0 z-40 border-b border-[var(--lc-border)] bg-[var(--lc-paper)]/95 px-4 py-2 backdrop-blur"
  >
    <nav
      class="mx-auto flex w-full max-w-6xl items-center justify-between gap-3"
      :aria-label="text.accessible('menu')"
    >
      <div class="flex min-w-0 items-center gap-1">
        <RouterLink
          v-for="item in menuItems"
          :key="item.to"
          :to="item.to"
          class="lc-nav-link inline-flex min-h-11 items-center justify-center gap-1 rounded-full px-2.5 py-2 text-sm font-semibold transition lg:px-3"
          :class="{ 'lc-nav-link--active': isActive(item.to) }"
          :aria-current="isActive(item.to) ? 'page' : undefined"
        >
          <font-awesome-icon :icon="item.icon" />
          <span>{{ text.lao(item.name) }}</span>
          <span
            v-if="text.english(item.name)"
            class="hidden text-[0.68rem] font-normal opacity-70 xl:inline"
            >{{ text.english(item.name) }}</span
          >
        </RouterLink>
      </div>
      <div class="flex shrink-0 items-center gap-2">
        <PwaStatus />
        <RouterLink
          to="/search"
          class="lc-icon-control"
          :aria-label="text.accessible('search')"
          :title="text.accessible('search')"
        >
          <font-awesome-icon icon="magnifying-glass" />
        </RouterLink>
        <button
          type="button"
          class="lc-icon-control"
          :class="{ 'lc-icon-control--active': settings.bilingualUi }"
          :aria-label="text.accessible('bilingual')"
          :title="settings.bilingualUi ? text.accessible('laoOnly') : text.accessible('bilingual')"
          @click="settings.setBilingualUi(!settings.bilingualUi)"
        >
          <font-awesome-icon icon="language" />
        </button>
        <FontSizeControl />
        <DarkToggle />
      </div>
    </nav>
  </header>
  <MobileNavigation />
</template>

<style scoped>
@media (max-width: 1023px) {
  .desktop-toolbar {
    display: none;
  }
}
</style>
