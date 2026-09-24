import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'

describe('AuthStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('starts in guest mode by default', () => {
    const auth = useAuthStore()
    expect(auth.isAuthenticated).toBe(false)
    expect(auth.isGuest).toBe(true)
    expect(auth.role).toBe('guest')
    expect(auth.user).toBeNull()
  })

  it('handles logout properly', () => {
    const auth = useAuthStore()
    auth.token = 'dummy-token'
    auth.user = { id: 1, username: 'test', role: 'user' }
    expect(auth.isAuthenticated).toBe(true)

    auth.logout()
    expect(auth.isAuthenticated).toBe(false)
    expect(auth.isGuest).toBe(true)
    expect(auth.token).toBeNull()
    expect(auth.user).toBeNull()
  })
})
