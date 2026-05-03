import { useState, useEffect } from 'react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

function formatTime(decimalHours) {
  const hours = Math.floor(decimalHours)
  const minutes = Math.round((decimalHours - hours) * 60)
  return `${hours}h ${minutes}m`
}

export default function App() {
  const [user, setUser] = useState(null)
  const [entries, setEntries] = useState([])
  const [todaySummary, setTodaySummary] = useState(null)
  const [weeklySummary, setWeeklySummary] = useState(null)
  const [view, setView] = useState('tracker') // tracker, history, weekly
  const [theme, setTheme] = useState('light')

  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (stored) setUser(JSON.parse(stored))
    const storedTheme = localStorage.getItem('theme') || 'light'
    setTheme(storedTheme)
    document.documentElement.setAttribute('data-theme', storedTheme)
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    document.documentElement.setAttribute('data-theme', newTheme)
  }

  useEffect(() => {
    if (user) {
      fetchEntries()
      const interval = setInterval(fetchEntries, 5000)
      return () => clearInterval(interval)
    }
  }, [user])

  const login = async (name, email) => {
    try {
      const res = await axios.post(`${API_URL}/login`, { name, email })
      setUser(res.data)
      localStorage.setItem('user', JSON.stringify(res.data))
    } catch (err) {
      console.error('Login error details:', err)
      const errorMsg = err.response?.data?.error || err.message || 'Unknown error'
      alert('Login failed: ' + errorMsg)
    }
  }

  const clockInOut = async () => {
    try {
      const res = await axios.post(`${API_URL}/clock`, {
        userId: user.id,
        name: user.name
      })
      setUser(res.data.user)
      fetchEntries()
    } catch (err) {
      alert('Error: ' + err.response?.data?.error)
    }
  }

  const fetchEntries = async () => {
    try {
      const res = await axios.get(`${API_URL}/entries`, {
        params: { userId: user?.id }
      })
      setEntries(res.data.entries || [])
      setTodaySummary(res.data.today)
      setWeeklySummary(res.data.weekly)
    } catch (err) {
      console.error('Fetch error:', err)
    }
  }

  const deleteEntry = async (index) => {
    try {
      await axios.delete(`${API_URL}/entries/${index}`, {
        params: { userId: user?.id }
      })
      fetchEntries()
    } catch (err) {
      alert('Delete failed: ' + err.response?.data?.error)
    }
  }

  if (!user) {
    return <LoginForm onLogin={login} />
  }

  return (
    <div className="app">
      <header>
        <h1>⏱️ Time Tracker</h1>
        <div className="user-info">
          <span>{user.name}</span>
          <button className="theme-btn" onClick={toggleTheme} title="Toggle theme">
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          <button onClick={() => { setUser(null); localStorage.clear() }}>Logout</button>
        </div>
      </header>

      <div className="tabs">
        <button className={view === 'tracker' ? 'active' : ''} onClick={() => setView('tracker')}>Tracker</button>
        <button className={view === 'weekly' ? 'active' : ''} onClick={() => setView('weekly')}>Weekly</button>
        <button className={view === 'history' ? 'active' : ''} onClick={() => setView('history')}>History</button>
      </div>

      {view === 'tracker' && (
        <div className="tracker-section">
          <div className="status-card">
            <h2>{user.status === 'in' ? '✅ Clocked In' : '❌ Clocked Out'}</h2>
            <p className="status-time">{user.lastClockTime && new Date(user.lastClockTime).toLocaleTimeString()}</p>
          </div>

          <button className="clock-btn" onClick={clockInOut}>
            {user.status === 'in' ? 'Clock Out' : 'Clock In'}
          </button>

          {todaySummary && weeklySummary && (
            <div className="stats-grid">
              <div className="stat-card">
                <h4>Today</h4>
                <p className="stat-value">{formatTime(todaySummary.hours)}</p>
                <p className="stat-label">{todaySummary.sessions} session{todaySummary.sessions !== 1 ? 's' : ''}</p>
              </div>
              <div className="stat-card">
                <h4>This Week</h4>
                <p className="stat-value">{formatTime(weeklySummary.totalHours)}</p>
                <p className="stat-label">{weeklySummary.daysWorked} day{weeklySummary.daysWorked !== 1 ? 's' : ''}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {view === 'weekly' && (
        <div className="weekly-section">
          <h2>Weekly Summary</h2>
          {weeklySummary ? (
            <div className="summary-card">
              <p>Total hours this week: <strong>{formatTime(weeklySummary.totalHours)}</strong></p>
              <p>Days worked: <strong>{weeklySummary.daysWorked}</strong></p>
              <p>Average hours/day: <strong>{formatTime(weeklySummary.totalHours / weeklySummary.daysWorked || 0)}</strong></p>
            </div>
          ) : <p>No data yet</p>}
        </div>
      )}

      {view === 'history' && (
        <div className="history-section">
          <h2>Time Entries</h2>
          <div className="entries-list">
            {entries.map((entry, idx) => (
              <div key={idx} className="entry-card">
                <div>
                  <p className="entry-name">{entry.name}</p>
                  <p className="entry-time">{new Date(entry.timestamp).toLocaleString()}</p>
                  <p className="entry-action">{entry.action}</p>
                </div>
                <button className="delete-btn" onClick={() => deleteEntry(idx)}>Delete</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function LoginForm({ onLogin }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (name && email) {
      onLogin(name, email)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>⏱️ Time Tracker</h1>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Your Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            type="email"
            placeholder="Your Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button type="submit">Login</button>
        </form>
      </div>
    </div>
  )
}
