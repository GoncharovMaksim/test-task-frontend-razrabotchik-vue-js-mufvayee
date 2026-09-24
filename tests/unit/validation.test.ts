import { describe, it, expect } from 'vitest'
import {
  isValidIsbn,
  normalizePhone,
  isValidPhone,
  formatPhoneDisplay,
  isValidYear,
} from '@/utils/validation'

describe('Validation Utilities', () => {
  describe('isValidIsbn', () => {
    it('validates correct ISBN-10 with numeric check digit', () => {
      // 0-306-40615-2 is a valid ISBN-10
      expect(isValidIsbn('0-306-40615-2')).toBe(true)
      expect(isValidIsbn('0306406152')).toBe(true)
    })

    it('validates correct ISBN-10 with "X" check digit', () => {
      // 0-8044-2957-X is a valid ISBN-10 ending with X
      expect(isValidIsbn('0-8044-2957-X')).toBe(true)
      expect(isValidIsbn('080442957x')).toBe(true)
    })

    it('rejects invalid ISBN-10 check digit', () => {
      expect(isValidIsbn('0-306-40615-3')).toBe(false)
    })

    it('validates correct ISBN-13', () => {
      // 978-5-4461-0623-3 (Clean Architecture in Russian)
      expect(isValidIsbn('978-5-4461-0623-3')).toBe(true)
      expect(isValidIsbn('9785446106233')).toBe(true)
      // 978-0-13-235088-4 (Clean Code)
      expect(isValidIsbn('978-0-13-235088-4')).toBe(true)
    })

    it('rejects invalid ISBN-13 check digit', () => {
      expect(isValidIsbn('978-5-4461-0623-4')).toBe(false)
    })

    it('rejects malformed or empty inputs', () => {
      expect(isValidIsbn('')).toBe(false)
      expect(isValidIsbn('abc')).toBe(false)
      expect(isValidIsbn('123456789')).toBe(false) // 9 digits
      expect(isValidIsbn('12345678901234')).toBe(false) // 14 digits
    })
  })

  describe('Phone Utilities', () => {
    it('normalizes Russian phone numbers to 11 digits starting with 7', () => {
      expect(normalizePhone('+7 (903) 372-78-06')).toBe('79033727806')
      expect(normalizePhone('89033727806')).toBe('79033727806')
      expect(normalizePhone('9033727806')).toBe('79033727806')
    })

    it('validates Russian mobile numbers', () => {
      expect(isValidPhone('+7 (903) 372-78-06')).toBe(true)
      expect(isValidPhone('89991234567')).toBe(true)
      expect(isValidPhone('79110001122')).toBe(true)
      expect(isValidPhone('12345')).toBe(false)
      expect(isValidPhone('')).toBe(false)
    })

    it('formats phone for display in +7 (XXX) XXX-XX-XX format', () => {
      expect(formatPhoneDisplay('79033727806')).toBe('+7 (903) 372-78-06')
      expect(formatPhoneDisplay('+7 (903) 372-78-06')).toBe('+7 (903) 372-78-06')
    })
  })

  describe('isValidYear', () => {
    it('accepts reasonable publication years', () => {
      expect(isValidYear(2024)).toBe(true)
      expect(isValidYear(1999)).toBe(true)
      expect(isValidYear(1869)).toBe(true) // War and Peace
    })

    it('rejects out of range years or non-integers', () => {
      expect(isValidYear(500)).toBe(false)
      expect(isValidYear(2150)).toBe(false)
      expect(isValidYear(NaN)).toBe(false)
    })
  })
})
