import { defineStore } from 'pinia'
import { ref } from 'vue'
import { booksApi, type BookListParams } from '@/api/books'
import type { Book, BookInput } from '@/types'

export const useBooksStore = defineStore('books', () => {
  const items = ref<Book[]>([])
  const total = ref(0)
  const page = ref(1)
  const perPage = ref(12)
  const totalPages = ref(1)
  const currentBook = ref<Book | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Filters
  const search = ref('')
  const authorId = ref<number | undefined>(undefined)
  const year = ref<number | undefined>(undefined)

  async function fetchBooks(targetPage?: number): Promise<void> {
    if (targetPage !== undefined) {
      page.value = targetPage
    }
    loading.value = true
    error.value = null
    try {
      const params: BookListParams = {
        page: page.value,
        'per-page': perPage.value,
      }
      if (search.value.trim()) params.search = search.value.trim()
      if (authorId.value !== undefined) params.author_id = authorId.value
      if (year.value !== undefined) params.year = year.value

      const res = await booksApi.list(params)
      if (res.success && res.data) {
        items.value = res.data.items
        total.value = res.data.pagination.total
        page.value = res.data.pagination.page
        perPage.value = res.data.pagination.per_page
        totalPages.value = res.data.pagination.total_pages
      }
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Не удалось загрузить книги'
    } finally {
      loading.value = false
    }
  }

  async function fetchBook(id: number): Promise<Book | null> {
    loading.value = true
    error.value = null
    try {
      const res = await booksApi.get(id)
      if (res.success && res.data) {
        currentBook.value = res.data
        return res.data
      }
      return null
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Книга не найдена'
      return null
    } finally {
      loading.value = false
    }
  }

  async function createBook(data: FormData | BookInput): Promise<Book> {
    loading.value = true
    error.value = null
    try {
      const res = await booksApi.create(data)
      if (res.success && res.data) {
        return res.data
      }
      throw new Error('Не удалось создать книгу')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ошибка при создании книги'
      error.value = msg
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateBook(id: number, data: FormData | BookInput): Promise<Book> {
    loading.value = true
    error.value = null
    try {
      const res = await booksApi.update(id, data)
      if (res.success && res.data) {
        currentBook.value = res.data
        return res.data
      }
      throw new Error('Не удалось обновить книгу')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ошибка при обновлении книги'
      error.value = msg
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteBook(id: number): Promise<void> {
    loading.value = true
    error.value = null
    try {
      await booksApi.delete(id)
      items.value = items.value.filter((b) => b.id !== id)
      total.value = Math.max(0, total.value - 1)
      if (currentBook.value?.id === id) {
        currentBook.value = null
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ошибка при удалении книги'
      error.value = msg
      throw err
    } finally {
      loading.value = false
    }
  }

  function resetFilters() {
    search.value = ''
    authorId.value = undefined
    year.value = undefined
    page.value = 1
  }

  return {
    items,
    total,
    page,
    perPage,
    totalPages,
    currentBook,
    loading,
    error,
    search,
    authorId,
    year,
    fetchBooks,
    fetchBook,
    createBook,
    updateBook,
    deleteBook,
    resetFilters,
  }
})
