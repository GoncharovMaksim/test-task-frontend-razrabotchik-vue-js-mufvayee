import { Router, type Request, type Response, type NextFunction } from 'express'
import multer from 'multer'
import jwt from 'jsonwebtoken'
import { createInitialDatabase, type DatabaseState } from './mockData'
import { SmsPilotService } from '../src/services/smsPilot'
import type { Book, Author, TopAuthor, Subscription, SmsLogEntry, AuthorShort } from '../src/types'

const JWT_SECRET = process.env.JWT_SECRET || 'infotek-vue-secret-token-key-2026'
const smsPilotService = new SmsPilotService(
  process.env.SMS_PILOT_API_KEY || SmsPilotService.DEFAULT_EMULATOR_KEY
)

// Multer memory storage for cover uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
})

// Database in-memory singleton
let db: DatabaseState = createInitialDatabase()

export function resetDatabase() {
  db = createInitialDatabase()
  return db
}

export function getDatabase(): DatabaseState {
  return db
}

// Authentication middleware
interface AuthenticatedRequest extends Request {
  user?: {
    id: number
    username: string
    role: string
  }
}

function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    res.status(401).json({
      success: false,
      errors: [{ message: 'Неавторизован. Требуется Bearer токен.' }],
    })
    return
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      res.status(403).json({
        success: false,
        errors: [{ message: 'Недействительный или истекший токен' }],
      })
      return
    }
    req.user = decoded as AuthenticatedRequest['user']
    next()
  })
}

export function createApiRouter(): Router {
  const router = Router()

  // ----------------------------------------------------
  // AUTH
  // ----------------------------------------------------
  router.post('/auth/login', (req: Request, res: Response): void => {
    const { username, password } = req.body || {}

    if (!username || !password) {
      res.status(401).json({
        success: false,
        errors: [{ message: 'Необходимо указать имя пользователя и пароль' }],
      })
      return
    }

    // Default admin / password or any credentials for user role
    const isValid = (username === 'admin' && password === 'password') || (username.length >= 2 && password.length >= 3)
    if (!isValid) {
      res.status(401).json({
        success: false,
        errors: [{ message: 'Неверные учётные данные' }],
      })
      return
    }

    const payload = { id: 1, username: String(username), role: 'user' }
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
    const expiresAt = new Date(Date.now() + 7 * 86400000).toISOString()

    res.json({
      success: true,
      data: {
        token,
        expires_at: expiresAt,
        user: payload,
      },
    })
  })

  // ----------------------------------------------------
  // BOOKS
  // ----------------------------------------------------
  router.get('/books', (req: Request, res: Response): void => {
    const page = Math.max(1, Number.parseInt(String(req.query.page || '1'), 10))
    const perPage = Math.max(1, Math.min(100, Number.parseInt(String(req.query['per-page'] || '20'), 10)))
    const authorId = req.query.author_id ? Number.parseInt(String(req.query.author_id), 10) : undefined
    const year = req.query.year ? Number.parseInt(String(req.query.year), 10) : undefined
    const search = req.query.search ? String(req.query.search).trim().toLowerCase() : ''

    let filtered = [...db.books]

    if (search) {
      filtered = filtered.filter(
        (b) =>
          b.title.toLowerCase().includes(search) ||
          b.description.toLowerCase().includes(search) ||
          (b.isbn && b.isbn.toLowerCase().includes(search))
      )
    }

    if (authorId !== undefined && !Number.isNaN(authorId)) {
      filtered = filtered.filter((b) => b.authors.some((a) => a.id === authorId))
    }

    if (year !== undefined && !Number.isNaN(year)) {
      filtered = filtered.filter((b) => b.year === year)
    }

    const total = filtered.length
    const totalPages = Math.ceil(total / perPage) || 1
    const startIndex = (page - 1) * perPage
    const items = filtered.slice(startIndex, startIndex + perPage)

    res.json({
      success: true,
      data: {
        items,
        pagination: {
          total,
          page,
          per_page: perPage,
          total_pages: totalPages,
        },
      },
    })
  })

  router.post('/books', authenticateToken, upload.single('cover'), async (req: Request, res: Response): Promise<void> => {
    const body = req.body || {}
    const title = String(body.title || '').trim()
    const year = Number.parseInt(String(body.year || ''), 10)
    const description = String(body.description || '').trim()
    const isbn = String(body.isbn || '').trim()

    // Parse author_ids (can be array or multiple form fields or JSON)
    let authorIds: number[] = []
    if (Array.isArray(body.author_ids)) {
      authorIds = body.author_ids.map((id: string | number) => Number.parseInt(String(id), 10))
    } else if (Array.isArray(body['author_ids[]'])) {
      authorIds = body['author_ids[]'].map((id: string | number) => Number.parseInt(String(id), 10))
    } else if (body.author_ids !== undefined) {
      authorIds = [Number.parseInt(String(body.author_ids), 10)]
    } else if (body['author_ids[]'] !== undefined) {
      authorIds = [Number.parseInt(String(body['author_ids[]']), 10)]
    }

    const errors: Array<{ field?: string; message: string }> = []
    if (!title) {
      errors.push({ field: 'title', message: 'Поле title обязательно' })
    }
    if (Number.isNaN(year) || year < 1000) {
      errors.push({ field: 'year', message: 'Поле year должно быть корректным годом' })
    }
    if (authorIds.length === 0 || authorIds.some((id) => Number.isNaN(id))) {
      errors.push({ field: 'author_ids', message: 'Необходимо указать хотя бы одного автора' })
    }

    if (errors.length > 0) {
      res.status(422).json({ success: false, errors })
      return
    }

    // Resolve authors
    const selectedAuthors: AuthorShort[] = []
    for (const aId of authorIds) {
      const found = db.authors.find((a) => a.id === aId)
      if (found) {
        selectedAuthors.push({ id: found.id, full_name: found.full_name })
      }
    }

    // Cover handling
    let coverUrl = String(body.cover_url || '')
    if (req.file) {
      const base64 = req.file.buffer.toString('base64')
      coverUrl = `data:${req.file.mimetype};base64,${base64}`
    } else if (!coverUrl) {
      coverUrl = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=80'
    }

    const nextId = db.books.length > 0 ? Math.max(...db.books.map((b) => b.id)) + 1 : 1
    const newBook: Book = {
      id: nextId,
      title,
      year,
      description,
      isbn,
      cover_url: coverUrl,
      authors: selectedAuthors,
    }

    db.books.unshift(newBook)

    // Trigger SMS notification for subscribers of these authors
    for (const author of selectedAuthors) {
      const matchingSubscriptions = db.subscriptions.filter((s) => s.author_id === author.id)
      for (const sub of matchingSubscriptions) {
        const smsText = smsPilotService.formatNewBookNotification(author.full_name, newBook.title, newBook.year)
        try {
          const smsResult = await smsPilotService.sendSms(sub.phone, smsText)
          const logEntry: SmsLogEntry = {
            id: `sms-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            phone: sub.phone,
            author_id: author.id,
            author_name: author.full_name,
            book_id: newBook.id,
            book_title: newBook.title,
            message: smsText,
            status: smsResult.status,
            provider_status: smsResult.providerStatus || (smsResult.success ? 'Эмулятор: SMS доставлено' : 'Ошибка'),
            cost: smsResult.cost || '0.00',
            created_at: new Date().toISOString(),
          }
          db.smsLogs.unshift(logEntry)
        } catch {
          // Non-blocking for book creation
        }
      }
    }

    res.status(201).json({
      success: true,
      data: newBook,
    })
  })

  router.get('/books/:id', (req: Request, res: Response): void => {
    const id = Number.parseInt(String(req.params.id), 10)
    const book = db.books.find((b) => b.id === id)
    if (!book) {
      res.status(404).json({ success: false, errors: [{ message: 'Книга не найдена' }] })
      return
    }
    res.json({ success: true, data: book })
  })

  router.put('/books/:id', authenticateToken, upload.single('cover'), (req: Request, res: Response): void => {
    const id = Number.parseInt(String(req.params.id), 10)
    const bookIndex = db.books.findIndex((b) => b.id === id)
    if (bookIndex === -1) {
      res.status(404).json({ success: false, errors: [{ message: 'Книга не найдена' }] })
      return
    }

    const body = req.body || {}
    const title = String(body.title || '').trim()
    const year = Number.parseInt(String(body.year || ''), 10)
    const description = String(body.description || '').trim()
    const isbn = String(body.isbn || '').trim()

    let authorIds: number[] = []
    if (Array.isArray(body.author_ids)) {
      authorIds = body.author_ids.map((aId: string | number) => Number.parseInt(String(aId), 10))
    } else if (Array.isArray(body['author_ids[]'])) {
      authorIds = body['author_ids[]'].map((aId: string | number) => Number.parseInt(String(aId), 10))
    } else if (body.author_ids !== undefined) {
      authorIds = [Number.parseInt(String(body.author_ids), 10)]
    } else if (body['author_ids[]'] !== undefined) {
      authorIds = [Number.parseInt(String(body['author_ids[]']), 10)]
    }

    const errors: Array<{ field?: string; message: string }> = []
    if (!title) errors.push({ field: 'title', message: 'Поле title обязательно' })
    if (Number.isNaN(year) || year < 1000) errors.push({ field: 'year', message: 'Поле year должно быть корректным' })
    if (authorIds.length === 0) errors.push({ field: 'author_ids', message: 'Укажите авторов' })

    if (errors.length > 0) {
      res.status(422).json({ success: false, errors })
      return
    }

    const selectedAuthors: AuthorShort[] = []
    for (const aId of authorIds) {
      const found = db.authors.find((a) => a.id === aId)
      if (found) selectedAuthors.push({ id: found.id, full_name: found.full_name })
    }

    let coverUrl = db.books[bookIndex].cover_url
    if (req.file) {
      const base64 = req.file.buffer.toString('base64')
      coverUrl = `data:${req.file.mimetype};base64,${base64}`
    } else if (body.cover_url) {
      coverUrl = String(body.cover_url)
    }

    const updated: Book = {
      ...db.books[bookIndex],
      title,
      year,
      description,
      isbn,
      cover_url: coverUrl,
      authors: selectedAuthors,
    }

    db.books[bookIndex] = updated
    res.json({ success: true, data: updated })
  })

  router.patch('/books/:id', authenticateToken, (req: Request, res: Response): void => {
    const id = Number.parseInt(String(req.params.id), 10)
    const bookIndex = db.books.findIndex((b) => b.id === id)
    if (bookIndex === -1) {
      res.status(404).json({ success: false, errors: [{ message: 'Книга не найдена' }] })
      return
    }

    const current = db.books[bookIndex]
    const body = req.body || {}

    let authors = current.authors
    if (Array.isArray(body.author_ids)) {
      authors = body.author_ids
        .map((aId: number) => db.authors.find((a) => a.id === aId))
        .filter((a: { id: number; full_name: string } | undefined): a is { id: number; full_name: string } => !!a)
    }

    const updated: Book = {
      ...current,
      title: body.title !== undefined ? String(body.title).trim() : current.title,
      year: body.year !== undefined ? Number.parseInt(String(body.year), 10) : current.year,
      description: body.description !== undefined ? String(body.description).trim() : current.description,
      isbn: body.isbn !== undefined ? String(body.isbn).trim() : current.isbn,
      cover_url: body.cover_url !== undefined ? String(body.cover_url) : current.cover_url,
      authors,
    }

    db.books[bookIndex] = updated
    res.json({ success: true, data: updated })
  })

  router.delete('/books/:id', authenticateToken, (req: Request, res: Response): void => {
    const id = Number.parseInt(String(req.params.id), 10)
    const initialLength = db.books.length
    db.books = db.books.filter((b) => b.id !== id)

    if (db.books.length === initialLength) {
      res.status(404).json({ success: false, errors: [{ message: 'Книга не найдена' }] })
      return
    }

    res.status(204).send()
  })

  // ----------------------------------------------------
  // AUTHORS
  // ----------------------------------------------------
  router.get('/authors', (req: Request, res: Response): void => {
    const page = Math.max(1, Number.parseInt(String(req.query.page || '1'), 10))
    const perPage = Math.max(1, Math.min(100, Number.parseInt(String(req.query['per-page'] || '20'), 10)))
    const search = req.query.search ? String(req.query.search).trim().toLowerCase() : ''

    let filtered = [...db.authors]
    if (search) {
      filtered = filtered.filter((a) => a.full_name.toLowerCase().includes(search))
    }

    const total = filtered.length
    const totalPages = Math.ceil(total / perPage) || 1
    const startIndex = (page - 1) * perPage
    const items = filtered.slice(startIndex, startIndex + perPage)

    res.json({
      success: true,
      data: {
        items,
        pagination: {
          total,
          page,
          per_page: perPage,
          total_pages: totalPages,
        },
      },
    })
  })

  router.post('/authors', authenticateToken, (req: Request, res: Response): void => {
    const { full_name } = req.body || {}
    if (!full_name || !String(full_name).trim()) {
      res.status(422).json({
        success: false,
        errors: [{ field: 'full_name', message: 'Поле full_name обязательно для заполнения' }],
      })
      return
    }

    const nextId = db.authors.length > 0 ? Math.max(...db.authors.map((a) => a.id)) + 1 : 1
    const newAuthor = { id: nextId, full_name: String(full_name).trim() }
    db.authors.push(newAuthor)

    const responseAuthor: Author = {
      ...newAuthor,
      books: [],
    }

    res.status(201).json({ success: true, data: responseAuthor })
  })

  router.get('/authors/:id', (req: Request, res: Response): void => {
    const id = Number.parseInt(String(req.params.id), 10)
    const author = db.authors.find((a) => a.id === id)
    if (!author) {
      res.status(404).json({ success: false, errors: [{ message: 'Автор не найден' }] })
      return
    }

    const authorBooks = db.books
      .filter((b) => b.authors.some((a) => a.id === id))
      .map((b) => ({ id: b.id, title: b.title, year: b.year }))

    const result: Author = {
      id: author.id,
      full_name: author.full_name,
      books: authorBooks,
    }

    res.json({ success: true, data: result })
  })

  router.put('/authors/:id', authenticateToken, (req: Request, res: Response): void => {
    const id = Number.parseInt(String(req.params.id), 10)
    const authorIndex = db.authors.findIndex((a) => a.id === id)
    if (authorIndex === -1) {
      res.status(404).json({ success: false, errors: [{ message: 'Автор не найден' }] })
      return
    }

    const { full_name } = req.body || {}
    if (!full_name || !String(full_name).trim()) {
      res.status(422).json({
        success: false,
        errors: [{ field: 'full_name', message: 'Поле full_name обязательно' }],
      })
      return
    }

    db.authors[authorIndex].full_name = String(full_name).trim()

    // Also update author name in books
    for (const book of db.books) {
      for (const a of book.authors) {
        if (a.id === id) {
          a.full_name = db.authors[authorIndex].full_name
        }
      }
    }

    const authorBooks = db.books
      .filter((b) => b.authors.some((a) => a.id === id))
      .map((b) => ({ id: b.id, title: b.title, year: b.year }))

    res.json({
      success: true,
      data: {
        id,
        full_name: db.authors[authorIndex].full_name,
        books: authorBooks,
      },
    })
  })

  router.delete('/authors/:id', authenticateToken, (req: Request, res: Response): void => {
    const id = Number.parseInt(String(req.params.id), 10)
    const initialLength = db.authors.length
    db.authors = db.authors.filter((a) => a.id !== id)

    if (db.authors.length === initialLength) {
      res.status(404).json({ success: false, errors: [{ message: 'Автор не найден' }] })
      return
    }

    // Also remove from books author lists
    for (const book of db.books) {
      book.authors = book.authors.filter((a) => a.id !== id)
    }

    res.status(204).send()
  })

  // ----------------------------------------------------
  // REPORTS
  // ----------------------------------------------------
  router.get('/reports/top-authors', (req: Request, res: Response): void => {
    const rawYear = req.query.year
    if (!rawYear) {
      res.status(400).json({
        success: false,
        errors: [{ message: 'Параметр year не указан или неверен' }],
      })
      return
    }

    const year = Number.parseInt(String(rawYear), 10)
    if (Number.isNaN(year) || year < 1000) {
      res.status(400).json({
        success: false,
        errors: [{ message: 'Параметр year не указан или неверен' }],
      })
      return
    }

    // Count books for each author in this specific year
    const authorCounts = new Map<number, { full_name: string; count: number }>()

    for (const book of db.books) {
      if (book.year === year) {
        for (const author of book.authors) {
          const current = authorCounts.get(author.id) || { full_name: author.full_name, count: 0 }
          current.count += 1
          authorCounts.set(author.id, current)
        }
      }
    }

    // Convert map to array and sort descending by count
    const sorted = Array.from(authorCounts.entries())
      .map(([author_id, data]) => ({
        author_id,
        full_name: data.full_name,
        books_count: data.count,
      }))
      .sort((a, b) => b.books_count - a.books_count)
      .slice(0, 10)

    const items: TopAuthor[] = sorted.map((item, index) => ({
      rank: index + 1,
      author_id: item.author_id,
      full_name: item.full_name,
      books_count: item.books_count,
    }))

    res.json({
      success: true,
      data: {
        year,
        items,
      },
    })
  })

  // ----------------------------------------------------
  // SUBSCRIPTIONS & SMS PILOT EXTENSION
  // ----------------------------------------------------
  router.post('/authors/:id/subscribe', (req: Request, res: Response): void => {
    const authorId = Number.parseInt(String(req.params.id), 10)
    const author = db.authors.find((a) => a.id === authorId)

    if (!author) {
      res.status(404).json({ success: false, errors: [{ message: 'Автор не найден' }] })
      return
    }

    const { phone } = req.body || {}
    if (!phone) {
      res.status(422).json({ success: false, errors: [{ field: 'phone', message: 'Номер телефона обязателен' }] })
      return
    }

    const nextId = db.subscriptions.length > 0 ? Math.max(...db.subscriptions.map((s) => s.id)) + 1 : 1
    const subscription: Subscription = {
      id: nextId,
      author_id: authorId,
      author_name: author.full_name,
      phone: String(phone),
      created_at: new Date().toISOString(),
    }

    db.subscriptions.unshift(subscription)

    res.status(201).json({
      success: true,
      data: subscription,
      message: 'Подписка успешно оформлена',
    })
  })

  router.get('/subscriptions', (_req: Request, res: Response): void => {
    res.json({
      success: true,
      data: db.subscriptions,
    })
  })

  router.delete('/subscriptions/:id', (req: Request, res: Response): void => {
    const id = Number.parseInt(String(req.params.id), 10)
    db.subscriptions = db.subscriptions.filter((s) => s.id !== id)
    res.json({ success: true })
  })

  router.get('/sms-logs', (_req: Request, res: Response): void => {
    res.json({
      success: true,
      data: db.smsLogs,
    })
  })

  router.post('/reset-demo', (_req: Request, res: Response): void => {
    resetDatabase()
    res.json({ success: true, message: 'Демо база данных успешно сброшена' })
  })

  return router
}
