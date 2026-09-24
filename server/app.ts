import express, { type Express } from 'express'
import cors from 'cors'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createApiRouter } from './apiRouter'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export function createApp(): Express {
  const app = express()

  // Middlewares
  app.use(cors())
  app.use(express.json({ limit: '10mb' }))
  app.use(express.urlencoded({ extended: true, limit: '10mb' }))

  // Mount API router strictly under /api/v1
  const apiRouter = createApiRouter()
  app.use('/api/v1', apiRouter)

  // In production, serve built frontend assets
  const distPath = path.resolve(__dirname, '../dist')
  app.use(express.static(distPath))

  // SPA fallback for HTML5 History Mode
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next()
    }
    res.sendFile(path.join(distPath, 'index.html'), (err) => {
      if (err) {
        next()
      }
    })
  })

  return app
}
