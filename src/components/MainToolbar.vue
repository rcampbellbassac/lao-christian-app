<script setup lang="ts">
import { RouterLink } from 'vue-router'
import DarkToggle from './DarkToggle.vue'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faHouse, faCircleInfo } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

library.add(faHouse, faCircleInfo)

const menuItems = [
  { name: 'Home', to: '/', icon: 'fa-solid fa-house'},
  { name: 'About', to: '/about', icon: 'fa-solid fa-circle-info' },
]
</script>

<template>
  <header class="sticky top-0 z-40 px-2 pb-1 pt-2 sm:px-4 sm:pb-1 lg:pb-1">
    <nav class="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 rounded-2xl border border-slate-200/70 bg-white/85 px-3 py-2 shadow-lg backdrop-blur dark:border-slate-500/45 dark:bg-slate-950/92">
      <div class="flex flex-wrap items-center gap-2 sm:gap-3">
        <RouterLink
          v-for="item in menuItems"
          :key="item.to"
          :to="item.to"
          v-slot="{ isActive }"
        >
          <span
            :class="[
              'inline-flex items-center rounded-full px-3 py-1.5 text-xs font-bold tracking-wide transition',
              isActive
                ? 'bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-100'
                : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800/70'
            ]"
          >
            <font-awesome-icon v-if="item.icon" :icon="item.icon" class="pr-1" />
            {{ item.name }}
          </span>
        </RouterLink>
      </div>
      <DarkToggle />
    </nav>
  </header>
</template>
