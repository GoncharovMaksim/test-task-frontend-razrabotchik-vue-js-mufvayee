<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Plus, Search, Edit2, Trash2, BellRing, Users, BookOpen } from 'lucide-vue-next'
import { useAuthorsStore } from '@/stores/authors'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notifications'
import PaginationControl from '@/components/PaginationControl.vue'
import ConfirmModal from '@/components/ConfirmModal.vue'
import SubscribeModal from '@/components/SubscribeModal.vue'
import type { AuthorShort } from '@/types'

const authorsStore = useAuthorsStore()
const authStore = useAuthStore()
const notificationStore = useNotificationStore()

const localSearch = ref('')

// Create/Edit author modal
const showAuthorModal = ref(false)
const modalAuthorId = ref<number | null>(null)
const authorFullName = ref('')
const authorFormLoading = ref(false)
const authorFormError = ref('')

// Delete modal
const authorToDelete = ref<AuthorShort | null>(null)
const deleteLoading = ref(false)

// Subscribe modal
const authorToSubscribe = ref<AuthorShort | null>(null)

onMounted(async () => {
  await authorsStore.fetchAuthors()
})

function handleSearch() {
  authorsStore.search = localSearch.value
  authorsStore.fetchAuthors(1)
}

function openCreateModal() {
  modalAuthorId.value = null
  authorFullName.value = ''
  authorFormError.value = ''
  showAuthorModal.value = true
}

function openEditModal(author: AuthorShort) {
  modalAuthorId.value = author.id
  authorFullName.value = author.full_name
  authorFormError.value = ''
  showAuthorModal.value = true
}

async function handleSaveAuthor() {
  if (!authorFullName.value.trim()) {
    authorFormError.value = 'Введите ФИО автора'
    return
  }

  authorFormLoading.value = true
  authorFormError.value = ''
  try {
    if (modalAuthorId.value) {
      await authorsStore.updateAuthor(modalAuthorId.value, { full_name: authorFullName.value.trim() })
      notificationStore.success('Автор успешно обновлён')
    } else {
      await authorsStore.createAuthor({ full_name: authorFullName.value.trim() })
      notificationStore.success('Автор успешно добавлен')
    }
    showAuthorModal.value = false
    await authorsStore.fetchAuthors(authorsStore.page)
  } catch (err: unknown) {
    authorFormError.value = err instanceof Error ? err.message : 'Ошибка при сохранении автора'
  } finally {
    authorFormLoading.value = false
  }
}

async function handleDeleteAuthor() {
  if (!authorToDelete.value) return
  deleteLoading.value = true
  try {
    const name = authorToDelete.value.full_name
    await authorsStore.deleteAuthor(authorToDelete.value.id)
    notificationStore.success(`Автор "${name}" удалён`)
    authorToDelete.value = null
  } catch (err: unknown) {
    notificationStore.error(err instanceof Error ? err.message : 'Ошибка при удалении автора')
  } finally {
    deleteLoading.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-xl sm:text-2xl font-bold tracking-tight text-zinc-100">
          Авторы
        </h1>
        <p class="text-xs sm:text-sm text-zinc-400 mt-1">
          Список авторов каталога с возможностью подписки на новые поступления по SMS.
        </p>
      </div>

      <button
        v-if="authStore.isAuthenticated"
        type="button"
        class="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors shadow-sm self-start sm:self-auto"
        @click="openCreateModal"
      >
        <Plus class="w-4 h-4" />
        <span>Добавить автора</span>
      </button>
    </div>

    <!-- Search bar -->
    <div class="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4">
      <form class="flex gap-3" @submit.prevent="handleSearch">
        <div class="relative flex-1">
          <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            v-model="localSearch"
            type="text"
            placeholder="Поиск авторов по имени или фамилии..."
            class="w-full pl-9 pr-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
          />
        </div>
        <button
          type="submit"
          class="px-4 py-2 bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-semibold rounded-lg transition-colors"
        >
          Найти
        </button>
      </form>
    </div>

    <!-- Loading -->
    <div v-if="authorsStore.loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="n in 6" :key="n" class="p-5 bg-zinc-900/40 border border-zinc-800 rounded-xl animate-pulse space-y-3">
        <div class="h-4 bg-zinc-800 rounded w-2/3"></div>
        <div class="h-3 bg-zinc-800/60 rounded w-1/3"></div>
      </div>
    </div>

    <!-- Error -->
    <div
      v-else-if="authorsStore.error"
      class="p-6 rounded-xl border border-red-500/20 bg-red-500/5 text-center text-xs text-red-300"
    >
      {{ authorsStore.error }}
    </div>

    <!-- Empty -->
    <div
      v-else-if="authorsStore.items.length === 0"
      class="p-12 text-center border border-dashed border-zinc-800 rounded-xl bg-zinc-950/40"
    >
      <Users class="w-10 h-10 text-zinc-600 mx-auto mb-3" />
      <h3 class="text-sm font-semibold text-zinc-200">Авторы не найдены</h3>
      <p class="text-xs text-zinc-500 mt-1">Попробуйте изменить поисковый запрос</p>
    </div>

    <!-- Authors grid -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="author in authorsStore.items"
        :key="author.id"
        class="group p-5 bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 rounded-xl transition-all duration-150 flex flex-col justify-between"
      >
        <div>
          <div class="flex items-start justify-between gap-3">
            <RouterLink
              :to="`/authors/${author.id}`"
              class="font-semibold text-sm text-zinc-100 hover:text-emerald-400 transition-colors"
            >
              {{ author.full_name }}
            </RouterLink>
            <span class="text-[11px] font-mono text-zinc-500 shrink-0">#{{ author.id }}</span>
          </div>
          <p class="text-xs text-zinc-500 mt-1 flex items-center gap-1.5">
            <BookOpen class="w-3.5 h-3.5" />
            <RouterLink :to="`/authors/${author.id}`" class="hover:underline">
              Перейти к книгам автора
            </RouterLink>
          </p>
        </div>

        <div class="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-2">
          <!-- Subscribe button for guests -->
          <button
            type="button"
            class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors"
            @click="authorToSubscribe = author"
          >
            <BellRing class="w-3.5 h-3.5" />
            <span>SMS-подписка</span>
          </button>

          <!-- Edit & Delete for authenticated user -->
          <div v-if="authStore.isAuthenticated" class="flex items-center gap-1">
            <button
              type="button"
              class="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
              title="Редактировать автора"
              @click="openEditModal(author)"
            >
              <Edit2 class="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              class="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title="Удалить автора"
              @click="authorToDelete = author"
            >
              <Trash2 class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <PaginationControl
      :page="authorsStore.page"
      :total-pages="authorsStore.totalPages"
      :total="authorsStore.total"
      :per-page="authorsStore.perPage"
      @change="(p) => authorsStore.fetchAuthors(p)"
    />

    <!-- Create/Edit Author Modal -->
    <Teleport to="body">
      <div
        v-if="showAuthorModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        role="dialog"
      >
        <div class="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-2xl space-y-4">
          <h3 class="text-base font-semibold text-zinc-100">
            {{ modalAuthorId ? 'Редактирование автора' : 'Новый автор' }}
          </h3>

          <div class="space-y-1.5">
            <label class="block text-xs font-medium text-zinc-300">
              ФИО автора <span class="text-red-400">*</span>
            </label>
            <input
              v-model="authorFullName"
              type="text"
              placeholder="Лев Николаевич Толстой"
              class="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
              @keydown.enter.prevent="handleSaveAuthor"
            />
            <p v-if="authorFormError" class="text-xs text-red-400">
              {{ authorFormError }}
            </p>
          </div>

          <div class="flex justify-end gap-3 pt-2">
            <button
              type="button"
              class="px-4 py-2 text-xs font-medium text-zinc-400 bg-zinc-800 hover:bg-zinc-700 rounded-lg"
              :disabled="authorFormLoading"
              @click="showAuthorModal = false"
            >
              Отмена
            </button>
            <button
              type="button"
              class="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg disabled:opacity-50"
              :disabled="authorFormLoading"
              @click="handleSaveAuthor"
            >
              {{ authorFormLoading ? 'Сохранение...' : 'Сохранить' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Delete Modal -->
    <ConfirmModal
      :open="!!authorToDelete"
      :title="'Удаление автора'"
      :message="`Вы точно хотите удалить автора «${authorToDelete?.full_name}»?`"
      :confirm-text="'Удалить'"
      :danger="true"
      :loading="deleteLoading"
      @confirm="handleDeleteAuthor"
      @close="authorToDelete = null"
    />

    <!-- Subscribe Modal -->
    <SubscribeModal
      v-if="authorToSubscribe"
      :open="!!authorToSubscribe"
      :author-id="authorToSubscribe.id"
      :author-name="authorToSubscribe.full_name"
      @close="authorToSubscribe = null"
    />
  </div>
</template>
