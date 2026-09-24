import { apiClient } from './client'
import type { LoginRequest, LoginResponse } from '@/types'

export const authApi = {
  login(credentials: LoginRequest): Promise<LoginResponse> {
    return apiClient.post<LoginResponse>('/auth/login', credentials)
  },
}
