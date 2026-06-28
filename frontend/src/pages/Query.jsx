import { useState } from 'react'
import axios from 'axios'

const API = 'http://localhost:8000/api/v1'

const suggestions = [
  "Which companies are hiring CSE students?",
  "Show drives with more than 5 LPA package",
  "Are there any drives with backlogs allowed?",
  "Which drives have deadlines this month?",
]

function Query() {
  const [question, setQuestion] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleQuery = async (q) => {
    const query = q || question
    if (!query.trim()) return
    setLoading(true)
    setResult(null)
    try {
      const res = await axios.post(`${API}/drives/query`, { question: query })
      setResult(res.data)
    } catch (err) {
      setResult({ error: 'Something went wrong' })
    }
    setLoading(false)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-2">Ask AI</h1>
      <p className="text-gray-400 mb-6">Ask anything about placement drives in plain English</p>

      <div className="bg-gray-900 rounded-xl p-6 space-y-4">
        <input
          type="text"
          value={question}
          onChange={e => setQuestion(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleQuery()}
          placeholder="e.g. Which companies allow one backlog?"
          className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={() => handleQuery()}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2 rounded-lg transition-colors"
        >
          {loading ? '🤖 Thinking...' : 'Ask'}
        </button>

        <div>
          <p className="text-xs text-gray-500 mb-2">Try asking:</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map(s => (
              <button
                key={s}
                onClick={() => { setQuestion(s); handleQuery(s) }}
                className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1 rounded-full transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {result && !result.error && (
        <div className="mt-6 bg-gray-900 rounded-xl p-6 space-y-3">
          <p className="text-xs text-gray-500">Found {result.drives_found} drives</p>
          <p className="text-white leading-relaxed whitespace-pre-wrap">{result.answer}</p>
        </div>
      )}

      {result?.error && (
        <p className="mt-4 text-red-400 text-sm">❌ {result.error}</p>
      )}
    </div>
  )
}

export default Query