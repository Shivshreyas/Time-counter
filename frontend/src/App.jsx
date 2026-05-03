import { useState, useEffect } from 'react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export default function App() {
  const [user, setUser] = useState(null)
  const [entries, setEntries] = useState([])
  const [todaySummary, setTodaySummary] = useState(null)
  const [weeklySummary, setWeeklySummary] = useState(null)
  const [view, setView] = useState('tracker') // tracker, history, weekly

  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (stored) setUser(JSON.parse(stored))
  }, [])

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

          {todaySummary && (
            <div className="summary-card">
              <h3>Today's Summary</h3>
              <p>Hours worked: <strong>{todaySummary.hours.toFixed(2)}h</strong></p>
              <p>Sessions: <strong>{todaySummary.sessions}</strong></p>
            </div>
          )}
        </div>
      )}

      {view === 'weekly' && (
        <div className="weekly-section">
          <h2>Weekly Summary</h2>
          {weeklySummary ? (
            <div className="summary-card">
              <p>Total hours this week: <strong>{weeklySummary.totalHours.toFixed(2)}h</strong></p>
              <p>Days worked: <strong>{weeklySummary.daysWorked}</strong></p>
              <p>Average hours/day: <strong>{(weeklySummary.totalHours / weeklySummary.daysWorked || 0).toFixed(2)}h</strong></p>
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
