import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import BookCard from '@/components/BookCard.vue'
import type { Book } from '@/types'

describe('BookCard Component', () => {
  const dummyBook: Book = {
    id: 42,
    title: 'Чистый код',
    year: 2023,
    description: 'Легендарная книга по качеству кода',
    isbn: '978-5-4461-0960-9',
    cover_url: '',
    authors: [{ id: 1, full_name: 'Роберт Мартин' }],
  }

  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div></div>' } },
      { path: '/books/:id', component: { template: '<div></div>' } },
      { path: '/books/:id/edit', component: { template: '<div></div>' } },
      { path: '/authors/:id', component: { template: '<div></div>' } },
    ],
  })

  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders book title, year, and authors correctly', async () => {
    const wrapper = mount(BookCard, {
      props: { book: dummyBook },
      global: {
        plugins: [router],
      },
    })

    expect(wrapper.text()).toContain('Чистый код')
    expect(wrapper.text()).toContain('2023')
    expect(wrapper.text()).toContain('Роберт Мартин')
    expect(wrapper.text()).toContain('978-5-4461-0960-9')
  })
})
