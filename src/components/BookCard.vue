<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { BookOpen, Edit2, Trash2 } from 'lucide-vue-next'
import type { Book } from '@/types'
import { useAuthStore } from '@/stores/auth'

const props = defineProps<{
  book: Book
}>()

const emit = defineEmits<{
  (e: 'delete', book: Book): void
}>()

const router = useRouter()
const authStore = useAuthStore()

const imageError = ref(false)

function onImageError() {
  imageError.value = true
}

function navigateToDetail() {
  router.push(`/books/${props.book.id}`)
}
</script>

<template>
  <div
    class="group relative flex flex-col bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 rounded-xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5 shadow-sm"
  >
    <!-- Cover image container -->
    <div
      class="relative aspect-[3/4] w-full bg-zinc-950 overflow-hidden cursor-pointer"
      @click="navigateToDetail"
    >
      <img
        v-if="book.cover_url && !imageError"
        :src="book.cover_url"
        :alt="book.title"
        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        loading="lazy"
        @error="onImageError"
      />
      <div
        v-else
        class="w-full h-full flex flex-col items-center justify-center p-6 text-zinc-600 bg-gradient-to-b from-zinc-900 to-zinc-950"
      >
        <BookOpen class="w-12 h-12 stroke-[1.2] mb-2 text-zinc-500" />
        <span class="text-xs text-center text-zinc-500 line-clamp-2 px-2 font-medium">
          {{ book.title }}
        </span>
      </div>

      <!-- Year badge -->
      <span
        class="absolute top-2.5 right-2.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-zinc-900/90 text-zinc-300 border border-zinc-700/60 backdrop-blur-sm"
      >
        {{ book.year }}
      </span>
    </div>

    <!-- Content -->
    <div class="flex-1 flex flex-col p-4">
      <div class="flex-1">
        <h3
          class="font-semibold text-sm text-zinc-100 hover:text-white cursor-pointer line-clamp-2 leading-snug"
          :title="book.title"
          @click="navigateToDetail"
        >
          {{ book.title }}
        </h3>

        <!-- Authors -->
        <div class="mt-2 flex flex-wrap gap-1.5 items-center">
          <span class="text-[11px] text-zinc-500">Авторы:</span>
          <template v-if="book.authors && book.authors.length > 0">
            <RouterLink
              v-for="author in book.authors"
              :key="author.id"
              :to="`/authors/${author.id}`"
              class="text-xs text-zinc-400 hover:text-zinc-200 underline underline-offset-2 decoration-zinc-700 transition-colors"
              @click.stop
            >
              {{ author.full_name }}
            </RouterLink>
          </template>
          <span v-else class="text-xs text-zinc-600 italic">Не указаны</span>
        </div>

        <!-- ISBN & Description preview -->
        <p
          v-if="book.description"
          class="mt-2.5 text-xs text-zinc-400 line-clamp-2 leading-relaxed"
        >
          {{ book.description }}
        </p>
      </div>

      <div class="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-2 text-xs">
        <span v-if="book.isbn" class="font-mono text-[11px] text-zinc-500 truncate" :title="`ISBN: ${book.isbn}`">
          {{ book.isbn }}
        </span>
        <span v-else class="text-[11px] text-zinc-600">Без ISBN</span>

        <!-- Actions for user role -->
        <div v-if="authStore.isAuthenticated" class="flex items-center gap-1 shrink-0">
          <RouterLink
            :to="`/books/${book.id}/edit`"
            class="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
            title="Редактировать"
            @click.stop
          >
            <Edit2 class="w-3.5 h-3.5" />
          </RouterLink>
          <button
            type="button"
            class="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            title="Удалить"
            @click.stop="emit('delete', book)"
          >
            <Trash2 class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
