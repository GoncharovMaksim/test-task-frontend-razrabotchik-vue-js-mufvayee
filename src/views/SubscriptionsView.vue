<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { BellRing, Smartphone, MessageSquare, Trash2, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-vue-next'
import { useSubscriptionsStore } from '@/stores/subscriptions'
import { useNotificationStore } from '@/stores/notifications'

const subscriptionsStore = useSubscriptionsStore()
const notificationStore = useNotificationStore()

const activeTab = ref<'subscriptions' | 'logs'>('subscriptions')
const refreshing = ref(false)

onMounted(async () => {
  await Promise.all([
    subscriptionsStore.fetchSubscriptions(),
    subscriptionsStore.fetchSmsLogs(),
  ])
})

async function refreshData() {
  refreshing.value = true
  await Promise.all([
    subscriptionsStore.fetchSubscriptions(),
    subscriptionsStore.fetchSmsLogs(),
  ])
  refreshing.value = false
}

async function handleDelete(id: number) {
  try {
    await subscriptionsStore.deleteSubscription(id)
    notificationStore.success('Подписка отменена')
  } catch (err: unknown) {
    notificationStore.error(err instanceof Error ? err.message : 'Ошибка при отмене подписки')
  }
}
</script>

<template>
  <div class="max-w-4xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-xl sm:text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
          <BellRing class="w-6 h-6 text-emerald-400" />
          <span>Подписки и SMS-уведомления</span>
        </h1>
        <p class="text-xs sm:text-sm text-zinc-400 mt-1">
          Управление подписками гостей на авторов и журнал отправки SMS через шлюз SMS Pilot.
        </p>
      </div>

      <button
        type="button"
        class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-300 bg-zinc-800 hover:bg-zinc-700 transition-colors self-start sm:self-auto"
        :disabled="refreshing"
        @click="refreshData"
      >
        <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': refreshing }" />
        <span>Обновить данные</span>
      </button>
    </div>

    <!-- Tabs switcher -->
    <div class="flex items-center gap-2 border-b border-zinc-800 pb-2">
      <button
        type="button"
        class="px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2"
        :class="
          activeTab === 'subscriptions'
            ? 'bg-zinc-800 text-zinc-100'
            : 'text-zinc-400 hover:text-zinc-200'
        "
        @click="activeTab = 'subscriptions'"
      >
        <Smartphone class="w-4 h-4" />
        <span>Активные подписки ({{ subscriptionsStore.items.length }})</span>
      </button>

      <button
        type="button"
        class="px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2"
        :class="
          activeTab === 'logs'
            ? 'bg-zinc-800 text-zinc-100'
            : 'text-zinc-400 hover:text-zinc-200'
        "
        @click="activeTab = 'logs'"
      >
        <MessageSquare class="w-4 h-4" />
        <span>Журнал SMS Pilot ({{ subscriptionsStore.smsLogs.length }})</span>
      </button>
    </div>

    <!-- Subscriptions Tab Content -->
    <div v-if="activeTab === 'subscriptions'" class="space-y-4">
      <div
        v-if="subscriptionsStore.items.length === 0"
        class="p-12 text-center border border-dashed border-zinc-800 rounded-xl bg-zinc-950/40"
      >
        <Smartphone class="w-10 h-10 text-zinc-600 mx-auto mb-3" />
        <h3 class="text-sm font-semibold text-zinc-200">Подписок пока нет</h3>
        <p class="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
          Гости могут подписаться на любимых авторов в каталоге, чтобы получать SMS-уведомления при появлении новых книг.
        </p>
      </div>

      <div v-else class="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden shadow-sm divide-y divide-zinc-800/80">
        <div
          v-for="sub in subscriptionsStore.items"
          :key="sub.id"
          class="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-850/50 transition-colors"
        >
          <div>
            <div class="flex items-center gap-2">
              <span class="font-semibold text-sm text-zinc-200">{{ sub.author_name }}</span>
              <span class="px-2 py-0.5 rounded text-[11px] font-mono bg-zinc-800 text-zinc-400">
                #{{ sub.author_id }}
              </span>
            </div>
            <div class="mt-1 flex items-center gap-4 text-xs text-zinc-400 font-mono">
              <span class="text-emerald-400">{{ sub.phone }}</span>
              <span class="text-zinc-600">•</span>
              <span class="text-zinc-500">{{ new Date(sub.created_at).toLocaleString('ru-RU') }}</span>
            </div>
          </div>

          <button
            type="button"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-colors self-start sm:self-auto"
            @click="handleDelete(sub.id)"
          >
            <Trash2 class="w-3.5 h-3.5" />
            <span>Отписаться</span>
          </button>
        </div>
      </div>
    </div>

    <!-- SMS Logs Tab Content -->
    <div v-else class="space-y-4">
      <div
        v-if="subscriptionsStore.smsLogs.length === 0"
        class="p-12 text-center border border-dashed border-zinc-800 rounded-xl bg-zinc-950/40"
      >
        <MessageSquare class="w-10 h-10 text-zinc-600 mx-auto mb-3" />
        <h3 class="text-sm font-semibold text-zinc-200">Отправок SMS пока не зафиксировано</h3>
        <p class="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
          Создайте новую книгу для автора, у которого есть подписчики, и система автоматически отправит SMS через эмулятор SMS Pilot.
        </p>
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="log in subscriptionsStore.smsLogs"
          :key="log.id"
          class="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-2.5"
        >
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div class="flex items-center gap-2">
              <span
                class="px-2 py-0.5 rounded text-[11px] font-medium flex items-center gap-1"
                :class="
                  log.status === 'sent' || log.status === 'emulator_success'
                    ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
                    : 'bg-red-500/10 border border-red-500/20 text-red-300'
                "
              >
                <CheckCircle2 v-if="log.status !== 'failed'" class="w-3 h-3 text-emerald-400" />
                <AlertCircle v-else class="w-3 h-3 text-red-400" />
                <span>{{ log.status === 'emulator_success' ? 'SMS Pilot Эмулятор' : log.status === 'sent' ? 'SMS Доставлено' : 'Сбой' }}</span>
              </span>
              <span class="font-mono text-zinc-300">{{ log.phone }}</span>
            </div>
            <span class="text-zinc-500 font-mono text-[11px]">
              {{ new Date(log.created_at).toLocaleString('ru-RU') }}
            </span>
          </div>

          <div class="p-3 bg-zinc-950 rounded-lg border border-zinc-800 text-xs text-zinc-200 font-mono leading-relaxed">
            {{ log.message }}
          </div>

          <div class="flex items-center justify-between text-[11px] text-zinc-500">
            <span>Автор: <strong class="text-zinc-400">{{ log.author_name }}</strong> (книга «{{ log.book_title }}»)</span>
            <span v-if="log.provider_status" class="italic">{{ log.provider_status }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
