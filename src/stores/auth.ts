import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api/auth'
import type { User, LoginRequest } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(
    typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
  )
  const user = ref<User | null>(
    typeof window !== 'undefined' && localStorage.getItem('auth_user')
      ? JSON.parse(localStorage.getItem('auth_user')!)
      : null
  )
  const loading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const isGuest = computed(() => !isAuthenticated.value)
  const role = computed(() => (isAuthenticated.value ? 'user' : 'guest'))

  async function login(credentials: LoginRequest): Promise<boolean> {
    loading.value = true
    error.value = null
    try {
      const response = await authApi.login(credentials)
      if (response.success && response.data) {
        token.value = response.data.token
        user.value = response.data.user
        localStorage.setItem('auth_token', response.data.token)
        localStorage.setItem('auth_user', JSON.stringify(response.data.user))
        return true
      }
      error.value = 'Не удалось авторизоваться'
      return false
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ошибка при входе'
      error.value = msg
      return false
    } finally {
      loading.value = false
    }
  }

  function logout() {
    token.value = null
    user.value = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
    }
  }

  return {
    token,
    user,
    loading,
    error,
    isAuthenticated,
    isGuest,
    role,
    login,
    logout,
  }
})
