import { apiClient } from './client'
import type { TopAuthorsResponse } from '@/types'

export const reportsApi = {
  getTopAuthors(year: number): Promise<TopAuthorsResponse> {
    return apiClient.get<TopAuthorsResponse>('/reports/top-authors', { year })
  },
}
