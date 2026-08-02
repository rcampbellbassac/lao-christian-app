<script setup lang="ts">
import { RouterLink } from 'vue-router'
import DarkToggle from './DarkToggle.vue'
import FontSizeControl from './FontSizeControl.vue'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faBookOpenReader, faCircleInfo, faGear, faHouse, faLanguage, faLayerGroup, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { useUiText, type UiMessageKey } from '@/composables/useUiText'
import { useSettingsStore } from '@/stores/settings'
import PwaStatus from './PwaStatus.vue'

library.add(faBookOpenReader, faCircleInfo, faGear, faHouse, faLanguage, faLayerGroup, faMagnifyingGlass)

const text = useUiText()
const settings = useSettingsStore()
const menuItems: Array<{ name: UiMessageKey; to: string; icon: string }> = [
  { name: 'home', to: '/', icon: 'fa-solid fa-house'},
  { name: 'myStudy', to: '/study', icon: 'fa-solid fa-book-open-reader' },
  { name: 'slideStudio', to: '/decks', icon: 'fa-solid fa-layer-group' },
  { name: 'about', to: '/about', icon: 'fa-solid fa-circle-info' },
  { name: 'settings', to: '/settings', icon: 'fa-solid fa-gear' },
]
</script>

<template>
  <header class="sticky top-0 z-40 border-b border-[var(--lc-border)] bg-[var(--lc-paper)]/95 px-2 py-2 backdrop-blur sm:px-4">
    <nav class="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-2">
      <div class="lc-primary-nav flex items-center gap-1 sm:gap-2">
        <RouterLink
          v-for="item in menuItems"
          :key="item.to"
          :to="item.to"
          :aria-label="text.accessible(item.name)"
          :title="text.accessible(item.name)"
          v-slot="{ isActive }"
        >
          <span
            :class="[
              'lc-nav-link inline-flex min-h-10 min-w-10 items-center justify-center rounded-full px-2 py-2 text-sm font-semibold transition lg:px-3',
              isActive
                ? 'lc-nav-link--active'
                : ''
            ]"
          >
            <font-awesome-icon v-if="item.icon" :icon="item.icon" class="lg:pr-1" />
            <span class="hidden lg:inline">{{ text.lao(item.name) }}</span>
            <span v-if="text.english(item.name)" class="ml-1 hidden text-[0.68rem] font-normal opacity-70 2xl:inline">{{ text.english(item.name) }}</span>
          </span>
        </RouterLink>
      </div>
      <div class="lc-utility-nav ml-auto flex items-center gap-2">
        <PwaStatus />
        <RouterLink to="/search" class="lc-icon-control" :aria-label="text.accessible('search')" :title="text.accessible('search')">
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
</template>

<style scoped>
@media (max-width: 479px) {
  .lc-primary-nav { width: 100%; justify-content: space-between; }
  .lc-utility-nav { width: 100%; justify-content: flex-end; }
}
</style>
