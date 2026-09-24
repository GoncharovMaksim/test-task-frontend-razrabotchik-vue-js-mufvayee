import { createApp } from './app'

const app = createApp()
const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`[BookCatalog Server] Ready at http://localhost:${PORT}`)
  console.log(`[BookCatalog Server] API v1 available at http://localhost:${PORT}/api/v1`)
})
