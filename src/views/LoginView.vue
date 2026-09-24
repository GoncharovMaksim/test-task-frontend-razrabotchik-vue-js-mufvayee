<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { LogIn, KeyRound, User as UserIcon, AlertCircle, Shield, Check } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notifications'

const router = useRouter()
const authStore = useAuthStore()
const notificationStore = useNotificationStore()

const username = ref('admin')
const password = ref('password')
const formError = ref('')

function fillDemoCredentials() {
  username.value = 'admin'
  password.value = 'password'
}

async function handleLogin() {
  if (!username.value || !password.value) {
    formError.value = 'Заполните имя пользователя и пароль'
    return
  }

  formError.value = ''
  const success = await authStore.login({
    username: username.value,
    password: password.value,
  })

  if (success) {
    notificationStore.success(`Добро пожаловать, ${authStore.user?.username}! Доступны права редактирования.`)
    router.push('/books')
  } else {
    formError.value = authStore.error || 'Неверные учётные данные'
  }
}
</script>

<template>
  <div class="max-w-md mx-auto py-8">
    <div class="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-xl backdrop-blur-md">
      <!-- Title -->
      <div class="text-center space-y-2 mb-6">
        <div class="w-12 h-12 rounded-xl bg-zinc-800 border border-zinc-700/80 text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
          <Shield class="w-6 h-6" />
        </div>
        <h1 class="text-xl font-bold text-zinc-100">
          Вход в систему
        </h1>
        <p class="text-xs text-zinc-400">
          Авторизация для получения прав добавления, редактирования и удаления книг (роль «Пользователь»).
        </p>
      </div>

      <!-- Quick credentials box -->
      <div class="mb-6 p-3 rounded-lg bg-zinc-950 border border-zinc-800/80 text-xs text-zinc-400 flex items-center justify-between">
        <div>
          <span class="text-zinc-300 font-medium">Демо доступ:</span>
          <div class="font-mono text-[11px] text-zinc-400 mt-0.5">
            Логин: <strong class="text-zinc-200">admin</strong> / Пароль: <strong class="text-zinc-200">password</strong>
          </div>
        </div>
        <button
          type="button"
          class="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] transition-colors"
          @click="fillDemoCredentials"
        >
          Подставить
        </button>
      </div>

      <!-- Login Form -->
      <form class="space-y-4" @submit.prevent="handleLogin">
        <div class="space-y-1.5">
          <label for="username" class="block text-xs font-medium text-zinc-300">
            Имя пользователя
          </label>
          <div class="relative">
            <UserIcon class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              id="username"
              v-model="username"
              type="text"
              required
              class="w-full pl-9 pr-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
            />
          </div>
        </div>

        <div class="space-y-1.5">
          <label for="password" class="block text-xs font-medium text-zinc-300">
            Пароль
          </label>
          <div class="relative">
            <KeyRound class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              id="password"
              v-model="password"
              type="password"
              required
              class="w-full pl-9 pr-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
            />
          </div>
        </div>

        <p v-if="formError" class="text-xs text-red-400 flex items-center gap-1.5 pt-1">
          <AlertCircle class="w-3.5 h-3.5 shrink-0" />
          <span>{{ formError }}</span>
        </p>

        <button
          type="submit"
          class="w-full mt-2 py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
          :disabled="authStore.loading"
        >
          <LogIn class="w-4 h-4" />
          <span>{{ authStore.loading ? 'Авторизация...' : 'Войти в панель' }}</span>
        </button>
      </form>

      <!-- Roles description -->
      <div class="mt-6 pt-6 border-t border-zinc-800 text-[11px] text-zinc-500 space-y-1.5">
        <div class="flex items-center gap-1.5 text-zinc-400 font-medium">
          <Check class="w-3 h-3 text-emerald-400" />
          <span>Гость: только просмотр каталога + подписка на автора</span>
        </div>
        <div class="flex items-center gap-1.5 text-zinc-400 font-medium">
          <Check class="w-3 h-3 text-emerald-400" />
          <span>Юзер: просмотр, добавление, редактирование, удаление</span>
        </div>
      </div>
    </div>
  </div>
</template>
