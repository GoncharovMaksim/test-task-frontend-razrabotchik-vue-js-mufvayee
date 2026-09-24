import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface ToastNotification {
  id: string
  type: 'success' | 'error' | 'info'
  message: string
  duration?: number
}

export const useNotificationStore = defineStore('notifications', () => {
  const toasts = ref<ToastNotification[]>([])

  function show(message: string, type: 'success' | 'error' | 'info' = 'info', duration = 4000) {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const toast: ToastNotification = { id, type, message, duration }
    toasts.value.push(toast)

    if (duration > 0) {
      setTimeout(() => {
        dismiss(id)
      }, duration)
    }
    return id
  }

  function success(message: string, duration = 4000) {
    return show(message, 'success', duration)
  }

  function error(message: string, duration = 5000) {
    return show(message, 'error', duration)
  }

  function info(message: string, duration = 4000) {
    return show(message, 'info', duration)
  }

  function dismiss(id: string) {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  return {
    toasts,
    show,
    success,
    error,
    info,
    dismiss,
  }
})
