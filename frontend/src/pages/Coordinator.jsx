import { useState, useEffect } from 'react'
import axios from 'axios'

const API = 'http://localhost:8000/api/v1'

const statusColors = {
  applied: 'bg-blue-900 text-blue-300',
  shortlisted: 'bg-yellow-900 text-yellow-300',
  rejected: 'bg-red-900 text-red-300',
  offered: 'bg-green-900 text-green-300',
}

function Coordinator() {
  const [tab, setTab] = useState('post')
  const [text, setText] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [drives, setDrives] = useState([])
  const [selectedDrive, setSelectedDrive] = useState(null)
  const [applicants, setApplicants] = useState([])
  const [loadingApplicants, setLoadingApplicants] = useState(false)

  useEffect(() => {
    if (tab === 'applications') {
      loadDrives()
    }
  }, [tab])

  const loadDrives = async () => {
    const res = await axios.get(`${API}/drives`)
    setDrives(res.data)
  }

  const loadApplicants = async (drive) => {
    setSelectedDrive(drive)
    setLoadingApplicants(true)
    const res = await axios.get(`${API}/drives/${drive.id}/applicants`)
    setApplicants(res.data)
    setLoadingApplicants(false)
  }

  const updateStatus = async (applicationId, newStatus) => {
    await axios.patch(`${API}/applications/${applicationId}/status`, { status: newStatus })
    // Refresh applicants
    loadApplicants(selectedDrive)
  }

  const handleParse = async () => {
    if (!text.trim()) return
    setLoading(true)
    setResult(null)
    try {
      const res = await axios.post(`${API}/drives/parse`, { raw_text: text })
      setResult(res.data)
      setText('')
    } catch (err) {
      setResult({ error: err.response?.data?.detail || 'Something went wrong' })
    }
    setLoading(false)
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-2">Coordinator Panel</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-800">
        {[
          { id: 'post', label: '📢 Post Drive' },
          { id: 'applications', label: '📋 View Applications' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t.id
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Post Drive Tab */}
      {tab === 'post' && (
        <div className="space-y-4">
          <p className="text-gray-400">Paste a drive announcement — AI will parse it and notify eligible students</p>
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
            <div className="bg-gray-900 rounded-xl p-6 space-y-4">
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
                  📧 <span className="text-green-400 font-bold">{result.notifications?.sent}</span> emails sent ({result.eligible_students_count} matched)
                </p>
              </div>
            </div>
          )}

          {result?.error && (
            <p className="mt-4 text-red-400 text-sm">❌ {result.error}</p>
          )}
        </div>
      )}

      {/* Applications Tab */}
      {tab === 'applications' && (
        <div className="space-y-4">
          {!selectedDrive ? (
            <>
              <p className="text-gray-400">Select a drive to see applicants</p>
              <div className="space-y-3">
                {drives.map(drive => (
                  <div
                    key={drive.id}
                    onClick={() => loadApplicants(drive)}
                    className="bg-gray-900 rounded-xl p-4 border border-gray-800 hover:border-blue-500 cursor-pointer transition-colors"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-white font-medium">{drive.company_name}</h3>
                        <p className="text-gray-400 text-sm">{drive.role} • {drive.package_lpa} LPA</p>
                      </div>
                      <span className="text-gray-500 text-sm">
                        Deadline: {drive.apply_deadline?.split('T')[0]}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-4">
                <button
                  onClick={() => { setSelectedDrive(null); setApplicants([]) }}
                  className="text-gray-400 hover:text-white text-sm"
                >
                  ← Back
                </button>
                <h2 className="text-white font-semibold">
                  {selectedDrive.company_name} — {applicants.length} applicant(s)
                </h2>
              </div>
    
              {loadingApplicants && <p className="text-gray-400">Loading applicants...</p>}

              {!loadingApplicants && applicants.length === 0 && (
                <div className="bg-gray-900 rounded-xl p-8 text-center">
                  <p className="text-gray-400">No students have applied yet.</p>
                </div>
              )}
              {/* Upload Results */}
              <div className="bg-gray-800 rounded-xl p-4 mb-4">
                <p className="text-white text-sm font-medium mb-1">📊 Upload Company Results</p>
                <p className="text-gray-400 text-xs mb-3">
                  Upload Excel/CSV with columns: <span className="text-blue-400">email, status</span>
                </p>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={async (e) => {
                    const file = e.target.files[0]
                    if (!file) return
                    const formData = new FormData()
                    formData.append('file', file)
                    try {
                      const res = await axios.post(
                        `${API}/drives/${selectedDrive.id}/upload-results`,
                        formData,
                        { headers: { 'Content-Type': 'multipart/form-data' } }
                      )
                      alert(`✅ Updated ${res.data.updated} students. ${res.data.not_found.length > 0 ? `Not found: ${res.data.not_found.join(', ')}` : ''}`)
                      loadApplicants(selectedDrive)
                    } catch (err) {
                      alert('❌ Upload failed: ' + (err.response?.data?.detail || err.message))
                    }
                  }}
                  className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                />
              </div>

              <div className="space-y-3">
                {applicants.map(app => (
                  <div key={app.id} className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-white font-medium">{app.students?.full_name}</p>
                        <p className="text-gray-400 text-sm">{app.students?.email}</p>
                        <p className="text-gray-500 text-xs mt-1">
                          {app.students?.branch} • {app.students?.cgpa} CGPA • {app.students?.active_backlogs} backlogs
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">

                        <p className="text-gray-500 text-xs">Update from company</p>
                        <select
                          value={app.status}
                          onChange={e => updateStatus(app.id, e.target.value)}
                          className="bg-gray-800 text-white text-xs rounded px-2 py-1 outline-none"
                        >
                          <option value="applied">Applied</option>
                          <option value="shortlisted">Shortlisted</option>
                          <option value="rejected">Rejected</option>
                          <option value="offered">Offered</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default Coordinator