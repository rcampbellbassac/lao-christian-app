<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { library } from '@fortawesome/fontawesome-svg-core'
import {
  faBookOpenReader,
  faCircleInfo,
  faEllipsis,
  faGear,
  faHouse,
  faLanguage,
  faLayerGroup,
  faMagnifyingGlass,
  faXmark,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { useUiText, type UiMessageKey } from '@/composables/useUiText'
import { useSettingsStore } from '@/stores/settings'
import DarkToggle from './DarkToggle.vue'
import FontSizeControl from './FontSizeControl.vue'
import PwaStatus from './PwaStatus.vue'

library.add(
  faBookOpenReader,
  faCircleInfo,
  faEllipsis,
  faGear,
  faHouse,
  faLanguage,
  faLayerGroup,
  faMagnifyingGlass,
  faXmark,
)

const route = useRoute()
const text = useUiText()
const settings = useSettingsStore()
const moreOpen = ref(false)
const items: Array<{ name: UiMessageKey; shortName: UiMessageKey; to: string; icon: string }> = [
  { name: 'home', shortName: 'home', to: '/', icon: 'house' },
  { name: 'myStudy', shortName: 'studyShort', to: '/study', icon: 'book-open-reader' },
  { name: 'slideStudio', shortName: 'slidesShort', to: '/decks', icon: 'layer-group' },
  { name: 'search', shortName: 'search', to: '/search', icon: 'magnifying-glass' },
]

function isActive(to: string): boolean {
  if (to === '/') return route.path === '/' || route.path.startsWith('/content/')
  return route.path === to || route.path.startsWith(`${to}/`)
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') moreOpen.value = false
}

watch(
  () => route.fullPath,
  () => {
    moreOpen.value = false
  },
)
onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <header class="mobile-topbar">
    <RouterLink to="/" class="mobile-brand">LaoChristian.org</RouterLink>
    <PwaStatus />
  </header>

  <nav class="mobile-bottom-nav" :aria-label="text.accessible('menu')">
    <RouterLink
      v-for="item in items"
      :key="item.to"
      :to="item.to"
      class="mobile-nav-item"
      :class="{ 'mobile-nav-item--active': isActive(item.to) }"
      :aria-label="text.accessible(item.name)"
      :aria-current="isActive(item.to) ? 'page' : undefined"
    >
      <font-awesome-icon :icon="item.icon" />
      <span>{{ text.lao(item.shortName) }}</span>
    </RouterLink>
    <button
      type="button"
      class="mobile-nav-item"
      :class="{ 'mobile-nav-item--active': moreOpen }"
      :aria-expanded="moreOpen"
      :aria-label="text.accessible('more')"
      @click="moreOpen = true"
    >
      <font-awesome-icon icon="ellipsis" />
      <span>{{ text.lao('more') }}</span>
    </button>
  </nav>

  <Teleport to="body">
    <div v-if="moreOpen" class="mobile-sheet-backdrop" @click.self="moreOpen = false">
      <section
        class="mobile-sheet"
        role="dialog"
        aria-modal="true"
        :aria-label="text.accessible('more')"
      >
        <header class="mobile-sheet-header">
          <strong
            >{{ text.lao('more')
            }}<span v-if="text.english('more')" class="mobile-sheet-english">{{
              text.english('more')
            }}</span></strong
          >
          <button
            type="button"
            class="lc-icon-control"
            :aria-label="text.accessible('more')"
            @click="moreOpen = false"
          >
            <font-awesome-icon icon="xmark" />
          </button>
        </header>
        <div class="mobile-sheet-links">
          <RouterLink to="/about" class="mobile-sheet-link"
            ><font-awesome-icon icon="circle-info" /><span>{{ text.lao('about') }}</span
            ><small v-if="text.english('about')">{{ text.english('about') }}</small></RouterLink
          >
          <RouterLink to="/settings" class="mobile-sheet-link"
            ><font-awesome-icon icon="gear" /><span>{{ text.lao('settings') }}</span
            ><small v-if="text.english('settings')">{{
              text.english('settings')
            }}</small></RouterLink
          >
          <button
            type="button"
            class="mobile-sheet-link"
            @click="settings.setBilingualUi(!settings.bilingualUi)"
          >
            <font-awesome-icon icon="language" /><span>{{
              settings.bilingualUi ? text.lao('laoOnly') : text.lao('bilingual')
            }}</span
            ><small>{{ settings.bilingualUi ? 'Lao only' : 'Lao + English' }}</small>
          </button>
        </div>
        <div class="mobile-sheet-controls"><FontSizeControl /><DarkToggle /></div>
      </section>
    </div>
  </Teleport>
</template>

<style scoped>
.mobile-topbar {
  position: sticky;
  top: 0;
  z-index: 40;
  display: flex;
  min-height: 3.5rem;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  border-bottom: 1px solid var(--lc-border);
  background: color-mix(in srgb, var(--lc-paper), transparent 5%);
  padding: 0.5rem 0.75rem;
  backdrop-filter: blur(12px);
}
.mobile-brand {
  color: var(--app-ink);
  font-family: 'Noto Serif Lao Variable', serif;
  font-size: 1.05rem;
  font-weight: 700;
}
.mobile-bottom-nav {
  position: fixed;
  inset: auto 0 0;
  z-index: 50;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  min-height: calc(4.2rem + env(safe-area-inset-bottom));
  border-top: 1px solid var(--lc-border);
  background: color-mix(in srgb, var(--lc-paper), transparent 3%);
  padding: 0.3rem 0.25rem env(safe-area-inset-bottom);
  box-shadow: 0 -8px 28px rgb(0 0 0 / 0.12);
  backdrop-filter: blur(14px);
}
.mobile-nav-item {
  display: flex;
  min-width: 0;
  min-height: 3.5rem;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.2rem;
  border-radius: 0.7rem;
  color: var(--app-muted);
  font-size: 0.66rem;
  font-weight: 700;
  line-height: 1.1;
}
.mobile-nav-item svg {
  font-size: 1.1rem;
}
.mobile-nav-item--active {
  background: var(--lc-soft);
  color: var(--lc-brand);
}
.dark .mobile-nav-item--active {
  color: var(--lc-gold);
}
.mobile-sheet-backdrop {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: flex;
  align-items: flex-end;
  background: rgb(2 6 23 / 0.55);
}
.mobile-sheet {
  width: 100%;
  max-height: 82dvh;
  overflow: auto;
  border: 1px solid var(--lc-border);
  border-radius: 1.2rem 1.2rem 0 0;
  background: var(--lc-paper);
  color: var(--app-ink);
  padding: 1rem 1rem calc(1rem + env(safe-area-inset-bottom));
  box-shadow: 0 -24px 60px rgb(0 0 0 / 0.3);
}
.mobile-sheet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  font-size: 1.2rem;
}
.mobile-sheet-english {
  display: block;
  color: var(--app-muted);
  font-size: 0.75rem;
  font-weight: 500;
}
.mobile-sheet-links {
  display: grid;
  gap: 0.6rem;
  margin-top: 1rem;
}
.mobile-sheet-link {
  display: grid;
  min-height: 3.5rem;
  grid-template-columns: 1.5rem 1fr;
  align-items: center;
  column-gap: 0.7rem;
  border: 1px solid var(--lc-border);
  border-radius: 0.8rem;
  background: var(--app-panel);
  padding: 0.65rem 0.8rem;
  text-align: left;
}
.mobile-sheet-link small {
  grid-column: 2;
  color: var(--app-muted);
}
.mobile-sheet-controls {
  display: flex;
  min-height: 3.5rem;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-top: 1rem;
  border-top: 1px solid var(--lc-border);
  padding-top: 1rem;
}
@media (min-width: 1024px) {
  .mobile-topbar,
  .mobile-bottom-nav {
    display: none;
  }
}
</style>
