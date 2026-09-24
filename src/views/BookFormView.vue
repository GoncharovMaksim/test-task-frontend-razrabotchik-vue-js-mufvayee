<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Upload, Check, X, AlertCircle, Plus, Users } from 'lucide-vue-next'
import { useBooksStore } from '@/stores/books'
import { useAuthorsStore } from '@/stores/authors'
import { useNotificationStore } from '@/stores/notifications'
import { isValidIsbn, isValidYear } from '@/utils/validation'

const route = useRoute()
const router = useRouter()
const booksStore = useBooksStore()
const authorsStore = useAuthorsStore()
const notificationStore = useNotificationStore()

const isEdit = computed(() => !!route.params.id)
const bookId = computed(() => (isEdit.value ? Number(route.params.id) : null))

// Form state
const title = ref('')
const year = ref<number | ''>(new Date().getFullYear())
const description = ref('')
const isbn = ref('')
const selectedAuthorIds = ref<number[]>([])
const coverFile = ref<File | null>(null)
const coverPreviewUrl = ref<string>('')
const existingCoverUrl = ref<string>('')

// Validation errors
const fieldErrors = ref<Record<string, string>>({})
const submitting = ref(false)

// Inline author creation modal state
const showAddAuthorModal = ref(false)
const newAuthorName = ref('')
const addAuthorLoading = ref(false)

onMounted(async () => {
  await authorsStore.fetchAllAuthors()

  if (isEdit.value && bookId.value) {
    const book = await booksStore.fetchBook(bookId.value)
    if (book) {
      title.value = book.title
      year.value = book.year
      description.value = book.description || ''
      isbn.value = book.isbn || ''
      selectedAuthorIds.value = book.authors ? book.authors.map((a) => a.id) : []
      existingCoverUrl.value = book.cover_url || ''
      coverPreviewUrl.value = book.cover_url || ''
    } else {
      notificationStore.error('Книга не найдена')
      router.push('/books')
    }
  }
})

function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    const file = target.files[0]
    coverFile.value = file
    coverPreviewUrl.value = URL.createObjectURL(file)
  }
}

function removeCover() {
  coverFile.value = null
  coverPreviewUrl.value = ''
  existingCoverUrl.value = ''
}

function toggleAuthor(authorId: number) {
  const idx = selectedAuthorIds.value.indexOf(authorId)
  if (idx >= 0) {
    selectedAuthorIds.value.splice(idx, 1)
  } else {
    selectedAuthorIds.value.push(authorId)
  }
  delete fieldErrors.value.authors
}

async function handleCreateQuickAuthor() {
  if (!newAuthorName.value.trim()) return
  addAuthorLoading.value = true
  try {
    const created = await authorsStore.createAuthor({ full_name: newAuthorName.value.trim() })
    await authorsStore.fetchAllAuthors()
    selectedAuthorIds.value.push(created.id)
    newAuthorName.value = ''
    showAddAuthorModal.value = false
    notificationStore.success(`Автор "${created.full_name}" добавлен`)
  } catch (err: unknown) {
    notificationStore.error(err instanceof Error ? err.message : 'Не удалось добавить автора')
  } finally {
    addAuthorLoading.value = false
  }
}

function validateForm(): boolean {
  const errors: Record<string, string> = {}

  if (!title.value.trim()) {
    errors.title = 'Название книги обязательно для заполнения'
  }

  if (year.value === '' || !isValidYear(Number(year.value))) {
    errors.year = 'Укажите корректный год выпуска книги (например, 2024)'
  }

  if (selectedAuthorIds.value.length === 0) {
    errors.authors = 'Выберите хотя бы одного автора из списка'
  }

  if (isbn.value.trim() && !isValidIsbn(isbn.value.trim())) {
    errors.isbn = 'Неверный формат ISBN (допустим ISBN-10 или ISBN-13)'
  }

  fieldErrors.value = errors
  return Object.keys(errors).length === 0
}

async function handleSubmit() {
  if (!validateForm()) return

  submitting.value = true
  try {
    // According to OpenAPI spec:
    // POST /books and PUT /books/{id} support multipart/form-data with cover file
    const formData = new FormData()
    formData.append('title', title.value.trim())
    formData.append('year', String(year.value))
    if (description.value.trim()) {
      formData.append('description', description.value.trim())
    }
    if (isbn.value.trim()) {
      formData.append('isbn', isbn.value.trim())
    }
    for (const authorId of selectedAuthorIds.value) {
      formData.append('author_ids[]', String(authorId))
    }
    if (coverFile.value) {
      formData.append('cover', coverFile.value)
    } else if (existingCoverUrl.value) {
      formData.append('cover_url', existingCoverUrl.value)
    }

    if (isEdit.value && bookId.value) {
      const updated = await booksStore.updateBook(bookId.value, formData)
      notificationStore.success(`Книга "${updated.title}" успешно обновлена`)
      router.push(`/books/${updated.id}`)
    } else {
      const created = await booksStore.createBook(formData)
      notificationStore.success(`Книга "${created.title}" успешно добавлена в каталог!`)
      router.push(`/books/${created.id}`)
    }
  } catch (err: unknown) {
    notificationStore.error(err instanceof Error ? err.message : 'Ошибка сохранения книги')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="max-w-3xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <button
          type="button"
          class="p-2 rounded-lg text-zinc-400 hover:text-zinc-200 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition-colors"
          @click="router.back()"
        >
          <ArrowLeft class="w-4 h-4" />
        </button>
        <div>
          <h1 class="text-xl font-bold text-zinc-100">
            {{ isEdit ? 'Редактирование книги' : 'Добавление новой книги' }}
          </h1>
          <p class="text-xs text-zinc-400 mt-0.5">
            {{ isEdit ? 'Изменение данных существующей книги каталога' : 'Заполните форму для публикации книги в каталоге' }}
          </p>
        </div>
      </div>
    </div>

    <!-- Form -->
    <form class="space-y-6 bg-zinc-900/60 border border-zinc-800 rounded-xl p-6 sm:p-8" @submit.prevent="handleSubmit">
      <!-- Title -->
      <div class="space-y-1.5">
        <label for="book-title" class="block text-xs font-semibold text-zinc-300">
          Название книги <span class="text-red-400">*</span>
        </label>
        <input
          id="book-title"
          v-model="title"
          type="text"
          placeholder="Например: Чистая архитектура. Искусство разработки ПО"
          class="w-full px-3.5 py-2.5 bg-zinc-950 border rounded-lg text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-1 transition-colors"
          :class="fieldErrors.title ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500' : 'border-zinc-800 focus:border-zinc-500 focus:ring-zinc-500'"
        />
        <p v-if="fieldErrors.title" class="text-xs text-red-400 mt-1 flex items-center gap-1">
          <AlertCircle class="w-3.5 h-3.5" />
          {{ fieldErrors.title }}
        </p>
      </div>

      <!-- Year & ISBN row -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <!-- Year -->
        <div class="space-y-1.5">
          <label for="book-year" class="block text-xs font-semibold text-zinc-300">
            Год выпуска <span class="text-red-400">*</span>
          </label>
          <input
            id="book-year"
            v-model="year"
            type="number"
            min="1000"
            max="2035"
            placeholder="2024"
            class="w-full px-3.5 py-2.5 bg-zinc-950 border rounded-lg text-sm font-mono text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-1 transition-colors"
            :class="fieldErrors.year ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500' : 'border-zinc-800 focus:border-zinc-500 focus:ring-zinc-500'"
          />
          <p v-if="fieldErrors.year" class="text-xs text-red-400 mt-1 flex items-center gap-1">
            <AlertCircle class="w-3.5 h-3.5" />
            {{ fieldErrors.year }}
          </p>
        </div>

        <!-- ISBN -->
        <div class="space-y-1.5">
          <label for="book-isbn" class="block text-xs font-semibold text-zinc-300">
            ISBN (ISBN-10 или ISBN-13)
          </label>
          <input
            id="book-isbn"
            v-model="isbn"
            type="text"
            placeholder="978-5-4461-0623-3"
            class="w-full px-3.5 py-2.5 bg-zinc-950 border rounded-lg text-sm font-mono text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-1 transition-colors"
            :class="fieldErrors.isbn ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500' : 'border-zinc-800 focus:border-zinc-500 focus:ring-zinc-500'"
          />
          <p v-if="fieldErrors.isbn" class="text-xs text-red-400 mt-1 flex items-center gap-1">
            <AlertCircle class="w-3.5 h-3.5" />
            {{ fieldErrors.isbn }}
          </p>
        </div>
      </div>

      <!-- Authors Multi-Select Section -->
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <label class="block text-xs font-semibold text-zinc-300">
            Авторы произведения <span class="text-red-400">*</span>
          </label>
          <button
            type="button"
            class="inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
            @click="showAddAuthorModal = true"
          >
            <Plus class="w-3.5 h-3.5" />
            <span>Добавить нового автора</span>
          </button>
        </div>

        <div
          class="p-3 bg-zinc-950 border rounded-lg max-h-48 overflow-y-auto space-y-1.5"
          :class="fieldErrors.authors ? 'border-red-500/50' : 'border-zinc-800'"
        >
          <div
            v-for="author in authorsStore.allAuthors"
            :key="author.id"
            class="flex items-center justify-between p-2 rounded-md hover:bg-zinc-900 cursor-pointer select-none transition-colors text-xs"
            @click="toggleAuthor(author.id)"
          >
            <span class="text-zinc-200">{{ author.full_name }}</span>
            <div
              class="w-4 h-4 rounded border flex items-center justify-center transition-colors"
              :class="
                selectedAuthorIds.includes(author.id)
                  ? 'bg-emerald-600 border-emerald-500 text-white'
                  : 'border-zinc-700 bg-zinc-900'
              "
            >
              <Check v-if="selectedAuthorIds.includes(author.id)" class="w-3 h-3 stroke-[3]" />
            </div>
          </div>
          <div v-if="authorsStore.allAuthors.length === 0" class="text-center py-4 text-xs text-zinc-500">
            Авторы пока не добавлены в базу
          </div>
        </div>
        <p v-if="fieldErrors.authors" class="text-xs text-red-400 mt-1 flex items-center gap-1">
          <AlertCircle class="w-3.5 h-3.5" />
          {{ fieldErrors.authors }}
        </p>
      </div>

      <!-- Description -->
      <div class="space-y-1.5">
        <label for="book-desc" class="block text-xs font-semibold text-zinc-300">
          Краткое описание / аннотация
        </label>
        <textarea
          id="book-desc"
          v-model="description"
          rows="4"
          placeholder="Опишите ключевые особенности книги, о чём она и для кого предназначена..."
          class="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-colors"
        ></textarea>
      </div>

      <!-- Cover file upload -->
      <div class="space-y-2">
        <label class="block text-xs font-semibold text-zinc-300">
          Обложка книги (файл изображения)
        </label>

        <div class="flex flex-col sm:flex-row items-center gap-4">
          <!-- Preview container -->
          <div
            v-if="coverPreviewUrl"
            class="relative w-28 aspect-[3/4] bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden shrink-0 group"
          >
            <img :src="coverPreviewUrl" alt="Превью обложки" class="w-full h-full object-cover" />
            <button
              type="button"
              class="absolute top-1 right-1 p-1 bg-black/80 hover:bg-red-600 text-white rounded transition-colors"
              title="Удалить обложку"
              @click="removeCover"
            >
              <X class="w-3.5 h-3.5" />
            </button>
          </div>

          <!-- File upload dropzone -->
          <label
            class="flex-1 w-full border border-dashed border-zinc-800 hover:border-zinc-600 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer bg-zinc-950/50 hover:bg-zinc-950 transition-colors text-center"
          >
            <Upload class="w-6 h-6 text-zinc-500 mb-2" />
            <span class="text-xs font-medium text-zinc-300">
              Нажмите для выбора файла изображения
            </span>
            <span class="text-[11px] text-zinc-500 mt-1">
              Поддерживаются JPG, PNG, WebP (до 5 МБ)
            </span>
            <input
              type="file"
              accept="image/*"
              class="hidden"
              @change="handleFileChange"
            />
          </label>
        </div>
      </div>

      <!-- Action buttons -->
      <div class="pt-4 border-t border-zinc-800 flex justify-end gap-3">
        <button
          type="button"
          class="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
          :disabled="submitting"
          @click="router.back()"
        >
          Отмена
        </button>
        <button
          type="submit"
          class="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5"
          :disabled="submitting"
        >
          {{ submitting ? 'Сохранение...' : isEdit ? 'Обновить данные' : 'Опубликовать книгу' }}
        </button>
      </div>
    </form>

    <!-- Quick Add Author Modal -->
    <Teleport to="body">
      <div
        v-if="showAddAuthorModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        role="dialog"
      >
        <div class="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-2xl space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              <Users class="w-4 h-4 text-emerald-400" />
              Новый автор
            </h3>
            <button
              type="button"
              class="text-zinc-400 hover:text-zinc-200"
              @click="showAddAuthorModal = false"
            >
              <X class="w-4 h-4" />
            </button>
          </div>
          <div>
            <label class="block text-xs text-zinc-400 mb-1">ФИО автора</label>
            <input
              v-model="newAuthorName"
              type="text"
              placeholder="Роберт К. Мартин"
              class="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
              @keydown.enter.prevent="handleCreateQuickAuthor"
            />
          </div>
          <div class="flex justify-end gap-2 pt-2">
            <button
              type="button"
              class="px-3 py-1.5 text-xs text-zinc-400 bg-zinc-800 hover:bg-zinc-700 rounded-lg"
              @click="showAddAuthorModal = false"
            >
              Отмена
            </button>
            <button
              type="button"
              class="px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg disabled:opacity-50"
              :disabled="addAuthorLoading || !newAuthorName.trim()"
              @click="handleCreateQuickAuthor"
            >
              {{ addAuthorLoading ? 'Добавление...' : 'Добавить' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
