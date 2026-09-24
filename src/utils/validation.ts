/**
 * ISBN validation supporting both ISBN-10 and ISBN-13 standards.
 * Cleans dashes, spaces, and validates official check digit algorithms.
 */
export function isValidIsbn(rawIsbn: string): boolean {
  if (!rawIsbn) return false

  const clean = rawIsbn.replace(/[-\s]/g, '').trim()

  if (clean.length === 10) {
    return isValidIsbn10(clean)
  }
  if (clean.length === 13) {
    return isValidIsbn13(clean)
  }
  return false
}

function isValidIsbn10(isbn: string): boolean {
  if (!/^\d{9}[\dX]$/i.test(isbn)) return false

  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += Number.parseInt(isbn[i], 10) * (10 - i)
  }

  const lastChar = isbn[9].toUpperCase()
  const checkDigit = lastChar === 'X' ? 10 : Number.parseInt(lastChar, 10)
  sum += checkDigit

  return sum % 11 === 0
}

function isValidIsbn13(isbn: string): boolean {
  if (!/^\d{13}$/.test(isbn)) return false

  let sum = 0
  for (let i = 0; i < 12; i++) {
    const digit = Number.parseInt(isbn[i], 10)
    sum += i % 2 === 0 ? digit : digit * 3
  }

  const checkDigit = (10 - (sum % 10)) % 10
  return checkDigit === Number.parseInt(isbn[12], 10)
}

/**
 * Normalizes phone number into international digit string: 79991234567
 */
export function normalizePhone(rawPhone: string): string {
  const digits = rawPhone.replace(/\D/g, '')
  if (digits.length === 11 && (digits.startsWith('8') || digits.startsWith('7'))) {
    return '7' + digits.slice(1)
  }
  if (digits.length === 10) {
    return '7' + digits
  }
  return digits
}

/**
 * Validates Russian / CIS 11-digit mobile phone numbers
 */
export function isValidPhone(rawPhone: string): boolean {
  if (!rawPhone) return false
  const normalized = normalizePhone(rawPhone)
  return /^7\d{10}$/.test(normalized)
}

/**
 * Formats phone number into +7 (XXX) XXX-XX-XX
 */
export function formatPhoneDisplay(rawPhone: string): string {
  const norm = normalizePhone(rawPhone)
  if (norm.length !== 11) return rawPhone

  const code = norm.slice(1, 4)
  const part1 = norm.slice(4, 7)
  const part2 = norm.slice(7, 9)
  const part3 = norm.slice(9, 11)

  return `+7 (${code}) ${part1}-${part2}-${part3}`
}

/**
 * Year validator
 */
export function isValidYear(year: number): boolean {
  if (!Number.isInteger(year)) return false
  const currentYear = new Date().getFullYear()
  return year >= 1000 && year <= currentYear + 10
}
