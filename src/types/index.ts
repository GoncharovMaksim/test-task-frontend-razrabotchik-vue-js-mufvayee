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

export interface BookInput {
  title: string
  year: number
  description?: string
  isbn?: string
  author_ids: number[]
  cover_url?: string
}

export interface AuthorInput {
  full_name: string
}

export interface Pagination {
  total: number
  page: number
  per_page: number
  total_pages: number
}

export interface BookListResponse {
  success: boolean
  data: {
    items: Book[]
    pagination: Pagination
  }
}

export interface AuthorListResponse {
  success: boolean
  data: {
    items: AuthorShort[]
    pagination: Pagination
  }
}

export interface BookResponse {
  success: boolean
  data: Book
}

export interface AuthorResponse {
  success: boolean
  data: Author
}

export interface TopAuthor {
  rank: number
  author_id: number
  full_name: string
  books_count: number
}

export interface TopAuthorsResponse {
  success: boolean
  data: {
    year: number
    items: TopAuthor[]
  }
}

export interface User {
  id: number
  username: string
  role: 'user'
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  success: boolean
  data: {
    token: string
    expires_at: string
    user: User
  }
}

export interface ErrorItem {
  field?: string
  message: string
}

export interface ErrorResponse {
  success: boolean
  errors: ErrorItem[]
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
