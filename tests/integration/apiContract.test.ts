import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { createApp } from '../../server/app'
import { resetDatabase } from '../../server/apiRouter'

describe('API Contract & Server Integration Tests (Yii2 OpenAPI v1)', () => {
  const app = createApp()
  let authToken = ''

  beforeEach(async () => {
    resetDatabase()

    // Log in as user
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'admin', password: 'password' })

    expect(loginRes.status).toBe(200)
    expect(loginRes.body.success).toBe(true)
    authToken = loginRes.body.data.token
  })

  describe('Authentication (/api/v1/auth/login)', () => {
    it('returns access token for valid user credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ username: 'admin', password: 'password' })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.token).toBeDefined()
      expect(res.body.data.user.role).toBe('user')
    })

    it('rejects invalid or missing credentials with 401', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ username: '', password: '' })

      expect(res.status).toBe(401)
      expect(res.body.success).toBe(false)
      expect(res.body.errors).toBeDefined()
    })
  })

  describe('Books CRUD & RBAC (/api/v1/books)', () => {
    it('allows guests to read books list and pagination', async () => {
      const res = await request(app).get('/api/v1/books?page=1&per-page=5')
      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.items).toBeInstanceOf(Array)
      expect(res.body.data.items.length).toBeLessThanOrEqual(5)
      expect(res.body.data.pagination.page).toBe(1)
      expect(res.body.data.pagination.per_page).toBe(5)
    })

    it('filters books by year and search keyword', async () => {
      const res = await request(app).get('/api/v1/books?year=2024&search=Чистая')
      expect(res.status).toBe(200)
      expect(res.body.data.items.length).toBeGreaterThan(0)
      expect(res.body.data.items[0].year).toBe(2024)
      expect(res.body.data.items[0].title).toContain('Чистая')
    })

    it('denies unauthenticated guests from creating books (401)', async () => {
      const res = await request(app)
        .post('/api/v1/books')
        .send({
          title: 'Unauthorized Book',
          year: 2024,
          author_ids: [1],
        })

      expect(res.status).toBe(401)
      expect(res.body.success).toBe(false)
    })

    it('allows authenticated users to create a book and handles validation', async () => {
      // 1. Validation failure (missing title)
      const invalidRes = await request(app)
        .post('/api/v1/books')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ year: 2024, author_ids: [1] })

      expect(invalidRes.status).toBe(422)
      expect(invalidRes.body.success).toBe(false)

      // 2. Successful creation
      const validRes = await request(app)
        .post('/api/v1/books')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Новая тестовая книга',
          year: 2024,
          description: 'Описание книги для интеграционного теста',
          isbn: '978-5-4461-0623-3',
          author_ids: [1, 2],
        })

      expect(validRes.status).toBe(201)
      expect(validRes.body.success).toBe(true)
      expect(validRes.body.data.id).toBeDefined()
      expect(validRes.body.data.title).toBe('Новая тестовая книга')
      expect(validRes.body.data.authors.length).toBe(2)
    })

    it('updates and deletes a book with 204 response', async () => {
      // Create first
      const createRes = await request(app)
        .post('/api/v1/books')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Книга для удаления',
          year: 2024,
          author_ids: [1],
        })
      const bookId = createRes.body.data.id

      // Delete with token
      const deleteRes = await request(app)
        .delete(`/api/v1/books/${bookId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(deleteRes.status).toBe(204)

      // Verify not found
      const getRes = await request(app).get(`/api/v1/books/${bookId}`)
      expect(getRes.status).toBe(404)
    })
  })

  describe('Authors & Reports (/api/v1/authors & /api/v1/reports)', () => {
    it('returns authors list with pagination', async () => {
      const res = await request(app).get('/api/v1/authors?page=1&per-page=10')
      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.items.length).toBeGreaterThan(0)
    })

    it('creates and reads author by ID with their books', async () => {
      const createRes = await request(app)
        .post('/api/v1/authors')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ full_name: 'Фёдор Достоевский' })

      expect(createRes.status).toBe(201)
      const authorId = createRes.body.data.id

      const getRes = await request(app).get(`/api/v1/authors/${authorId}`)
      expect(getRes.status).toBe(200)
      expect(getRes.body.data.full_name).toBe('Фёдор Достоевский')
      expect(getRes.body.data.books).toBeInstanceOf(Array)
    })

    it('generates TOP-10 authors report for a specific year', async () => {
      const res = await request(app).get('/api/v1/reports/top-authors?year=2024')
      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.year).toBe(2024)
      expect(res.body.data.items).toBeInstanceOf(Array)

      // Ensure ranks are sequential: 1, 2, 3...
      const items = res.body.data.items
      if (items.length > 0) {
        expect(items[0].rank).toBe(1)
        expect(items[0].books_count).toBeGreaterThanOrEqual(1)
      }
    })

    it('rejects reports without year parameter (400)', async () => {
      const res = await request(app).get('/api/v1/reports/top-authors')
      expect(res.status).toBe(400)
      expect(res.body.success).toBe(false)
    })
  })

  describe('Guest Subscriptions & SMS Pilot Automated Notifications', () => {
    it('allows a guest to subscribe to an author by phone', async () => {
      const res = await request(app)
        .post('/api/v1/authors/2/subscribe')
        .send({ phone: '+7 (999) 111-22-33' })

      expect(res.status).toBe(201)
      expect(res.body.success).toBe(true)
      expect(res.body.data.author_id).toBe(2)
      expect(res.body.data.phone).toBe('+7 (999) 111-22-33')
    })

    it('triggers SMS notification when a user creates a new book for a subscribed author', async () => {
      // 1. Subscribe to Author 3 (Кент Бек)
      await request(app)
        .post('/api/v1/authors/3/subscribe')
        .send({ phone: '+7 (903) 372-78-06' })

      // 2. User creates a new book with Author 3
      const createRes = await request(app)
        .post('/api/v1/books')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'TDD на практике: Полное руководство',
          year: 2024,
          isbn: '978-5-4461-0477-2',
          author_ids: [3],
        })

      expect(createRes.status).toBe(201)

      // 3. Verify SMS log was recorded
      const logsRes = await request(app).get('/api/v1/sms-logs')
      expect(logsRes.status).toBe(200)
      expect(logsRes.body.data.length).toBeGreaterThan(0)

      const latestLog = logsRes.body.data[0]
      expect(latestLog.phone).toBe('+7 (903) 372-78-06')
      expect(latestLog.author_id).toBe(3)
      expect(latestLog.book_title).toBe('TDD на практике: Полное руководство')
      expect(latestLog.status).toBe('emulator_success')
      expect(latestLog.message).toContain('TDD на практике')
    })
  })
})
