import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState } from 'react'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Query from './pages/Query'
import Coordinator from './pages/Coordinator'
import Login from './pages/Login'
import Navbar from './components/Navbar'

function App() {
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem('user') || 'null')
  )

  const handleLogin = (userData) => {
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
  }

  const handleLogout = () => {
    localStorage.removeItem('user')
    setUser(null)
  }

  // Allow register page without login
  if (!user && window.location.pathname === '/register') {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/register" element={<Register />} />
        </Routes>
      </BrowserRouter>
    )
  }

  if (!user) return <Login onLogin={handleLogin} />

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-950 text-white">
        <Navbar role={user.role} onLogout={handleLogout} user={user} />
        <div className="max-w-5xl mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Dashboard user={user} />} />
            <Route path="/query" element={<Query />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/coordinator"
              element={user.role === 'coordinator' ? <Coordinator /> : <Navigate to="/" />}
            />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  )
}

export default App