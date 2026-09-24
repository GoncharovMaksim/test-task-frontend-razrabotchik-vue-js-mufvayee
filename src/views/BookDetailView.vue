<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Edit2, Trash2, BookOpen, Calendar, Hash, Users, BellRing } from 'lucide-vue-next'
import { useBooksStore } from '@/stores/books'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notifications'
import ConfirmModal from '@/components/ConfirmModal.vue'
import SubscribeModal from '@/components/SubscribeModal.vue'

const route = useRoute()
const router = useRouter()
const booksStore = useBooksStore()
const authStore = useAuthStore()
const notificationStore = useNotificationStore()

const bookId = computed(() => Number(route.params.id))
const imageError = ref(false)

// Delete modal
const showDeleteModal = ref(false)
const deleteLoading = ref(false)

// Subscribe modal
const subscribeAuthor = ref<{ id: number; name: string } | null>(null)

onMounted(async () => {
  if (bookId.value) {
    await booksStore.fetchBook(bookId.value)
  }
})

async function handleDelete() {
  if (!booksStore.currentBook) return
  deleteLoading.value = true
  try {
    const title = booksStore.currentBook.title
    await booksStore.deleteBook(booksStore.currentBook.id)
    notificationStore.success(`Книга "${title}" успешно удалена`)
    showDeleteModal.value = false
    router.push('/books')
  } catch (err: unknown) {
    notificationStore.error(err instanceof Error ? err.message : 'Ошибка при удалении книги')
  } finally {
    deleteLoading.value = false
  }
}

function openSubscribe(author: { id: number; full_name: string }) {
  subscribeAuthor.value = {
    id: author.id,
    name: author.full_name,
  }
}
</script>

<template>
  <div class="max-w-4xl mx-auto space-y-6">
    <!-- Top action row -->
    <div class="flex items-center justify-between gap-4">
      <button
        type="button"
        class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition-colors"
        @click="router.back()"
      >
        <ArrowLeft class="w-3.5 h-3.5" />
        <span>Назад к каталогу</span>
      </button>

      <div v-if="authStore.isAuthenticated && booksStore.currentBook" class="flex items-center gap-2">
        <RouterLink
          :to="`/books/${booksStore.currentBook.id}/edit`"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-200 bg-zinc-800 hover:bg-zinc-700 transition-colors"
        >
          <Edit2 class="w-3.5 h-3.5" />
          <span>Редактировать</span>
        </RouterLink>

        <button
          type="button"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-colors"
          @click="showDeleteModal = true"
        >
          <Trash2 class="w-3.5 h-3.5" />
          <span>Удалить</span>
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="booksStore.loading" class="bg-zinc-900/40 border border-zinc-800 rounded-xl p-8 animate-pulse">
      <div class="flex flex-col md:flex-row gap-8">
        <div class="w-48 aspect-[3/4] bg-zinc-800/60 rounded-lg"></div>
        <div class="flex-1 space-y-4">
          <div class="h-6 bg-zinc-800 rounded w-3/4"></div>
          <div class="h-4 bg-zinc-800 rounded w-1/4"></div>
          <div class="h-20 bg-zinc-800/50 rounded w-full"></div>
        </div>
      </div>
    </div>

    <!-- Error -->
    <div
      v-else-if="booksStore.error || !booksStore.currentBook"
      class="p-8 rounded-xl border border-red-500/20 bg-red-500/5 text-center text-xs text-red-300"
    >
      {{ booksStore.error || 'Книга не найдена' }}
    </div>

    <!-- Book details -->
    <div
      v-else
      class="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden p-6 md:p-8"
    >
      <div class="flex flex-col md:flex-row gap-8">
        <!-- Cover image -->
        <div class="w-full md:w-56 shrink-0 flex flex-col items-center">
          <div class="w-48 aspect-[3/4] rounded-lg overflow-hidden bg-zinc-950 border border-zinc-800 shadow-md">
            <img
              v-if="booksStore.currentBook.cover_url && !imageError"
              :src="booksStore.currentBook.cover_url"
              :alt="booksStore.currentBook.title"
              class="w-full h-full object-cover"
              @error="imageError = true"
            />
            <div v-else class="w-full h-full flex flex-col items-center justify-center p-4 text-zinc-600 bg-zinc-950">
              <BookOpen class="w-12 h-12 stroke-[1.2] mb-2 text-zinc-600" />
              <span class="text-xs text-center text-zinc-500 line-clamp-2 px-1 font-medium">
                {{ booksStore.currentBook.title }}
              </span>
            </div>
          </div>
        </div>

        <!-- Details -->
        <div class="flex-1 space-y-6">
          <div>
            <span class="inline-block px-2.5 py-0.5 rounded text-xs font-mono font-medium bg-zinc-800 text-zinc-300 mb-2">
              {{ booksStore.currentBook.year }} год издания
            </span>
            <h1 class="text-xl md:text-2xl font-bold text-zinc-100 leading-tight">
              {{ booksStore.currentBook.title }}
            </h1>
          </div>

          <!-- Authors row -->
          <div class="space-y-2">
            <div class="flex items-center gap-1.5 text-xs text-zinc-400 font-medium">
              <Users class="w-3.5 h-3.5 text-zinc-500" />
              <span>Авторы произведения:</span>
            </div>
            <div class="flex flex-wrap gap-2">
              <div
                v-for="author in booksStore.currentBook.authors"
                :key="author.id"
                class="flex items-center gap-1.5 bg-zinc-950 border border-zinc-800 px-3 py-1.5 rounded-lg text-xs"
              >
                <RouterLink
                  :to="`/authors/${author.id}`"
                  class="font-medium text-zinc-200 hover:text-white hover:underline transition-colors"
                >
                  {{ author.full_name }}
                </RouterLink>

                <!-- Guest SMS subscription quick trigger -->
                <button
                  type="button"
                  class="ml-1 text-emerald-400 hover:text-emerald-300 p-0.5 rounded hover:bg-emerald-500/10 transition-colors"
                  title="Подписаться на новые книги автора по SMS"
                  @click="openSubscribe(author)"
                >
                  <BellRing class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          <!-- Metadata -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
            <div class="p-3 rounded-lg bg-zinc-950/60 border border-zinc-800/80">
              <div class="text-zinc-500 flex items-center gap-1.5 mb-1">
                <Hash class="w-3.5 h-3.5" />
                <span>Международный номер ISBN</span>
              </div>
              <div class="font-mono text-zinc-200 font-medium">
                {{ booksStore.currentBook.isbn || 'Не присвоен' }}
              </div>
            </div>

            <div class="p-3 rounded-lg bg-zinc-950/60 border border-zinc-800/80">
              <div class="text-zinc-500 flex items-center gap-1.5 mb-1">
                <Calendar class="w-3.5 h-3.5" />
                <span>Год публикации</span>
              </div>
              <div class="font-mono text-zinc-200 font-medium">
                {{ booksStore.currentBook.year }} г.
              </div>
            </div>
          </div>

          <!-- Description -->
          <div class="space-y-2 pt-2 border-t border-zinc-800/80">
            <h3 class="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Аннотация и описание
            </h3>
            <p class="text-sm text-zinc-300 leading-relaxed whitespace-pre-line">
              {{ booksStore.currentBook.description || 'Описание для данной книги пока отсутствует.' }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <ConfirmModal
      :open="showDeleteModal"
      :title="'Удаление книги'"
      :message="`Вы точно хотите удалить книгу «${booksStore.currentBook?.title}»?`"
      :confirm-text="'Удалить'"
      :danger="true"
      :loading="deleteLoading"
      @confirm="handleDelete"
      @close="showDeleteModal = false"
    />

    <SubscribeModal
      v-if="subscribeAuthor"
      :open="!!subscribeAuthor"
      :author-id="subscribeAuthor.id"
      :author-name="subscribeAuthor.name"
      @close="subscribeAuthor = null"
    />
  </div>
</template>
