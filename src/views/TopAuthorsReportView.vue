<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { BarChart3, Award, Calendar, Search } from 'lucide-vue-next'
import { useReportsStore } from '@/stores/reports'

const reportsStore = useReportsStore()

const inputYear = ref<number>(2024)
const quickYears = [2024, 2023, 2022, 2020]

onMounted(async () => {
  await reportsStore.fetchTopAuthors(inputYear.value)
})

function loadReport(year: number) {
  inputYear.value = year
  reportsStore.fetchTopAuthors(year)
}

function handleYearSubmit() {
  if (inputYear.value) {
    reportsStore.fetchTopAuthors(Number(inputYear.value))
  }
}

const maxBooksCount = computed(() => {
  if (reportsStore.items.length === 0) return 1
  return Math.max(...reportsStore.items.map((i) => i.books_count), 1)
})
</script>

<template>
  <div class="max-w-4xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-xl sm:text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
          <BarChart3 class="w-6 h-6 text-emerald-400" />
          <span>ТОП-10 Авторов по выпуску книг</span>
        </h1>
        <p class="text-xs sm:text-sm text-zinc-400 mt-1">
          Публичный аналитический отчёт об авторах, выпустивших наибольшее количество произведений за выбранный год.
        </p>
      </div>
    </div>

    <!-- Year filter and quick selectors -->
    <div class="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 sm:p-5">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <form class="flex items-center gap-2" @submit.prevent="handleYearSubmit">
          <div class="relative">
            <Calendar class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              v-model="inputYear"
              type="number"
              min="1900"
              max="2035"
              placeholder="Год"
              class="w-36 pl-9 pr-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-100 focus:outline-none focus:border-zinc-500"
            />
          </div>
          <button
            type="submit"
            class="px-3.5 py-2 bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
            :disabled="reportsStore.loading"
          >
            <Search class="w-3.5 h-3.5" />
            <span>Сформировать</span>
          </button>
        </form>

        <div class="flex items-center gap-1.5">
          <span class="text-xs text-zinc-500 mr-1">Быстрый выбор:</span>
          <button
            v-for="y in quickYears"
            :key="y"
            type="button"
            class="px-2.5 py-1 rounded-md text-xs font-mono transition-colors"
            :class="
              reportsStore.year === y
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold'
                : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
            "
            @click="loadReport(y)"
          >
            {{ y }}
          </button>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="reportsStore.loading" class="bg-zinc-900/40 border border-zinc-800 rounded-xl p-8 animate-pulse space-y-3">
      <div v-for="n in 5" :key="n" class="h-10 bg-zinc-800/50 rounded-lg"></div>
    </div>

    <!-- Error -->
    <div
      v-else-if="reportsStore.error"
      class="p-6 rounded-xl border border-red-500/20 bg-red-500/5 text-center text-xs text-red-300"
    >
      {{ reportsStore.error }}
    </div>

    <!-- Empty -->
    <div
      v-else-if="reportsStore.items.length === 0"
      class="p-12 text-center border border-dashed border-zinc-800 rounded-xl bg-zinc-950/40"
    >
      <Award class="w-10 h-10 text-zinc-600 mx-auto mb-3" />
      <h3 class="text-sm font-semibold text-zinc-200">Нет данных за {{ reportsStore.year }} год</h3>
      <p class="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
        В каталоге не найдено книг, выпущенных в {{ reportsStore.year }} году. Выберите другой год или добавьте книги в каталог.
      </p>
    </div>

    <!-- Report table / list -->
    <div v-else class="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
      <div class="p-4 border-b border-zinc-800/80 flex items-center justify-between">
        <h2 class="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Рейтинг авторов за {{ reportsStore.year }} год
        </h2>
        <span class="text-xs text-zinc-500 font-mono">
          Всего позиций: {{ reportsStore.items.length }}
        </span>
      </div>

      <div class="divide-y divide-zinc-800/80">
        <div
          v-for="item in reportsStore.items"
          :key="item.author_id"
          class="p-4 hover:bg-zinc-850/50 transition-colors flex items-center gap-4"
        >
          <!-- Rank badge -->
          <div
            class="w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-xs shrink-0"
            :class="{
              'bg-amber-500/20 text-amber-300 border border-amber-500/30': item.rank === 1,
              'bg-zinc-300/20 text-zinc-200 border border-zinc-400/30': item.rank === 2,
              'bg-amber-700/20 text-amber-500 border border-amber-700/30': item.rank === 3,
              'bg-zinc-800 text-zinc-400': item.rank > 3,
            }"
          >
            {{ item.rank }}
          </div>

          <!-- Author info & bar -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between gap-2 mb-1.5">
              <RouterLink
                :to="`/authors/${item.author_id}`"
                class="font-semibold text-sm text-zinc-200 hover:text-emerald-400 truncate transition-colors"
              >
                {{ item.full_name }}
              </RouterLink>
              <span class="text-xs font-mono font-medium text-emerald-400 shrink-0">
                {{ item.books_count }} {{ item.books_count === 1 ? 'книга' : item.books_count < 5 ? 'книги' : 'книг' }}
              </span>
            </div>

            <!-- Visual Progress Bar -->
            <div class="w-full bg-zinc-950 rounded-full h-1.5 overflow-hidden">
              <div
                class="bg-emerald-500 h-full rounded-full transition-all duration-500"
                :style="{ width: `${(item.books_count / maxBooksCount) * 100}%` }"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
