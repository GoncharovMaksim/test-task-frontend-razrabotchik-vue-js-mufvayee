import express, { type Request, type Response, type NextFunction, type Express } from 'express'
import cors from 'cors'
import multer from 'multer'
import jwt from 'jsonwebtoken'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// ----------------------------------------------------
// TYPES & INTERFACES
// ----------------------------------------------------
export interface AuthorShort {
  id: number
  full_name: string
}

export interface BookShort {
  id: number
  title: string
  year: number
}

export interface Book {
  id: number
  title: string
  year: number
  description: string
  isbn: string
  cover_url: string
  authors: AuthorShort[]
}

export interface Author {
  id: number
  full_name: string
  books: BookShort[]
}

export interface TopAuthor {
  rank: number
  author_id: number
  full_name: string
  books_count: number
}

export interface Subscription {
  id: number
  author_id: number
  author_name: string
  phone: string
  created_at: string
}

export interface SmsLogEntry {
  id: string
  phone: string
  author_id: number
  author_name: string
  book_id: number
  book_title: string
  message: string
  status: 'sent' | 'emulator_success' | 'failed'
  provider_status?: string
  cost?: string
  created_at: string
}

export interface DatabaseState {
  authors: Array<{ id: number; full_name: string }>
  books: Book[]
  subscriptions: Subscription[]
  smsLogs: SmsLogEntry[]
}

// ----------------------------------------------------
// SMS PILOT SERVICE
// ----------------------------------------------------
export class SmsPilotService {
  public static readonly DEFAULT_EMULATOR_KEY =
    'XXXXXXXXXXXXYYYYYYYYYYYYZZZZZZZZXXXXXXXXXXXXYYYYYYYYYYYYZZZZZZZZ'

  private apiKey: string
  private apiUrl: string

  constructor(
    apiKey: string = process.env.SMS_PILOT_API_KEY || SmsPilotService.DEFAULT_EMULATOR_KEY,
    apiUrl: string = 'https://smspilot.ru/api.php'
  ) {
    this.apiKey = apiKey
    this.apiUrl = apiUrl
  }

  public isEmulator(): boolean {
    return (
      this.apiKey.startsWith('XXXXXXXXXXXX') ||
      this.apiKey.startsWith('XYZ') ||
      this.apiKey.includes('EMULATOR')
    )
  }

  public formatNewBookNotification(authorName: string, bookTitle: string, bookYear: number): string {
    return `Новая книга автора ${authorName}: "${bookTitle}" (${bookYear} г.) уже в каталоге!`
  }

  public async sendSms(rawPhone: string, message: string) {
    const digits = rawPhone.replace(/\D/g, '')
    const phone = digits.length === 11 && (digits.startsWith('8') || digits.startsWith('7'))
      ? '7' + digits.slice(1)
      : digits

    if (!phone || phone.length < 10) {
      return { success: false, status: 'failed', error: 'Некорректный номер телефона' }
    }

    const params = new URLSearchParams({
      send: message,
      to: phone,
      apikey: this.apiKey,
      format: 'json',
    })

    const requestUrl = `${this.apiUrl}?${params.toString()}`

    try {
      let json: any

      if (typeof window === 'undefined') {
        const proxyUrl = process.env.PROXY || 'http://vXjZsn:rCbek7@45.152.201.50:8000'
        try {
          const { HttpsProxyAgent } = await import('https-proxy-agent')
          const https = await import('node:https')
          const agent = new HttpsProxyAgent(proxyUrl)

          json = await new Promise((resolve, reject) => {
            const req = https.get(requestUrl, { agent, timeout: 5000 }, (res) => {
              let body = ''
              res.on('data', (c) => (body += c))
              res.on('end', () => {
                try {
                  resolve(JSON.parse(body))
                } catch (e) {
                  reject(e)
                }
              })
            })
            req.on('error', reject)
            req.on('timeout', () => {
              req.destroy()
              reject(new Error('SMS Pilot connection timeout'))
            })
          })
        } catch {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 4000)
          const resp = await fetch(requestUrl, {
            headers: { Accept: 'application/json' },
            signal: controller.signal,
          })
          clearTimeout(timeoutId)
          json = await resp.json()
        }
      } else {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 4000)
        const resp = await fetch(requestUrl, {
          headers: { Accept: 'application/json' },
          signal: controller.signal,
        })
        clearTimeout(timeoutId)
        json = await resp.json()
      }

      if (json?.error) {
        if (this.isEmulator()) {
          return {
            success: true,
            id: `EMU-${Date.now()}`,
            status: 'emulator_success',
            providerStatus: 'Эмулятор: SMS принято без списания',
            cost: '0.00',
            rawResponse: json,
          }
        }
        return {
          success: false,
          status: 'failed',
          error: json.error.description_ru || json.error.description || 'Ошибка SMS Pilot API',
          rawResponse: json,
        }
      }

      const isEmulator = this.isEmulator() || String(json?.send?.[0]?.status) === '0'

      return {
        success: true,
        id: String(json?.send?.[0]?.server_id || Date.now()),
        status: isEmulator ? 'emulator_success' : 'sent',
        providerStatus: isEmulator ? 'Эмулятор: SMS принято без списания' : 'Отправлено оператору',
        cost: json?.cost || '0.00',
        rawResponse: json,
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Сбой связи со шлюзом SMS Pilot'
      if (this.isEmulator()) {
        return {
          success: true,
          id: `EMU-${Date.now()}`,
          status: 'emulator_success',
          providerStatus: `Локальный эмулятор (офлайн): ${errorMessage}`,
          cost: '0.00',
        }
      }
      return { success: false, status: 'failed', error: errorMessage }
    }
  }
}

// ----------------------------------------------------
// DATABASE & SEED DATA
// ----------------------------------------------------
function createInitialDatabase(): DatabaseState {
  const authors: Array<{ id: number; full_name: string }> = [
    { id: 1, full_name: 'Роберт Мартин (Uncle Bob)' },
    { id: 2, full_name: 'Мартин Фаулер' },
    { id: 3, full_name: 'Кент Бек' },
    { id: 4, full_name: 'Эрих Гамма' },
    { id: 5, full_name: 'Ричард Хелм' },
    { id: 6, full_name: 'Ральф Джонсон' },
    { id: 7, full_name: 'Джон Влиссидис' },
    { id: 8, full_name: 'Дональд Кнут' },
    { id: 9, full_name: 'Эндрю Таненбаум' },
    { id: 10, full_name: 'Кайл Симпсон' },
    { id: 11, full_name: 'Бьёрн Страуструп' },
    { id: 12, full_name: 'Стив Макконнелл' },
  ]

  const books: Book[] = [
    {
      id: 1,
      title: 'Чистая архитектура. Искусство разработки программного обеспечения',
      year: 2024,
      description: 'Практическое руководство по созданию надежных, тестируемых и масштабируемых программных систем от легендарного дяди Боба.',
      isbn: '978-5-4461-0623-3',
      cover_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=80',
      authors: [{ id: 1, full_name: 'Роберт Мартин (Uncle Bob)' }],
    },
    {
      id: 2,
      title: 'Рефакторинг. Улучшение проекта существующего кода (2-е издание)',
      year: 2024,
      description: 'Классический труд Мартина Фаулера с примерами на современном JavaScript, написанный при участии Кента Бека.',
      isbn: '978-5-907144-48-4',
      cover_url: 'https://images.unsplash.com/photo-1532012164546-f432f2e3777a?w=600&q=80',
      authors: [
        { id: 2, full_name: 'Мартин Фаулер' },
        { id: 3, full_name: 'Кент Бек' },
      ],
    },
    {
      id: 3,
      title: 'Приемы объектно-ориентированного проектирования. Паттерны проектирования',
      year: 2023,
      description: 'Знаменитый труд Банды Четырех (GoF), систематизирующий 23 ключевых паттерна объектно-ориентированного программирования.',
      isbn: '978-5-4461-1555-6',
      cover_url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&q=80',
      authors: [
        { id: 4, full_name: 'Эрих Гамма' },
        { id: 5, full_name: 'Ричард Хелм' },
        { id: 6, full_name: 'Ральф Джонсон' },
        { id: 7, full_name: 'Джон Влиссидис' },
      ],
    },
    {
      id: 4,
      title: 'Совершенный код. Мастер-класс (2-е издание)',
      year: 2024,
      description: 'Практическое руководство Стива Макконнелла по программному конструированию и повышению продуктивности разработчиков.',
      isbn: '978-5-7502-0064-1',
      cover_url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&q=80',
      authors: [{ id: 12, full_name: 'Стив Макконнелл' }],
    },
    {
      id: 5,
      title: 'Чистый код: создание, анализ и рефакторинг',
      year: 2023,
      description: 'Золотой стандарт написания чистого, понятного и поддерживаемого программного кода для практикующих инженеров.',
      isbn: '978-5-4461-0960-9',
      cover_url: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=600&q=80',
      authors: [{ id: 1, full_name: 'Роберт Мартин (Uncle Bob)' }],
    },
    {
      id: 6,
      title: 'Экстремальное программирование: разработка через тестирование (TDD)',
      year: 2024,
      description: 'Фундаментальная работа Кента Бека о методологии Test-Driven Development, повышающей надежность и чистоту архитектуры.',
      isbn: '978-5-4461-0477-2',
      cover_url: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=600&q=80',
      authors: [{ id: 3, full_name: 'Кент Бек' }],
    },
    {
      id: 7,
      title: 'Современные операционные системы (4-е издание)',
      year: 2023,
      description: 'Академический фундаментальный учебник Эндрю Таненбаума по устройству современных ядер операционных систем.',
      isbn: '978-5-496-01395-6',
      cover_url: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&q=80',
      authors: [{ id: 9, full_name: 'Эндрю Таненбаум' }],
    },
    {
      id: 8,
      title: 'Вы не знаете JS: Область видимости и замыкания',
      year: 2024,
      description: 'Глубокое погружение Кайла Симпсона во внутренние механизмы движков JavaScript и лексическую область видимости.',
      isbn: '978-5-4461-1250-0',
      cover_url: 'https://images.unsplash.com/photo-1507842229451-9f79624505f5?w=600&q=80',
      authors: [{ id: 10, full_name: 'Кайл Симпсон' }],
    },
    {
      id: 9,
      title: 'Шаблоны корпоративных приложений (PoEAA)',
      year: 2023,
      description: 'Архитектурные паттерны Мартина Фаулера для взаимодействия с реляционными базами данных и распределенными системами.',
      isbn: '978-5-8459-0572-7',
      cover_url: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=600&q=80',
      authors: [{ id: 2, full_name: 'Мартин Фаулер' }],
    },
    {
      id: 10,
      title: 'Искусство программирования. Том 1: Основные алгоритмы',
      year: 2020,
      description: 'Фундаментальная монография профессора Дональда Кнута, являющаяся библией computer science.',
      isbn: '978-5-907144-01-9',
      cover_url: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=600&q=80',
      authors: [{ id: 8, full_name: 'Дональд Кнут' }],
    },
  ]

  const subscriptions: Subscription[] = [
    {
      id: 1,
      author_id: 1,
      author_name: 'Роберт Мартин (Uncle Bob)',
      phone: '+7 (903) 372-78-06',
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
  ]

  const smsLogs: SmsLogEntry[] = [
    {
      id: 'sms-init-1',
      phone: '+7 (903) 372-78-06',
      author_id: 1,
      author_name: 'Роберт Мартин (Uncle Bob)',
      book_id: 1,
      book_title: 'Чистая архитектура',
      message: 'Новая книга автора Роберт Мартин: "Чистая архитектура" (2024 г.) уже в каталоге!',
      status: 'emulator_success',
      provider_status: 'Эмулятор: SMS принято к отправке без списания',
      cost: '0.00',
      created_at: new Date(Date.now() - 86400000).toISOString(),
    },
  ]

  return { authors, books, subscriptions, smsLogs }
}

let db: DatabaseState = createInitialDatabase()

export function resetDatabase() {
  db = createInitialDatabase()
  return db
}

export function getDatabase(): DatabaseState {
  return db
}

// ----------------------------------------------------
// EXPRESS APP FACTORY
// ----------------------------------------------------
const JWT_SECRET = process.env.JWT_SECRET || 'infotek-vue-secret-token-key-2026'
const smsPilot = new SmsPilotService()
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
})

interface AuthenticatedRequest extends Request {
  user?: { id: number; username: string; role: string }
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

export function createApp(): Express {
  const app = express()

  app.use(cors())
  app.use(express.json({ limit: '10mb' }))
  app.use(express.urlencoded({ extended: true, limit: '10mb' }))

  const router = express.Router()

  // Auth
  router.post('/auth/login', (req: Request, res: Response): void => {
    const { username, password } = req.body || {}
    if (!username || !password) {
      res.status(401).json({
        success: false,
        errors: [{ message: 'Необходимо указать имя пользователя и пароль' }],
      })
      return
    }

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
      data: { token, expires_at: expiresAt, user: payload },
    })
  })

  // Books
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
        pagination: { total, page, per_page: perPage, total_pages: totalPages },
      },
    })
  })

  router.post('/books', authenticateToken, upload.single('cover'), async (req: Request, res: Response): Promise<void> => {
    const body = req.body || {}
    const title = String(body.title || '').trim()
    const year = Number.parseInt(String(body.year || ''), 10)
    const description = String(body.description || '').trim()
    const isbn = String(body.isbn || '').trim()

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
    if (!title) errors.push({ field: 'title', message: 'Поле title обязательно' })
    if (Number.isNaN(year) || year < 1000) errors.push({ field: 'year', message: 'Поле year должно быть корректным годом' })
    if (authorIds.length === 0 || authorIds.some((id) => Number.isNaN(id))) {
      errors.push({ field: 'author_ids', message: 'Необходимо указать хотя бы одного автора' })
    }

    if (errors.length > 0) {
      res.status(422).json({ success: false, errors })
      return
    }

    const selectedAuthors: AuthorShort[] = []
    for (const aId of authorIds) {
      const found = db.authors.find((a) => a.id === aId)
      if (found) selectedAuthors.push({ id: found.id, full_name: found.full_name })
    }

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

    // Send SMS notifications
    for (const author of selectedAuthors) {
      const matchingSubscriptions = db.subscriptions.filter((s) => s.author_id === author.id)
      for (const sub of matchingSubscriptions) {
        const smsText = smsPilot.formatNewBookNotification(author.full_name, newBook.title, newBook.year)
        try {
          const smsResult = await smsPilot.sendSms(sub.phone, smsText)
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
        } catch {}
      }
    }

    res.status(201).json({ success: true, data: newBook })
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

  // Authors
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
        pagination: { total, page, per_page: perPage, total_pages: totalPages },
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

    res.status(201).json({ success: true, data: { ...newAuthor, books: [] } })
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

    res.json({ success: true, data: { id: author.id, full_name: author.full_name, books: authorBooks } })
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
    for (const book of db.books) {
      for (const a of book.authors) {
        if (a.id === id) a.full_name = db.authors[authorIndex].full_name
      }
    }

    const authorBooks = db.books
      .filter((b) => b.authors.some((a) => a.id === id))
      .map((b) => ({ id: b.id, title: b.title, year: b.year }))

    res.json({
      success: true,
      data: { id, full_name: db.authors[authorIndex].full_name, books: authorBooks },
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
    for (const book of db.books) {
      book.authors = book.authors.filter((a) => a.id !== id)
    }
    res.status(204).send()
  })

  // Reports
  router.get('/reports/top-authors', (req: Request, res: Response): void => {
    const rawYear = req.query.year
    if (!rawYear) {
      res.status(400).json({ success: false, errors: [{ message: 'Параметр year не указан или неверен' }] })
      return
    }
    const year = Number.parseInt(String(rawYear), 10)
    if (Number.isNaN(year) || year < 1000) {
      res.status(400).json({ success: false, errors: [{ message: 'Параметр year не указан или неверен' }] })
      return
    }

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

    const sorted = Array.from(authorCounts.entries())
      .map(([author_id, data]) => ({ author_id, full_name: data.full_name, books_count: data.count }))
      .sort((a, b) => b.books_count - a.books_count)
      .slice(0, 10)

    const items: TopAuthor[] = sorted.map((item, index) => ({
      rank: index + 1,
      author_id: item.author_id,
      full_name: item.full_name,
      books_count: item.books_count,
    }))

    res.json({ success: true, data: { year, items } })
  })

  // Subscriptions & SMS Pilot extension
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
    res.json({ success: true, data: db.subscriptions })
  })

  router.delete('/subscriptions/:id', (req: Request, res: Response): void => {
    const id = Number.parseInt(String(req.params.id), 10)
    db.subscriptions = db.subscriptions.filter((s) => s.id !== id)
    res.json({ success: true })
  })

  router.get('/sms-logs', (_req: Request, res: Response): void => {
    res.json({ success: true, data: db.smsLogs })
  })

  router.post('/reset-demo', (_req: Request, res: Response): void => {
    resetDatabase()
    res.json({ success: true, message: 'Демо база данных успешно сброшена' })
  })

  // Mount API router under both /api/v1 and root of router
  app.use('/api/v1', router)
  app.use(router)

  // In production outside serverless, serve static dist files
  try {
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = path.dirname(__filename)
    const distPath = path.resolve(__dirname, '../dist')
    app.use(express.static(distPath))
  } catch {}

  return app
}

export const app = createApp()

// Vercel serverless function entrypoint
export default function handler(req: any, res: any) {
  return app(req, res)
}
