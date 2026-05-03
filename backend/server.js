import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { GoogleSpreadsheet } from 'google-spreadsheet'
import { JWT } from 'google-auth-library'
import { v4 as uuidv4 } from 'uuid'

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

// In-memory store for users (in production, use a database)
const users = new Map()

// Google Sheets setup
let sheet = null

async function initializeSheet() {
  try {
    const auth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    })

    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, auth)
    await doc.loadInfo()
    sheet = doc.sheetsByIndex[0]

    console.log('✓ Google Sheets connected')
  } catch (err) {
    console.log('⚠️ Google Sheets not configured. App will work without sheet sync.')
    console.log('Error:', err.message)
  }
}

async function logToSheet(name, action, timestamp) {
  if (!sheet) return
  try {
    await sheet.addRow({
      Name: name,
      Action: action,
      Timestamp: new Date(timestamp).toLocaleString(),
      'Date': new Date(timestamp).toLocaleDateString(),
    })
  } catch (err) {
    console.error('Sheet sync error:', err.message)
  }
}

// Routes
app.post('/api/login', (req, res) => {
  const { name, email } = req.body
  if (!name || !email) return res.status(400).json({ error: 'Name and email required' })

  let user = Array.from(users.values()).find(u => u.email === email)
  if (!user) {
    user = {
      id: uuidv4(),
      name,
      email,
      status: 'out',
      lastClockTime: null,
      entries: [],
    }
    users.set(user.id, user)
  }
  res.json(user)
})

app.post('/api/clock', async (req, res) => {
  const { userId, name } = req.body
  const user = users.get(userId)
  if (!user) return res.status(404).json({ error: 'User not found' })

  const now = new Date()
  const action = user.status === 'out' ? 'Clock In' : 'Clock Out'

  user.entries.push({
    name,
    action,
    timestamp: now,
  })

  user.status = user.status === 'out' ? 'in' : 'out'
  user.lastClockTime = now

  await logToSheet(name, action, now)
  res.json({ user })
})

app.get('/api/entries', (req, res) => {
  const { userId } = req.query
  const user = users.get(userId)
  if (!user) return res.status(404).json({ error: 'User not found' })

  const entries = user.entries.map(e => ({
    ...e,
    timestamp: e.timestamp.toISOString(),
  }))

  const today = new Date().toDateString()
  const todayEntries = entries.filter(e => new Date(e.timestamp).toDateString() === today)

  let todayHours = 0
  for (let i = 0; i < todayEntries.length; i += 2) {
    if (todayEntries[i + 1]) {
      const inTime = new Date(todayEntries[i].timestamp)
      const outTime = new Date(todayEntries[i + 1].timestamp)
      todayHours += (outTime - inTime) / (1000 * 60 * 60)
    }
  }

  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())
  const weekEntries = entries.filter(e => new Date(e.timestamp) >= weekStart)

  let weekHours = 0
  const daysWorked = new Set()
  for (let i = 0; i < weekEntries.length; i += 2) {
    if (weekEntries[i + 1]) {
      const inTime = new Date(weekEntries[i].timestamp)
      const outTime = new Date(weekEntries[i + 1].timestamp)
      weekHours += (outTime - inTime) / (1000 * 60 * 60)
      daysWorked.add(new Date(inTime).toDateString())
    }
  }

  res.json({
    entries: entries.reverse(),
    today: {
      hours: todayHours,
      sessions: Math.floor(todayEntries.length / 2),
    },
    weekly: {
      totalHours: weekHours,
      daysWorked: daysWorked.size,
    },
  })
})

app.delete('/api/entries/:index', async (req, res) => {
  const { userId } = req.query
  const { index } = req.params
  const user = users.get(userId)
  if (!user) return res.status(404).json({ error: 'User not found' })

  const entries = user.entries.sort((a, b) => b.timestamp - a.timestamp)
  const entry = entries[index]
  if (!entry) return res.status(404).json({ error: 'Entry not found' })

  user.entries = user.entries.filter(e => e !== entry)
  res.json({ success: true })
})

const PORT = process.env.PORT || 5000
app.listen(PORT, async () => {
  await initializeSheet()
  console.log(`Server running on port ${PORT}`)
})
