<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, BookOpen, BellRing, Edit2, Trash2, Calendar } from 'lucide-vue-next'
import { useAuthorsStore } from '@/stores/authors'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notifications'
import ConfirmModal from '@/components/ConfirmModal.vue'
import SubscribeModal from '@/components/SubscribeModal.vue'

const route = useRoute()
const router = useRouter()
const authorsStore = useAuthorsStore()
const authStore = useAuthStore()
const notificationStore = useNotificationStore()

const authorId = computed(() => Number(route.params.id))

// Delete modal
const showDeleteModal = ref(false)
const deleteLoading = ref(false)

// Subscribe modal
const showSubscribeModal = ref(false)

// Edit modal
const showEditModal = ref(false)
const editFullName = ref('')
const editLoading = ref(false)

onMounted(async () => {
  if (authorId.value) {
    const author = await authorsStore.fetchAuthor(authorId.value)
    if (author) {
      editFullName.value = author.full_name
    }
  }
})

async function handleEdit() {
  if (!editFullName.value.trim() || !authorsStore.currentAuthor) return
  editLoading.value = true
  try {
    await authorsStore.updateAuthor(authorsStore.currentAuthor.id, {
      full_name: editFullName.value.trim(),
    })
    notificationStore.success('Данные автора успешно сохранены')
    showEditModal.value = false
    await authorsStore.fetchAuthor(authorId.value)
  } catch (err: unknown) {
    notificationStore.error(err instanceof Error ? err.message : 'Ошибка при сохранении')
  } finally {
    editLoading.value = false
  }
}

async function handleDelete() {
  if (!authorsStore.currentAuthor) return
  deleteLoading.value = true
  try {
    const name = authorsStore.currentAuthor.full_name
    await authorsStore.deleteAuthor(authorsStore.currentAuthor.id)
    notificationStore.success(`Автор "${name}" удалён`)
    showDeleteModal.value = false
    router.push('/authors')
  } catch (err: unknown) {
    notificationStore.error(err instanceof Error ? err.message : 'Ошибка при удалении')
  } finally {
    deleteLoading.value = false
  }
}
</script>

<template>
  <div class="max-w-4xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between gap-4">
      <button
        type="button"
        class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition-colors"
        @click="router.back()"
      >
        <ArrowLeft class="w-3.5 h-3.5" />
        <span>Назад</span>
      </button>

      <div class="flex items-center gap-2">
        <button
          type="button"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors"
          @click="showSubscribeModal = true"
        >
          <BellRing class="w-3.5 h-3.5" />
          <span>SMS-подписка на новые книги</span>
        </button>

        <template v-if="authStore.isAuthenticated && authorsStore.currentAuthor">
          <button
            type="button"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-300 bg-zinc-800 hover:bg-zinc-700 transition-colors"
            @click="showEditModal = true"
          >
            <Edit2 class="w-3.5 h-3.5" />
            <span>Редактировать</span>
          </button>
          <button
            type="button"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-colors"
            @click="showDeleteModal = true"
          >
            <Trash2 class="w-3.5 h-3.5" />
            <span>Удалить</span>
          </button>
        </template>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="authorsStore.loading" class="bg-zinc-900/40 border border-zinc-800 rounded-xl p-8 animate-pulse space-y-4">
      <div class="h-6 bg-zinc-800 rounded w-1/3"></div>
      <div class="h-4 bg-zinc-800/60 rounded w-1/4"></div>
    </div>

    <!-- Error -->
    <div
      v-else-if="authorsStore.error || !authorsStore.currentAuthor"
      class="p-8 rounded-xl border border-red-500/20 bg-red-500/5 text-center text-xs text-red-300"
    >
      {{ authorsStore.error || 'Автор не найден' }}
    </div>

    <!-- Content -->
    <div v-else class="space-y-6">
      <div class="bg-zinc-900/60 border border-zinc-800 rounded-xl p-6 sm:p-8">
        <span class="text-xs font-mono text-zinc-500">ID автора #{{ authorsStore.currentAuthor.id }}</span>
        <h1 class="text-2xl font-bold text-zinc-100 mt-1">
          {{ authorsStore.currentAuthor.full_name }}
        </h1>
        <p class="text-xs text-zinc-400 mt-2">
          Всего опубликованных книг в каталоге: {{ authorsStore.currentAuthor.books ? authorsStore.currentAuthor.books.length : 0 }}
        </p>
      </div>

      <!-- Author's books section -->
      <div class="space-y-3">
        <h2 class="text-base font-semibold text-zinc-100 flex items-center gap-2">
          <BookOpen class="w-4 h-4 text-emerald-400" />
          <span>Книги автора</span>
        </h2>

        <div
          v-if="!authorsStore.currentAuthor.books || authorsStore.currentAuthor.books.length === 0"
          class="p-8 text-center border border-dashed border-zinc-800 rounded-xl bg-zinc-950/40 text-xs text-zinc-500"
        >
          У этого автора пока нет зарегистрированных книг в каталоге.
        </div>

        <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <RouterLink
            v-for="book in authorsStore.currentAuthor.books"
            :key="book.id"
            :to="`/books/${book.id}`"
            class="p-4 bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 rounded-xl transition-all flex flex-col justify-between group"
          >
            <div>
              <div class="flex items-center gap-1.5 text-[11px] font-mono text-zinc-500 mb-1">
                <Calendar class="w-3 h-3" />
                <span>{{ book.year }} г.</span>
              </div>
              <h3 class="font-medium text-sm text-zinc-200 group-hover:text-white transition-colors">
                {{ book.title }}
              </h3>
            </div>
            <div class="mt-4 pt-2 border-t border-zinc-800/60 text-xs text-emerald-400 group-hover:underline">
              Подробнее о книге →
            </div>
          </RouterLink>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <ConfirmModal
      :open="showDeleteModal"
      :title="'Удаление автора'"
      :message="`Вы действительно хотите удалить автора «${authorsStore.currentAuthor?.full_name}»?`"
      :confirm-text="'Удалить'"
      :danger="true"
      :loading="deleteLoading"
      @confirm="handleDelete"
      @close="showDeleteModal = false"
    />

    <SubscribeModal
      v-if="authorsStore.currentAuthor"
      :open="showSubscribeModal"
      :author-id="authorsStore.currentAuthor.id"
      :author-name="authorsStore.currentAuthor.full_name"
      @close="showSubscribeModal = false"
    />

    <!-- Edit modal -->
    <Teleport to="body">
      <div
        v-if="showEditModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        role="dialog"
      >
        <div class="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-2xl space-y-4">
          <h3 class="text-base font-semibold text-zinc-100">Редактировать автора</h3>
          <div class="space-y-1.5">
            <label class="block text-xs font-medium text-zinc-300">ФИО</label>
            <input
              v-model="editFullName"
              type="text"
              class="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-100 focus:outline-none focus:border-zinc-500"
              @keydown.enter.prevent="handleEdit"
            />
          </div>
          <div class="flex justify-end gap-3 pt-2">
            <button
              type="button"
              class="px-4 py-2 text-xs font-medium text-zinc-400 bg-zinc-800 hover:bg-zinc-700 rounded-lg"
              :disabled="editLoading"
              @click="showEditModal = false"
            >
              Отмена
            </button>
            <button
              type="button"
              class="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg disabled:opacity-50"
              :disabled="editLoading || !editFullName.trim()"
              @click="handleEdit"
            >
              {{ editLoading ? 'Сохранение...' : 'Сохранить' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
