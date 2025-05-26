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
  <header>
    <nav class="bg-white outline outline-black/5 dark:bg-slate-800 dark:shadow-none dark:-outline-offset-1 dark:outline-white/10 px-8 pt-2 shadow-md mb-5 pb-1">
      <div class="-mb-px flex justify-center space-x-12">
        <RouterLink
          v-for="item in menuItems"
          :key="item.to"
          :to="item.to"
          v-slot="{ isActive }"
        >
          <span
            :class="[
              'text-teal-dark tracking-wide font-bold text-xs drop-shadow-md',
              isActive ? 'text-cyan-500 dark:text-amber-400' : 'text-slate-800 dark:text-slate-200'
            ]"
          >
            <font-awesome-icon v-if="item.icon" :icon="item.icon" class="pr-1" />
            {{ item.name }}
          </span>
        </RouterLink>

        <DarkToggle />
      </div>
    </nav>
  </header>
</template>
