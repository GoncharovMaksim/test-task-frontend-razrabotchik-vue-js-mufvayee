import { apiClient } from './client'
import type { BookListResponse, BookResponse, BookInput } from '@/types'

export interface BookListParams {
  page?: number
  'per-page'?: number
  author_id?: number
  year?: number
  search?: string
}

export const booksApi = {
  list(params?: BookListParams): Promise<BookListResponse> {
    return apiClient.get<BookListResponse>('/books', params as Record<string, string | number | undefined>)
  },

  get(id: number): Promise<BookResponse> {
    return apiClient.get<BookResponse>(`/books/${id}`)
  },

  create(data: FormData | BookInput): Promise<BookResponse> {
    return apiClient.post<BookResponse>('/books', data)
  },

  update(id: number, data: FormData | BookInput): Promise<BookResponse> {
    return apiClient.put<BookResponse>(`/books/${id}`, data)
  },

  patch(id: number, data: Partial<BookInput>): Promise<BookResponse> {
    return apiClient.patch<BookResponse>(`/books/${id}`, data)
  },

  delete(id: number): Promise<void> {
    return apiClient.delete<void>(`/books/${id}`)
  },
}
