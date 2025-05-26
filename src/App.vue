<script setup lang="ts">
import { RouterView } from 'vue-router'
import MainToolbar from './components/MainToolbar.vue'
import MainFooter from './components/MainFooter.vue'
</script>

<template>
  <div class="flex flex-col h-screen justify-between overflow-hidden">
    <MainToolbar />
    <RouterView class="transition-all transition-discrete duration-500 ease-in-out delay-50 mb-auto h-9/12 overflow-auto" />
    <MainFooter />
  </div>
</template>
