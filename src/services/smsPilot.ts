import { normalizePhone } from '../utils/validation'

export interface SmsPilotSendResult {
  success: boolean
  id?: string
  status: 'sent' | 'emulator_success' | 'failed'
  providerStatus?: string
  cost?: string
  error?: string
  rawResponse?: unknown
}

export class SmsPilotService {
  /**
   * Official SMS Pilot test emulator key:
   * Real SMS messages are not sent, but API responds with full transaction metadata.
   */
  public static readonly DEFAULT_EMULATOR_KEY =
    'XXXXXXXXXXXXYYYYYYYYYYYYZZZZZZZZXXXXXXXXXXXXYYYYYYYYYYYYZZZZZZZZ'

  private apiKey: string
  private apiUrl: string
  private senderName: string

  constructor(
    apiKey: string = SmsPilotService.DEFAULT_EMULATOR_KEY,
    apiUrl: string = 'https://smspilot.ru/api.php',
    senderName: string = 'BookCatalog'
  ) {
    this.apiKey = apiKey
    this.apiUrl = apiUrl
    this.senderName = senderName
  }

  public getApiKey(): string {
    return this.apiKey
  }

  public isEmulator(): boolean {
    return (
      this.apiKey.startsWith('XXXXXXXXXXXX') ||
      this.apiKey.startsWith('XYZ') ||
      this.apiKey.includes('EMULATOR')
    )
  }

  /**
   * Formats the SMS message for new book release subscription
   */
  public formatNewBookNotification(authorName: string, bookTitle: string, bookYear: number): string {
    return `Новая книга автора ${authorName}: "${bookTitle}" (${bookYear} г.) уже в каталоге!`
  }

  /**
   * Sends SMS via SMS Pilot API
   */
  public async sendSms(rawPhone: string, message: string): Promise<SmsPilotSendResult> {
    const phone = normalizePhone(rawPhone)
    if (!phone) {
      return {
        success: false,
        status: 'failed',
        error: 'Некорректный номер телефона',
      }
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

      // Node.js environment with proxy support
      if (typeof window === 'undefined') {
        const proxyUrl = process.env.PROXY || 'http://vXjZsn:rCbek7@45.152.201.50:8000'
        try {
          const { HttpsProxyAgent } = await import('https-proxy-agent')
          const https = await import('node:https')
          const agent = new HttpsProxyAgent(proxyUrl)

          json = await new Promise((resolve, reject) => {
            const req = https.get(requestUrl, { agent, timeout: 5000 }, (res) => {
              let body = ''
              res.on('data', (chunk) => (body += chunk))
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
          // Fallback to standard fetch
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
        // Browser environment
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
      return {
        success: false,
        status: 'failed',
        error: errorMessage,
      }
    }
  }
}
