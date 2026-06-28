import { useState } from 'react'
import axios from 'axios'

const API = 'http://localhost:8000/api/v1'

function Coordinator() {
  const [text, setText] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleParse = async () => {
    if (!text.trim()) return
    setLoading(true)
    setResult(null)
    try {
      const res = await axios.post(`${API}/drives/parse`, { raw_text: text })
      setResult(res.data)
    } catch (err) {
      setResult({ error: err.response?.data?.detail || 'Something went wrong' })
    }
    setLoading(false)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-2">Coordinator Panel</h1>
      <p className="text-gray-400 mb-6">Paste a drive announcement — AI will parse it and notify eligible students</p>

      <div className="bg-gray-900 rounded-xl p-6 space-y-4">
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Paste the placement drive announcement here..."
          rows={6}
          className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
        <button
          onClick={handleParse}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2 rounded-lg transition-colors"
        >
          {loading ? '🤖 AI is parsing...' : 'Parse & Notify Students'}
        </button>
      </div>

      {result && !result.error && (
        <div className="mt-6 bg-gray-900 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-green-400">✅ Drive Created Successfully</h2>

          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              ['Company', result.drive.company_name],
              ['Role', result.drive.role],
              ['Package', `${result.drive.package_lpa} LPA`],
              ['Min CGPA', result.drive.min_cgpa],
              ['Branches', result.drive.eligible_branches?.join(', ')],
              ['Deadline', result.drive.apply_deadline?.split('T')[0]],
            ].map(([label, value]) => (
              <div key={label} className="bg-gray-800 rounded-lg p-3">
                <p className="text-gray-400 text-xs">{label}</p>
                <p className="text-white font-medium">{value || 'N/A'}</p>
              </div>
            ))}
          </div>

          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-gray-400 text-sm mb-1">Notifications sent</p>
            <p className="text-white">
              📧 <span className="text-green-400 font-bold">{result.notifications?.sent}</span> emails sent to eligible students
              {' '}({result.eligible_students_count} matched)
            </p>
          </div>

          <div>
            <p className="text-gray-400 text-sm mb-2">Eligible Students</p>
            <div className="space-y-2">
              {result.eligible_students?.map(s => (
                <div key={s.id} className="bg-gray-800 rounded-lg px-4 py-2 flex justify-between text-sm">
                  <span className="text-white">{s.full_name}</span>
                  <span className="text-gray-400">{s.branch} • {s.cgpa} CGPA</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {result?.error && (
        <p className="mt-4 text-red-400 text-sm">❌ {result.error}</p>
      )}
    </div>
  )
}

export default Coordinator