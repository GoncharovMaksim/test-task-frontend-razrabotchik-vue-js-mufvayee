import { defineStore } from 'pinia'
import { ref } from 'vue'
import { authorsApi } from '@/api/authors'
import { subscriptionsApi } from '@/api/subscriptions'
import type { Subscription, SmsLogEntry } from '@/types'

export const useSubscriptionsStore = defineStore('subscriptions', () => {
  const items = ref<Subscription[]>([])
  const smsLogs = ref<SmsLogEntry[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function subscribe(authorId: number, phone: string): Promise<Subscription> {
    loading.value = true
    error.value = null
    try {
      const res = await authorsApi.subscribe(authorId, phone)
      if (res.success && res.data) {
        items.value.unshift(res.data)
        return res.data
      }
      throw new Error(res.message || 'Не удалось оформить подписку')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ошибка оформления подписки'
      error.value = msg
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchSubscriptions(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const res = await subscriptionsApi.list()
      if (res.success && res.data) {
        items.value = res.data
      }
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Ошибка загрузки подписок'
    } finally {
      loading.value = false
    }
  }

  async function fetchSmsLogs(): Promise<void> {
    try {
      const res = await subscriptionsApi.getSmsLogs()
      if (res.success && res.data) {
        smsLogs.value = res.data
      }
    } catch {
      // non-critical background fetch
    }
  }

  async function deleteSubscription(id: number): Promise<void> {
    try {
      await subscriptionsApi.delete(id)
      items.value = items.value.filter((s) => s.id !== id)
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Ошибка удаления подписки'
      throw err
    }
  }

  return {
    items,
    smsLogs,
    loading,
    error,
    subscribe,
    fetchSubscriptions,
    fetchSmsLogs,
    deleteSubscription,
  }
})
