import { useState } from 'react'
import { useStore } from './store'

export default function Login() {
  const login = useStore(state => state.login)
  const [activeTab, setActiveTab] = useState('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    if (username.length < 3) {
      setError('Username must be at least 3 characters.')
      return
    }

    setLoading(true)

    try {
      // Send request to our Node.js backend
      const endpoint = activeTab === 'register' ? '/api/register' : '/api/login'
      let baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      
      // Clean up common user input errors for the env variable!
      baseUrl = baseUrl.trim()
      if (!baseUrl.startsWith('http')) baseUrl = `https://${baseUrl}`
      baseUrl = baseUrl.replace(/\/$/, '') // Remove trailing slash
      
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed')
      }

      // Success! Log the user into the game state
      login({ username: data.username, id: data.id })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="landing-page">
      {/* High Quality Parallax Background using our warrior concept */}
      <div className="landing-background" style={{ backgroundImage: 'url(/warrior.jpg)' }}></div>
      <div className="landing-vignette"></div>
      
      <div className="landing-content">
        <div className="landing-brand">
          <h1>LaJe's</h1>
          <p>A MULTIPLAYER ACTION RPG EXPERENCE</p>
        </div>

        <div className="auth-modal">
          <div className="auth-tabs">
            <button 
              className={`auth-tab ${activeTab === 'login' ? 'active' : ''}`}
              onClick={() => { setActiveTab('login'); setError('') }}
            >
              Sign In
            </button>
            <button 
              className={`auth-tab ${activeTab === 'register' ? 'active' : ''}`}
              onClick={() => { setActiveTab('register'); setError('') }}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {error && <div className="auth-error">{error}</div>}
            
            <div className="input-group">
              <label>Username</label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
                placeholder="Enter your username"
              />
            </div>
            
            <div className="input-group">
              <label>Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
              />
            </div>
            
            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? 'CONNECTING...' : activeTab === 'login' ? 'ENTER WORLD' : 'REGISTER & PLAY'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
