import { useState, useEffect, useRef } from 'react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

/* ── SVG Logo Component ── */
function TimerLogo({ size = 32, color = 'currentColor', className = '' }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Top button */}
      <rect x="12" y="2" width="8" height="3" rx="1.5" fill={color} />
      {/* Side pusher */}
      <path d="M25 9l2-2" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      {/* Clock face */}
      <circle cx="16" cy="18" r="11" stroke={color} strokeWidth="2.2" />
      {/* Minute hand */}
      <path d="M16 11v7" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
      {/* Second hand */}
      <path d="M16 18l4.5 3.5" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
      {/* Center dot */}
      <circle cx="16" cy="18" r="1.5" fill={color} />
    </svg>
  )
}

function formatTime(decimalHours) {
  if (!decimalHours || isNaN(decimalHours) || !isFinite(decimalHours)) return '0h 0m'
  const hours = Math.floor(decimalHours)
  const minutes = Math.round((decimalHours - hours) * 60)
  return `${hours}h ${minutes}m`
}

function formatElapsed(ms) {
  if (ms <= 0) return '00:00:00'
  const totalSeconds = Math.floor(ms / 1000)
  const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0')
  const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0')
  const s = String(totalSeconds % 60).padStart(2, '0')
  return `${h}:${m}:${s}`
}

export default function App() {
  const [user, setUser] = useState(null)
  const [entries, setEntries] = useState([])
  const [todaySummary, setTodaySummary] = useState(null)
  const [weeklySummary, setWeeklySummary] = useState(null)
  const [view, setView] = useState('tracker')
  const [elapsed, setElapsed] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (stored) setUser(JSON.parse(stored))
  }, [])

  // Live elapsed timer
  useEffect(() => {
    if (!user || user.status !== 'in' || !user.lastClockTime) {
      setElapsed(0)
      return
    }
    const tick = () => setElapsed(Date.now() - new Date(user.lastClockTime).getTime())
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [user])

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
    if (isTransitioning) return
    setIsTransitioning(true)
    try {
      const res = await axios.post(`${API_URL}/clock`, {
        userId: user.id,
        name: user.name
      })
      setUser(res.data.user)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      fetchEntries()
    } catch (err) {
      alert('Error: ' + err.response?.data?.error)
    } finally {
      setTimeout(() => setIsTransitioning(false), 400)
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

  const isClockedIn = user.status === 'in'

  return (
    <div className="app">
      {/* Header */}
      <header>
        <div className="header-brand">
          <div className="brand-icon">
            <TimerLogo size={22} color="#E8DED7" />
          </div>
          <h1>Time Tracker</h1>
        </div>
        <div className="header-actions">
          <div className="user-avatar">{user.name?.[0]}</div>
          <button className="logout-btn" onClick={() => { setUser(null); localStorage.clear() }}>
            Sign Out
          </button>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="tabs">
        {['tracker', 'weekly', 'history'].map(tab => (
          <button
            key={tab}
            id={`tab-${tab}`}
            className={view === tab ? 'active' : ''}
            onClick={() => setView(tab)}
          >
            {tab === 'tracker' && <><TimerLogo size={14} color={view === 'tracker' ? '#E8DED7' : '#9E948B'} /> Tracker</>}
            {tab === 'weekly' && <><span className="tab-icon">📊</span> Weekly</>}
            {tab === 'history' && <><span className="tab-icon">📋</span> History</>}
          </button>
        ))}
      </div>

      {/* Tracker View */}
      {view === 'tracker' && (
        <div className="tracker-section">
          <div className={`status-card ${isClockedIn ? 'clocked-in' : 'clocked-out'}`}>
            <div className={`status-indicator ${isClockedIn ? 'in' : 'out'}`}>
              <span className="status-dot" />
              <span>{isClockedIn ? 'Active Session' : 'Not Tracking'}</span>
            </div>

            <h2>{isClockedIn ? 'Elapsed Time' : 'Ready to Start'}</h2>

            <div className={`elapsed-time ${isClockedIn ? 'active' : ''}`}>
              {isClockedIn ? formatElapsed(elapsed) : '00:00:00'}
            </div>

            <p className="status-time">
              {user.lastClockTime
                ? `Last action: ${new Date(user.lastClockTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : 'No sessions yet today'}
            </p>
          </div>

          <button
            id="clock-btn"
            className={`clock-btn ${isClockedIn ? 'clock-out' : 'clock-in'} ${isTransitioning ? 'transitioning' : ''}`}
            onClick={clockInOut}
            disabled={isTransitioning}
          >
            {isClockedIn ? '⏹  Clock Out' : '▶  Clock In'}
          </button>

          {todaySummary && weeklySummary && (
            <div className="stats-grid">
              <div className="stat-card">
                <span className="stat-icon">
                  <TimerLogo size={20} color="#9E948B" />
                </span>
                <h4>Today</h4>
                <p className="stat-value">{formatTime(todaySummary.hours)}</p>
                <p className="stat-label">
                  {todaySummary.sessions} session{todaySummary.sessions !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="stat-card">
                <span className="stat-icon">📅</span>
                <h4>This Week</h4>
                <p className="stat-value">{formatTime(weeklySummary.totalHours)}</p>
                <p className="stat-label">
                  {weeklySummary.daysWorked} day{weeklySummary.daysWorked !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Weekly View */}
      {view === 'weekly' && (
        <div className="weekly-section">
          <h2>Weekly Summary</h2>
          {weeklySummary && weeklySummary.daysWorked > 0 ? (
            <div className="summary-card">
              <div className="summary-row">
                <span className="summary-label">
                  <span className="label-icon">🕐</span>
                  Total Hours
                </span>
                <span className="summary-value highlight">{formatTime(weeklySummary.totalHours)}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">
                  <span className="label-icon">📅</span>
                  Days Worked
                </span>
                <span className="summary-value">{weeklySummary.daysWorked}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">
                  <span className="label-icon">📊</span>
                  Daily Average
                </span>
                <span className="summary-value">
                  {formatTime(weeklySummary.totalHours / weeklySummary.daysWorked)}
                </span>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <span className="empty-icon">📊</span>
              <p>No data for this week yet.<br />Clock in to get started!</p>
            </div>
          )}
        </div>
      )}

      {/* History View */}
      {view === 'history' && (
        <div className="history-section">
          <h2>Recent Entries</h2>
          {entries.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">📋</span>
              <p>No entries yet.<br />Your time logs will appear here.</p>
            </div>
          ) : (
            <div className="entries-list">
              {entries.map((entry, idx) => {
                const isClockIn = entry.action === 'Clock In'
                return (
                  <div key={idx} className="entry-card">
                    <div className="entry-info">
                      <div className={`entry-type-icon ${isClockIn ? 'in' : 'out'}`}>
                        {isClockIn ? '▶' : '⏹'}
                      </div>
                      <div className="entry-details">
                        <p className="entry-action">{entry.action}</p>
                        <p className="entry-time">
                          {new Date(entry.timestamp).toLocaleString([], {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                    <button
                      className="delete-btn"
                      onClick={() => deleteEntry(idx)}
                      title="Delete entry"
                    >
                      ✕
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function LoginForm({ onLogin }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const nameRef = useRef(null)

  useEffect(() => {
    nameRef.current?.focus()
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (name && email) {
      onLogin(name, email)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-brand">
          <div className="login-brand-icon">
            <TimerLogo size={30} color="#E8DED7" />
          </div>
          <h1>Time Tracker</h1>
          <p className="login-subtitle">Track your work sessions effortlessly</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="login-name">Name</label>
            <input
              id="login-name"
              ref={nameRef}
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="input-group">
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <button id="login-btn" type="submit" className="login-btn">
            Get Started
          </button>
        </form>
      </div>
    </div>
  )
}
