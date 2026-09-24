import { defineStore } from 'pinia'
import { ref } from 'vue'
import { reportsApi } from '@/api/reports'
import type { TopAuthor } from '@/types'

export const useReportsStore = defineStore('reports', () => {
  const currentYear = new Date().getFullYear()
  const year = ref<number>(currentYear)
  const items = ref<TopAuthor[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchTopAuthors(targetYear: number): Promise<void> {
    year.value = targetYear
    loading.value = true
    error.value = null
    try {
      const res = await reportsApi.getTopAuthors(targetYear)
      if (res.success && res.data) {
        items.value = res.data.items
      } else {
        items.value = []
      }
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Не удалось сформировать отчёт'
      items.value = []
    } finally {
      loading.value = false
    }
  }

  return {
    year,
    items,
    loading,
    error,
    fetchTopAuthors,
  }
})
