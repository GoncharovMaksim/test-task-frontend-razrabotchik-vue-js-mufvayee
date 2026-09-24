<script setup lang="ts">
import AppHeader from '@/components/AppHeader.vue'
import NotificationToast from '@/components/NotificationToast.vue'
</script>

<template>
  <div class="min-h-screen flex flex-col bg-[#090a0f] text-zinc-100">
    <AppHeader />

    <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <RouterView v-slot="{ Component }">
        <Transition name="fade" mode="out-in">
          <component :is="Component" />
        </Transition>
      </RouterView>
    </main>

    <footer class="border-t border-zinc-900 bg-zinc-950/60 py-6 text-xs text-zinc-500">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div class="flex items-center gap-2">
          <span>Тестовое задание Frontend-разработчик Vue.js — «ИнфоТек»</span>
        </div>
        <div class="flex items-center gap-4 text-zinc-500 font-mono text-[11px]">
          <span>REST API: Yii2 v1.0.0</span>
          <span>•</span>
          <span>SMS Pilot Gateway</span>
        </div>
      </div>
    </footer>

    <NotificationToast />
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
