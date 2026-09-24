<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { AlertTriangle, X } from 'lucide-vue-next'

const props = defineProps<{
  open: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  danger?: boolean
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'confirm'): void
  (e: 'close'): void
}>()

function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Escape' && props.open) {
    emit('close')
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="'confirm-title'"
    >
      <div
        class="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden p-6 animate-in fade-in zoom-in-95 duration-150"
      >
        <button
          type="button"
          class="absolute top-4 right-4 text-zinc-400 hover:text-zinc-200 transition-colors"
          aria-label="Закрыть"
          @click="emit('close')"
        >
          <X class="w-4 h-4" />
        </button>

        <div class="flex items-start gap-4">
          <div
            v-if="danger"
            class="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center shrink-0"
          >
            <AlertTriangle class="w-5 h-5" />
          </div>
          <div>
            <h3 id="confirm-title" class="text-base font-semibold text-zinc-100">
              {{ title }}
            </h3>
            <p class="mt-2 text-sm text-zinc-400 leading-relaxed">
              {{ message }}
            </p>
          </div>
        </div>

        <div class="mt-6 flex justify-end gap-3">
          <button
            type="button"
            class="px-4 py-2 text-sm font-medium text-zinc-300 bg-zinc-800 hover:bg-zinc-700/80 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500"
            :disabled="loading"
            @click="emit('close')"
          >
            {{ cancelText || 'Отмена' }}
          </button>
          <button
            type="button"
            class="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:opacity-50"
            :class="
              danger
                ? 'bg-red-600 hover:bg-red-500 focus-visible:ring-red-500'
                : 'bg-emerald-600 hover:bg-emerald-500 focus-visible:ring-emerald-500'
            "
            :disabled="loading"
            @click="emit('confirm')"
          >
            {{ loading ? 'Выполнение...' : confirmText || 'Подтвердить' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
