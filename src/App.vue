<script setup lang="ts">
import { RouterView } from 'vue-router'
import MainToolbar from './components/MainToolbar.vue'
import MainFooter from './components/MainFooter.vue'
</script>

<template>
  <div class="flex flex-col h-screen justify-between overflow-hidden bg-fixedv bg-no-repeat bg-cover bg-[url(../assets/img/fog-8519076_1280-web.jpg)] dark:bg-[url(../assets/img/autumn-8620917-web.jpg)]">
    <MainToolbar />
    <RouterView class="transition-all transition-discrete duration-500 ease-in-out delay-50 mb-auto h-8/10 overflow-auto" />
    <MainFooter />
  </div>
</template>
