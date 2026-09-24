import { describe, it, expect } from 'vitest'
import { SmsPilotService } from '@/services/smsPilot'

describe('SmsPilotService', () => {
  const service = new SmsPilotService()

  it('initializes with official test emulator key by default', () => {
    expect(service.getApiKey()).toBe(SmsPilotService.DEFAULT_EMULATOR_KEY)
    expect(service.isEmulator()).toBe(true)
  })

  it('formats new book notification message according to spec', () => {
    const text = service.formatNewBookNotification(
      'Роберт Мартин',
      'Чистая архитектура',
      2024
    )
    expect(text).toContain('Роберт Мартин')
    expect(text).toContain('Чистая архитектура')
    expect(text).toContain('2024 г.')
  })

  it('rejects invalid phone numbers with proper failure status', async () => {
    const res = await service.sendSms('invalid', 'Тестовое сообщение')
    expect(res.success).toBe(false)
    expect(res.status).toBe('failed')
    expect(res.error).toBe('Некорректный номер телефона')
  })

  it('dispatches emulator SMS and returns transaction metadata', async () => {
    const res = await service.sendSms('+7 (903) 372-78-06', 'Новая книга доступна!')
    expect(res.success).toBe(true)
    expect(res.status).toBe('emulator_success')
    expect(res.cost).toBeDefined()
    expect(res.id).toBeDefined()
  })
})
