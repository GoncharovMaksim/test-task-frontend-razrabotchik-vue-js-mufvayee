import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notifications'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/books',
  },
  {
    path: '/books',
    name: 'books',
    component: () => import('@/views/BooksCatalogView.vue'),
  },
  {
    path: '/books/create',
    name: 'book-create',
    component: () => import('@/views/BookFormView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/books/:id',
    name: 'book-detail',
    component: () => import('@/views/BookDetailView.vue'),
  },
  {
    path: '/books/:id/edit',
    name: 'book-edit',
    component: () => import('@/views/BookFormView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/authors',
    name: 'authors',
    component: () => import('@/views/AuthorsListView.vue'),
  },
  {
    path: '/authors/:id',
    name: 'author-detail',
    component: () => import('@/views/AuthorDetailView.vue'),
  },
  {
    path: '/reports/top-authors',
    name: 'top-authors-report',
    component: () => import('@/views/TopAuthorsReportView.vue'),
  },
  {
    path: '/subscriptions',
    name: 'subscriptions',
    component: () => import('@/views/SubscriptionsView.vue'),
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/books',
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore()
  const notificationStore = useNotificationStore()

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    notificationStore.info('Для выполнения этой операции требуется авторизация пользователя')
    next({ name: 'login', query: { redirect: to.fullPath } })
  } else {
    next()
  }
})
