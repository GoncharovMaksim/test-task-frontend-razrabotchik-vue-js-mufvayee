import type { ErrorResponse } from '@/types'

export class ApiError extends Error {
  public status: number
  public errors: Array<{ field?: string; message: string }>

  constructor(status: number, message: string, errors: Array<{ field?: string; message: string }> = []) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errors = errors.length > 0 ? errors : [{ message }]
  }
}

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | undefined | null>
}

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string = '/api/v1') {
    this.baseUrl = baseUrl
  }

  public setBaseUrl(url: string) {
    this.baseUrl = url
  }

  public getBaseUrl(): string {
    return this.baseUrl
  }

  private getToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('auth_token')
  }

  public async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { params, headers = {}, ...customConfig } = options

    let url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`

    if (params) {
      const searchParams = new URLSearchParams()
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value))
        }
      }
      const queryString = searchParams.toString()
      if (queryString) {
        url += (url.includes('?') ? '&' : '?') + queryString
      }
    }

    const token = this.getToken()
    const requestHeaders: Record<string, string> = {
      Accept: 'application/json',
      ...(headers as Record<string, string>),
    }

    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`
    }

    // Don't set Content-Type for FormData, browser automatically sets boundary
    if (!(customConfig.body instanceof FormData) && !requestHeaders['Content-Type'] && customConfig.body) {
      requestHeaders['Content-Type'] = 'application/json'
    }

    const response = await fetch(url, {
      ...customConfig,
      headers: requestHeaders,
    })

    if (response.status === 204) {
      return {} as T
    }

    let data: unknown
    const contentType = response.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      data = await response.json()
    } else {
      const text = await response.text()
      try {
        data = JSON.parse(text)
      } catch {
        data = { message: text }
      }
    }

    if (!response.ok) {
      const errorData = data as Partial<ErrorResponse>
      const errors = errorData?.errors || []
      const defaultMessage = `Ошибка запроса (${response.status})`
      const message = errors[0]?.message || (data as { message?: string })?.message || defaultMessage
      throw new ApiError(response.status, message, errors)
    }

    return data as T
  }

  public get<T>(endpoint: string, params?: Record<string, string | number | undefined | null>): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', params })
  }

  public post<T>(endpoint: string, body?: unknown): Promise<T> {
    const isFormData = body instanceof FormData
    return this.request<T>(endpoint, {
      method: 'POST',
      body: isFormData ? (body as FormData) : body ? JSON.stringify(body) : undefined,
    })
  }

  public put<T>(endpoint: string, body?: unknown): Promise<T> {
    const isFormData = body instanceof FormData
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: isFormData ? (body as FormData) : body ? JSON.stringify(body) : undefined,
    })
  }

  public patch<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  public delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }
}

export const apiClient = new ApiClient(
  typeof window !== 'undefined' && import.meta.env?.VITE_API_URL ? import.meta.env.VITE_API_URL : '/api/v1'
)
