<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { BellRing, X, Smartphone, CheckCircle2 } from 'lucide-vue-next'
import { isValidPhone, formatPhoneDisplay } from '@/utils/validation'
import { useSubscriptionsStore } from '@/stores/subscriptions'
import { useNotificationStore } from '@/stores/notifications'

const props = defineProps<{
  open: boolean
  authorId: number
  authorName: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'subscribed'): void
}>()

const subscriptionsStore = useSubscriptionsStore()
const notificationStore = useNotificationStore()

const phone = ref('')
const error = ref('')
const loading = ref(false)
const success = ref(false)

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      phone.value = ''
      error.value = ''
      success.value = false
    }
  }
)

function handleInput(e: Event) {
  const target = e.target as HTMLInputElement
  const raw = target.value
  phone.value = formatPhoneDisplay(raw)
  error.value = ''
}

async function handleSubmit() {
  if (!isValidPhone(phone.value)) {
    error.value = 'Введите корректный номер телефона РФ (+7 XXX XXX-XX-XX)'
    return
  }

  loading.value = true
  error.value = ''
  try {
    await subscriptionsStore.subscribe(props.authorId, phone.value)
    success.value = true
    notificationStore.success(`Подписка оформлена! Вы получите SMS при выходе новых книг автора.`)
    emit('subscribed')
    setTimeout(() => {
      emit('close')
    }, 1500)
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Не удалось оформить подписку'
  } finally {
    loading.value = false
  }
}

function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Escape' && props.open) {
    emit('close')
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="'subscribe-title'"
    >
      <div
        class="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-6"
      >
        <button
          type="button"
          class="absolute top-4 right-4 text-zinc-400 hover:text-zinc-200 transition-colors"
          aria-label="Закрыть"
          @click="emit('close')"
        >
          <X class="w-4 h-4" />
        </button>

        <div v-if="success" class="text-center py-4 space-y-3">
          <div class="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 class="w-6 h-6" />
          </div>
          <h3 class="text-base font-semibold text-zinc-100">Подписка активна</h3>
          <p class="text-sm text-zinc-400">
            На номер <span class="font-mono text-zinc-200">{{ phone }}</span> будут приходить уведомления о поступлении новых книг автора {{ authorName }}.
          </p>
        </div>

        <form v-else @submit.prevent="handleSubmit">
          <div class="flex items-start gap-3.5 mb-4">
            <div class="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <BellRing class="w-5 h-5" />
            </div>
            <div>
              <h3 id="subscribe-title" class="text-base font-semibold text-zinc-100">
                Подписка на автора
              </h3>
              <p class="text-xs text-zinc-400 mt-1 leading-relaxed">
                Получайте мгновенные SMS-уведомления через SMS Pilot при добавлении новых книг автора:
                <strong class="text-zinc-200">{{ authorName }}</strong>
              </p>
            </div>
          </div>

          <div class="mt-4 space-y-2">
            <label class="block text-xs font-medium text-zinc-300">
              Номер телефона (РФ)
            </label>
            <div class="relative">
              <Smartphone class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="tel"
                :value="phone"
                placeholder="+7 (999) 000-00-00"
                class="w-full pl-9 pr-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-colors font-mono"
                autocomplete="tel"
                @input="handleInput"
              />
            </div>
            <p v-if="error" class="text-xs text-red-400 mt-1">
              {{ error }}
            </p>
            <p class="text-[11px] text-zinc-500 mt-1">
              Для демонстрации подключен тестовый эмулятор SMS Pilot. Реальные средства со счёта не списываются.
            </p>
          </div>

          <div class="mt-6 flex justify-end gap-3">
            <button
              type="button"
              class="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 bg-zinc-800 hover:bg-zinc-700/80 rounded-lg transition-colors"
              :disabled="loading"
              @click="emit('close')"
            >
              Отмена
            </button>
            <button
              type="submit"
              class="px-4 py-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5"
              :disabled="loading || !phone"
            >
              <BellRing class="w-3.5 h-3.5" />
              {{ loading ? 'Оформление...' : 'Подписаться по SMS' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>
