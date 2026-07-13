<script setup lang="ts">
import { RouterView } from 'vue-router'
import MainToolbar from './components/MainToolbar.vue'
import MainFooter from './components/MainFooter.vue'
</script>

<template>
  <div class="relative min-h-screen overflow-x-hidden">
    <div class="pointer-events-none fixed inset-0 -z-10 bg-no-repeat bg-cover bg-center opacity-75 dark:opacity-35 bg-[url(../assets/img/fog-8519076_1280-web.jpg)] dark:bg-[url(../assets/img/autumn-8620917-web.jpg)]"></div>
    <div class="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-b from-white/72 via-white/58 to-white/82 dark:from-slate-950/97 dark:via-slate-950/94 dark:to-slate-950/97"></div>
    <MainToolbar />
    <RouterView class="pb-5 transition-all duration-300 ease-out" />
    <MainFooter />
  </div>
</template>
