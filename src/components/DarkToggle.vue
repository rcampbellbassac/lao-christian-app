<script setup lang="ts">
import { library } from '@fortawesome/fontawesome-svg-core'
import { faMoon, faSun } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

library.add(faMoon, faSun)
</script>

<template>
  <a onclick="(() => document.body.classList.toggle('dark'))()">
          <span class="tracking-wide font-bold text-xs drop-shadow-md text-slate-800 inline dark:hidden"><font-awesome-icon icon="moon" class="pr-1" />Dark</span>
          <span class="tracking-wide font-bold text-xs drop-shadow-md text-amber-600 hidden dark:inline"><font-awesome-icon icon="sun" class="pr-1" />Light</span>
        </a>
</template>
