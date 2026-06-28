import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Query from './pages/Query'
import Coordinator from './pages/Coordinator'
import Navbar from './components/Navbar'

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-950 text-white">
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/register" element={<Register />} />
            <Route path="/query" element={<Query />} />
            <Route path="/coordinator" element={<Coordinator />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  )
}

export default App