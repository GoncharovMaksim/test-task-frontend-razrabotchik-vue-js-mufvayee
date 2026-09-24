<script setup lang="ts">
import { useNotificationStore } from '@/stores/notifications'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-vue-next'

const notificationStore = useNotificationStore()
</script>

<template>
  <div
    class="fixed bottom-4 right-4 z-50 flex flex-col space-y-2 pointer-events-none max-w-sm w-full"
    aria-live="polite"
  >
    <TransitionGroup
      enter-active-class="transform ease-out duration-200 transition"
      enter-from-class="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
      enter-to-class="translate-y-0 opacity-100 sm:translate-x-0"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-for="toast in notificationStore.toasts"
        :key="toast.id"
        class="pointer-events-auto flex items-start gap-3 p-3.5 rounded-lg border shadow-lg backdrop-blur-md text-sm"
        :class="{
          'bg-zinc-900/95 border-emerald-500/30 text-emerald-300': toast.type === 'success',
          'bg-zinc-900/95 border-red-500/30 text-red-300': toast.type === 'error',
          'bg-zinc-900/95 border-zinc-700/50 text-zinc-200': toast.type === 'info',
        }"
      >
        <CheckCircle2 v-if="toast.type === 'success'" class="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
        <AlertCircle v-else-if="toast.type === 'error'" class="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
        <Info v-else class="w-4 h-4 text-zinc-400 mt-0.5 shrink-0" />

        <div class="flex-1 font-normal break-words leading-snug">
          {{ toast.message }}
        </div>

        <button
          type="button"
          class="shrink-0 text-zinc-400 hover:text-zinc-200 p-0.5 rounded transition-colors"
          aria-label="Закрыть"
          @click="notificationStore.dismiss(toast.id)"
        >
          <X class="w-3.5 h-3.5" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>
