import { apiClient } from './client'
import type { AuthorListResponse, AuthorResponse, AuthorInput, Subscription } from '@/types'

export interface AuthorListParams {
  page?: number
  'per-page'?: number
  search?: string
}

export const authorsApi = {
  list(params?: AuthorListParams): Promise<AuthorListResponse> {
    return apiClient.get<AuthorListResponse>('/authors', params as Record<string, string | number | undefined>)
  },

  get(id: number): Promise<AuthorResponse> {
    return apiClient.get<AuthorResponse>(`/authors/${id}`)
  },

  create(data: AuthorInput): Promise<AuthorResponse> {
    return apiClient.post<AuthorResponse>('/authors', data)
  },

  update(id: number, data: AuthorInput): Promise<AuthorResponse> {
    return apiClient.put<AuthorResponse>(`/authors/${id}`, data)
  },

  delete(id: number): Promise<void> {
    return apiClient.delete<void>(`/authors/${id}`)
  },

  subscribe(authorId: number, phone: string): Promise<{ success: boolean; data: Subscription; message?: string }> {
    return apiClient.post<{ success: boolean; data: Subscription; message?: string }>(
      `/authors/${authorId}/subscribe`,
      { phone }
    )
  },
}
