import { useState } from 'react'
import axios from 'axios'

const API = 'http://localhost:8000/api/v1'

function Register() {
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    branch: '',
    cgpa: '',
    active_backlogs: 0,
    graduation_year: 2026,
    skills: '',
    phone: ''
  })
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async () => {
    setLoading(true)
    setStatus(null)
    try {
      await axios.post(`${API}/students`, {
        ...form,
        cgpa: parseFloat(form.cgpa),
        active_backlogs: parseInt(form.active_backlogs),
        graduation_year: parseInt(form.graduation_year),
        skills: form.skills.split(',').map(s => s.trim()).filter(Boolean)
      })
      setStatus({ type: 'success', message: '✅ Registered successfully! You will now receive placement notifications.' })
    } catch (err) {
      const msg = err.response?.data?.detail || 'Something went wrong'
      setStatus({ type: 'error', message: `❌ ${msg}` })
    }
    setLoading(false)
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-white mb-2">Student Registration</h1>
      <p className="text-gray-400 mb-6">Register to receive placement drive notifications</p>

      <div className="bg-gray-900 rounded-xl p-6 space-y-4">
        {[
          { name: 'full_name', label: 'Full Name', type: 'text', placeholder: 'Muskan Goenka' },
          { name: 'email', label: 'Email', type: 'email', placeholder: 'you@college.edu' },
          { name: 'password', label: 'Password', type: 'password', placeholder: '••••••••' },
          { name: 'phone', label: 'Phone', type: 'text', placeholder: '9876543210' },
          { name: 'cgpa', label: 'CGPA', type: 'number', placeholder: '8.5' },
          { name: 'active_backlogs', label: 'Active Backlogs', type: 'number', placeholder: '0' },
          { name: 'graduation_year', label: 'Graduation Year', type: 'number', placeholder: '2026' },
          { name: 'skills', label: 'Skills (comma separated)', type: 'text', placeholder: 'Python, React, SQL' },
        ].map(field => (
          <div key={field.name}>
            <label className="block text-sm text-gray-400 mb-1">{field.label}</label>
            <input
              type={field.type}
              name={field.name}
              value={form[field.name]}
              onChange={handleChange}
              placeholder={field.placeholder}
              className="w-full bg-gray-800 text-white rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        ))}

        <div>
          <label className="block text-sm text-gray-400 mb-1">Branch</label>
          <select
            name="branch"
            value={form.branch}
            onChange={handleChange}
            className="w-full bg-gray-800 text-white rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select branch</option>
            {['CSE', 'IT', 'ECE', 'EEE', 'ME', 'CE', 'AIDS', 'AIML'].map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2 rounded-lg transition-colors"
        >
          {loading ? 'Registering...' : 'Register'}
        </button>

        {status && (
          <p className={`text-sm text-center ${status.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
            {status.message}
          </p>
        )}
      </div>
    </div>
  )
}

export default Register