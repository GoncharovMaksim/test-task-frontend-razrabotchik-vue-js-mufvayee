<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { BookOpen, Users, BarChart3, BellRing, LogIn, LogOut, ShieldCheck, ShieldAlert } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notifications'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const notificationStore = useNotificationStore()

const currentPath = computed(() => route.path)

function handleLogout() {
  authStore.logout()
  notificationStore.info('Вы вышли из системы и перешли в режим Гостя')
  router.push('/books')
}
</script>

<template>
  <header class="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <!-- Logo and brand -->
        <div class="flex items-center gap-6">
          <RouterLink to="/books" class="flex items-center gap-2.5 group">
            <div class="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-zinc-100 group-hover:border-zinc-500 transition-colors">
              <BookOpen class="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <span class="text-sm font-semibold tracking-tight text-zinc-100 group-hover:text-white transition-colors">
                ИнфоТек Книги
              </span>
              <span class="hidden sm:inline-block ml-2 px-1.5 py-0.5 rounded text-[10px] font-mono bg-zinc-900 border border-zinc-800 text-zinc-400">
                Yii2 API v1
              </span>
            </div>
          </RouterLink>

          <!-- Nav Links -->
          <nav class="hidden md:flex items-center space-x-1" aria-label="Основная навигация">
            <RouterLink
              to="/books"
              class="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
              :class="
                currentPath.startsWith('/books')
                  ? 'bg-zinc-800 text-zinc-100'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              "
            >
              <BookOpen class="w-3.5 h-3.5" />
              Книги
            </RouterLink>

            <RouterLink
              to="/authors"
              class="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
              :class="
                currentPath.startsWith('/authors')
                  ? 'bg-zinc-800 text-zinc-100'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              "
            >
              <Users class="w-3.5 h-3.5" />
              Авторы
            </RouterLink>

            <RouterLink
              to="/reports/top-authors"
              class="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
              :class="
                currentPath.startsWith('/reports')
                  ? 'bg-zinc-800 text-zinc-100'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              "
            >
              <BarChart3 class="w-3.5 h-3.5" />
              ТОП-10 Авторов
            </RouterLink>

            <RouterLink
              to="/subscriptions"
              class="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
              :class="
                currentPath === '/subscriptions'
                  ? 'bg-zinc-800 text-zinc-100'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              "
            >
              <BellRing class="w-3.5 h-3.5" />
              Подписки & SMS
            </RouterLink>
          </nav>
        </div>

        <!-- Role / Auth controls -->
        <div class="flex items-center gap-3">
          <!-- Role status badge -->
          <div
            class="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border font-medium"
            :class="
              authStore.isAuthenticated
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400'
            "
          >
            <ShieldCheck v-if="authStore.isAuthenticated" class="w-3.5 h-3.5 text-emerald-400" />
            <ShieldAlert v-else class="w-3.5 h-3.5 text-zinc-400" />
            <span>
              {{ authStore.isAuthenticated ? `Пользователь: ${authStore.user?.username}` : 'Роль: Гость' }}
            </span>
          </div>

          <template v-if="authStore.isAuthenticated">
            <button
              type="button"
              class="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition-colors flex items-center gap-1.5"
              @click="handleLogout"
            >
              <LogOut class="w-3.5 h-3.5" />
              <span>Выйти</span>
            </button>
          </template>
          <template v-else>
            <RouterLink
              to="/login"
              class="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-100 bg-zinc-800 hover:bg-zinc-700/90 border border-zinc-700 transition-colors flex items-center gap-1.5"
            >
              <LogIn class="w-3.5 h-3.5" />
              <span>Вход (Юзер)</span>
            </RouterLink>
          </template>
        </div>
      </div>

      <!-- Mobile nav row -->
      <nav class="flex md:hidden items-center justify-around py-2 border-t border-zinc-900 text-xs" aria-label="Мобильная навигация">
        <RouterLink
          to="/books"
          class="px-2 py-1 rounded text-zinc-400"
          :class="{ 'text-zinc-100 font-semibold': currentPath.startsWith('/books') }"
        >
          Книги
        </RouterLink>
        <RouterLink
          to="/authors"
          class="px-2 py-1 rounded text-zinc-400"
          :class="{ 'text-zinc-100 font-semibold': currentPath.startsWith('/authors') }"
        >
          Авторы
        </RouterLink>
        <RouterLink
          to="/reports/top-authors"
          class="px-2 py-1 rounded text-zinc-400"
          :class="{ 'text-zinc-100 font-semibold': currentPath.startsWith('/reports') }"
        >
          ТОП-10
        </RouterLink>
        <RouterLink
          to="/subscriptions"
          class="px-2 py-1 rounded text-zinc-400"
          :class="{ 'text-zinc-100 font-semibold': currentPath === '/subscriptions' }"
        >
          Подписки
        </RouterLink>
      </nav>
    </div>
  </header>
</template>
