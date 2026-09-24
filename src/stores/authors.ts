import { defineStore } from 'pinia'
import { ref } from 'vue'
import { authorsApi, type AuthorListParams } from '@/api/authors'
import type { Author, AuthorShort, AuthorInput } from '@/types'

export const useAuthorsStore = defineStore('authors', () => {
  const items = ref<AuthorShort[]>([])
  const allAuthors = ref<AuthorShort[]>([])
  const total = ref(0)
  const page = ref(1)
  const perPage = ref(12)
  const totalPages = ref(1)
  const currentAuthor = ref<Author | null>(null)
  const search = ref('')
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchAuthors(targetPage?: number): Promise<void> {
    if (targetPage !== undefined) {
      page.value = targetPage
    }
    loading.value = true
    error.value = null
    try {
      const params: AuthorListParams = {
        page: page.value,
        'per-page': perPage.value,
      }
      if (search.value.trim()) params.search = search.value.trim()

      const res = await authorsApi.list(params)
      if (res.success && res.data) {
        items.value = res.data.items
        total.value = res.data.pagination.total
        page.value = res.data.pagination.page
        perPage.value = res.data.pagination.per_page
        totalPages.value = res.data.pagination.total_pages
      }
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Не удалось загрузить авторов'
    } finally {
      loading.value = false
    }
  }

  async function fetchAllAuthors(): Promise<AuthorShort[]> {
    try {
      const res = await authorsApi.list({ page: 1, 'per-page': 100 })
      if (res.success && res.data) {
        allAuthors.value = res.data.items
        return res.data.items
      }
      return []
    } catch {
      return []
    }
  }

  async function fetchAuthor(id: number): Promise<Author | null> {
    loading.value = true
    error.value = null
    try {
      const res = await authorsApi.get(id)
      if (res.success && res.data) {
        currentAuthor.value = res.data
        return res.data
      }
      return null
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Автор не найден'
      return null
    } finally {
      loading.value = false
    }
  }

  async function createAuthor(data: AuthorInput): Promise<Author> {
    loading.value = true
    error.value = null
    try {
      const res = await authorsApi.create(data)
      if (res.success && res.data) {
        return res.data
      }
      throw new Error('Не удалось создать автора')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ошибка при создании автора'
      error.value = msg
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateAuthor(id: number, data: AuthorInput): Promise<Author> {
    loading.value = true
    error.value = null
    try {
      const res = await authorsApi.update(id, data)
      if (res.success && res.data) {
        currentAuthor.value = res.data
        return res.data
      }
      throw new Error('Не удалось обновить автора')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ошибка при обновлении автора'
      error.value = msg
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteAuthor(id: number): Promise<void> {
    loading.value = true
    error.value = null
    try {
      await authorsApi.delete(id)
      items.value = items.value.filter((a) => a.id !== id)
      allAuthors.value = allAuthors.value.filter((a) => a.id !== id)
      total.value = Math.max(0, total.value - 1)
      if (currentAuthor.value?.id === id) {
        currentAuthor.value = null
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ошибка при удалении автора'
      error.value = msg
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    items,
    allAuthors,
    total,
    page,
    perPage,
    totalPages,
    currentAuthor,
    search,
    loading,
    error,
    fetchAuthors,
    fetchAllAuthors,
    fetchAuthor,
    createAuthor,
    updateAuthor,
    deleteAuthor,
  }
})
