import { apiClient } from './client'
import type { Subscription, SmsLogEntry } from '@/types'

export const subscriptionsApi = {
  list(): Promise<{ success: boolean; data: Subscription[] }> {
    return apiClient.get<{ success: boolean; data: Subscription[] }>('/subscriptions')
  },

  delete(id: number): Promise<{ success: boolean }> {
    return apiClient.delete<{ success: boolean }>(`/subscriptions/${id}`)
  },

  getSmsLogs(): Promise<{ success: boolean; data: SmsLogEntry[] }> {
    return apiClient.get<{ success: boolean; data: SmsLogEntry[] }>('/sms-logs')
  },
}
