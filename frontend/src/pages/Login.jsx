import { useState } from 'react'
import { login } from '../services/api'

function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleLogin = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await login(email, password)
      onLogin(data.user)
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="bg-gray-900 rounded-xl p-8 w-full max-w-sm space-y-4">
        <div className="text-center mb-6">
          <span className="text-4xl">🎓</span>
          <h1 className="text-xl font-bold text-white mt-2">Placement Agent</h1>
          <p className="text-gray-400 text-sm">Sign in to continue</p>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@college.edu"
            className="w-full bg-gray-800 text-white rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            placeholder="••••••••"
            className="w-full bg-gray-800 text-white rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {error && <p className="text-red-400 text-sm">❌ {error}</p>}

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2 rounded-lg transition-colors"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>

        <p className="text-center text-gray-500 text-sm">
          New student?{' '}
          <a href="/register" className="text-blue-400 hover:underline">
            Create account
          </a>
        </p>
        
      </div>
    </div>
  )
}

export default Login