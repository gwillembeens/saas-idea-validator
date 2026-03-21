import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { validateRoute } from './routes/validate.js'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.post('/api/validate', validateRoute)

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`)
})
