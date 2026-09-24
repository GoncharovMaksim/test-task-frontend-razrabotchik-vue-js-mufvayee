<script setup lang="ts">
import { computed } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'

const props = defineProps<{
  page: number
  totalPages: number
  total: number
  perPage: number
}>()

const emit = defineEmits<{
  (e: 'change', newPage: number): void
}>()

const visiblePages = computed(() => {
  const current = props.page
  const total = props.totalPages
  const delta = 2
  const pages: (number | 'ellipsis')[] = []

  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= current - delta && i <= current + delta)) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== 'ellipsis') {
      pages.push('ellipsis')
    }
  }

  return pages
})

const startItem = computed(() => (props.page - 1) * props.perPage + 1)
const endItem = computed(() => Math.min(props.page * props.perPage, props.total))
</script>

<template>
  <div v-if="totalPages > 1 || total > 0" class="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 text-xs text-zinc-400">
    <div>
      Показано <span class="font-medium text-zinc-200">{{ total === 0 ? 0 : startItem }}–{{ endItem }}</span> из <span class="font-medium text-zinc-200">{{ total }}</span>
    </div>

    <div v-if="totalPages > 1" class="flex items-center gap-1.5" role="navigation" aria-label="Пагинация">
      <button
        type="button"
        class="p-1.5 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 disabled:opacity-40 disabled:hover:bg-zinc-900 transition-colors"
        :disabled="page <= 1"
        aria-label="Предыдущая страница"
        @click="emit('change', page - 1)"
      >
        <ChevronLeft class="w-4 h-4" />
      </button>

      <template v-for="(p, idx) in visiblePages" :key="idx">
        <span v-if="p === 'ellipsis'" class="px-2 text-zinc-600">...</span>
        <button
          v-else
          type="button"
          class="min-w-8 h-8 px-2 rounded-lg text-xs font-medium transition-colors"
          :class="
            p === page
              ? 'bg-zinc-100 text-zinc-950 font-semibold'
              : 'border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300'
          "
          :aria-current="p === page ? 'page' : undefined"
          @click="emit('change', p)"
        >
          {{ p }}
        </button>
      </template>

      <button
        type="button"
        class="p-1.5 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 disabled:opacity-40 disabled:hover:bg-zinc-900 transition-colors"
        :disabled="page >= totalPages"
        aria-label="Следующая страница"
        @click="emit('change', page + 1)"
      >
        <ChevronRight class="w-4 h-4" />
      </button>
    </div>
  </div>
</template>
