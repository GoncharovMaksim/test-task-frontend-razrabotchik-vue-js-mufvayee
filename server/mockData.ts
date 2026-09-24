import type { Book, Subscription, SmsLogEntry } from '../src/types'

export interface DatabaseState {
  authors: Array<{ id: number; full_name: string }>
  books: Book[]
  subscriptions: Subscription[]
  smsLogs: SmsLogEntry[]
}

export function createInitialDatabase(): DatabaseState {
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
      authors: [
        { id: 1, full_name: 'Роберт Мартин (Uncle Bob)' },
      ],
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
      authors: [
        { id: 12, full_name: 'Стив Макконнелл' },
      ],
    },
    {
      id: 5,
      title: 'Чистый код: создание, анализ и рефакторинг',
      year: 2023,
      description: 'Золотой стандарт написания чистого, понятного и поддерживаемого программного кода для практикующих инженеров.',
      isbn: '978-5-4461-0960-9',
      cover_url: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=600&q=80',
      authors: [
        { id: 1, full_name: 'Роберт Мартин (Uncle Bob)' },
      ],
    },
    {
      id: 6,
      title: 'Экстремальное программирование: разработка через тестирование (TDD)',
      year: 2024,
      description: 'Фундаментальная работа Кента Бека о методологии Test-Driven Development, повышающей надежность и чистоту архитектуры.',
      isbn: '978-5-4461-0477-2',
      cover_url: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=600&q=80',
      authors: [
        { id: 3, full_name: 'Кент Бек' },
      ],
    },
    {
      id: 7,
      title: 'Современные операционные системы (4-е издание)',
      year: 2023,
      description: 'Академический фундаментальный учебник Эндрю Таненбаума по устройству современных ядер операционных систем.',
      isbn: '978-5-496-01395-6',
      cover_url: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&q=80',
      authors: [
        { id: 9, full_name: 'Эндрю Таненбаум' },
      ],
    },
    {
      id: 8,
      title: 'Вы не знаете JS: Область видимости и замыкания',
      year: 2024,
      description: 'Глубокое погружение Кайла Симпсона во внутренние механизмы движков JavaScript и лексическую область видимости.',
      isbn: '978-5-4461-1250-0',
      cover_url: 'https://images.unsplash.com/photo-1507842229451-9f79624505f5?w=600&q=80',
      authors: [
        { id: 10, full_name: 'Кайл Симпсон' },
      ],
    },
    {
      id: 9,
      title: 'Шаблоны корпоративных приложений (PoEAA)',
      year: 2023,
      description: 'Архитектурные паттерны Мартина Фаулера для взаимодействия с реляционными базами данных и распределенными системами.',
      isbn: '978-5-8459-0572-7',
      cover_url: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=600&q=80',
      authors: [
        { id: 2, full_name: 'Мартин Фаулер' },
      ],
    },
    {
      id: 10,
      title: 'Искусство программирования. Том 1: Основные алгоритмы',
      year: 2020,
      description: 'Фундаментальная монография профессора Дональда Кнута, являющаяся библией computer science.',
      isbn: '978-5-907144-01-9',
      cover_url: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=600&q=80',
      authors: [
        { id: 8, full_name: 'Дональд Кнут' },
      ],
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

  return {
    authors,
    books,
    subscriptions,
    smsLogs,
  }
}
