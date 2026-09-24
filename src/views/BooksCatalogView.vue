<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Search, Plus, RotateCcw, Filter, BookOpen } from 'lucide-vue-next'
import { useBooksStore } from '@/stores/books'
import { useAuthorsStore } from '@/stores/authors'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notifications'
import BookCard from '@/components/BookCard.vue'
import PaginationControl from '@/components/PaginationControl.vue'
import ConfirmModal from '@/components/ConfirmModal.vue'
import type { Book } from '@/types'

const booksStore = useBooksStore()
const authorsStore = useAuthorsStore()
const authStore = useAuthStore()
const notificationStore = useNotificationStore()

// Local search and filter models
const localSearch = ref(booksStore.search)
const localAuthorId = ref<number | ''>(booksStore.authorId ?? '')
const localYear = ref<number | ''>(booksStore.year ?? '')

// Delete modal state
const bookToDelete = ref<Book | null>(null)
const deleteLoading = ref(false)

onMounted(async () => {
  await Promise.all([
    booksStore.fetchBooks(),
    authorsStore.fetchAllAuthors(),
  ])
})

function applyFilters() {
  booksStore.search = localSearch.value
  booksStore.authorId = localAuthorId.value === '' ? undefined : Number(localAuthorId.value)
  booksStore.year = localYear.value === '' ? undefined : Number(localYear.value)
  booksStore.fetchBooks(1)
}

function handleReset() {
  localSearch.value = ''
  localAuthorId.value = ''
  localYear.value = ''
  booksStore.resetFilters()
  booksStore.fetchBooks(1)
}

function handlePageChange(newPage: number) {
  booksStore.fetchBooks(newPage)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function confirmDelete(book: Book) {
  bookToDelete.value = book
}

async function handleDelete() {
  if (!bookToDelete.value) return
  deleteLoading.value = true
  try {
    const title = bookToDelete.value.title
    await booksStore.deleteBook(bookToDelete.value.id)
    notificationStore.success(`Книга "${title}" успешно удалена`)
    bookToDelete.value = null
  } catch (err: unknown) {
    notificationStore.error(err instanceof Error ? err.message : 'Ошибка при удалении книги')
  } finally {
    deleteLoading.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header & Action bar -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-xl sm:text-2xl font-bold tracking-tight text-zinc-100">
          Каталог книг
        </h1>
        <p class="text-xs sm:text-sm text-zinc-400 mt-1">
          Каталог литературы с фильтрацией по авторам, годам издания и поиском.
        </p>
      </div>

      <div class="flex items-center gap-2">
        <RouterLink
          v-if="authStore.isAuthenticated"
          to="/books/create"
          class="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors shadow-sm"
        >
          <Plus class="w-4 h-4" />
          <span>Добавить книгу</span>
        </RouterLink>
      </div>
    </div>

    <!-- Filter bar -->
    <div class="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 backdrop-blur-sm">
      <form class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3" @submit.prevent="applyFilters">
        <!-- Search query -->
        <div class="relative">
          <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            v-model="localSearch"
            type="text"
            placeholder="Поиск по названию или описанию..."
            class="w-full pl-9 pr-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600"
          />
        </div>

        <!-- Author filter -->
        <div>
          <select
            v-model="localAuthorId"
            class="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600"
          >
            <option value="">Все авторы</option>
            <option
              v-for="author in authorsStore.allAuthors"
              :key="author.id"
              :value="author.id"
            >
              {{ author.full_name }}
            </option>
          </select>
        </div>

        <!-- Year filter -->
        <div>
          <input
            v-model="localYear"
            type="number"
            placeholder="Год издания (напр. 2024)"
            min="1000"
            max="2035"
            class="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 font-mono"
          />
        </div>

        <!-- Action buttons -->
        <div class="flex items-center gap-2">
          <button
            type="submit"
            class="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-semibold rounded-lg transition-colors"
          >
            <Filter class="w-3.5 h-3.5" />
            <span>Применить</span>
          </button>
          <button
            type="button"
            class="px-3 py-2 bg-zinc-800 hover:bg-zinc-700/80 text-zinc-300 hover:text-white text-xs font-medium rounded-lg transition-colors"
            title="Сбросить все фильтры"
            @click="handleReset"
          >
            <RotateCcw class="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </div>

    <!-- Loading skeleton -->
    <div v-if="booksStore.loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <div
        v-for="n in 8"
        :key="n"
        class="bg-zinc-900/40 border border-zinc-800/60 rounded-xl overflow-hidden animate-pulse"
      >
        <div class="aspect-[3/4] bg-zinc-800/40"></div>
        <div class="p-4 space-y-2.5">
          <div class="h-4 bg-zinc-800 rounded w-3/4"></div>
          <div class="h-3 bg-zinc-800/60 rounded w-1/2"></div>
          <div class="h-3 bg-zinc-800/40 rounded w-full"></div>
        </div>
      </div>
    </div>

    <!-- Error state -->
    <div
      v-else-if="booksStore.error"
      class="p-6 rounded-xl border border-red-500/20 bg-red-500/5 text-center text-xs text-red-300"
    >
      {{ booksStore.error }}
    </div>

    <!-- Empty state -->
    <div
      v-else-if="booksStore.items.length === 0"
      class="p-12 text-center border border-dashed border-zinc-800 rounded-xl bg-zinc-950/40"
    >
      <BookOpen class="w-10 h-10 text-zinc-600 mx-auto stroke-[1.3] mb-3" />
      <h3 class="text-sm font-semibold text-zinc-200">Книги не найдены</h3>
      <p class="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
        Попробуйте изменить параметры поиска или фильтры по автору и году выпуска.
      </p>
      <button
        type="button"
        class="mt-4 px-3 py-1.5 text-xs text-zinc-300 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
        @click="handleReset"
      >
        Сбросить параметры
      </button>
    </div>

    <!-- Books grid -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <BookCard
        v-for="book in booksStore.items"
        :key="book.id"
        :book="book"
        @delete="confirmDelete"
      />
    </div>

    <!-- Pagination -->
    <PaginationControl
      :page="booksStore.page"
      :total-pages="booksStore.totalPages"
      :total="booksStore.total"
      :per-page="booksStore.perPage"
      @change="handlePageChange"
    />

    <!-- Delete Confirmation Modal -->
    <ConfirmModal
      :open="!!bookToDelete"
      :title="'Удаление книги'"
      :message="`Вы уверены, что хотите удалить книгу «${bookToDelete?.title}»? Это действие необратимо.`"
      :confirm-text="'Удалить книгу'"
      :danger="true"
      :loading="deleteLoading"
      @confirm="handleDelete"
      @close="bookToDelete = null"
    />
  </div>
</template>
