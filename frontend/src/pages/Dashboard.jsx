import { useEffect, useState } from 'react'
import axios from 'axios'

const API = 'http://localhost:8000/api/v1'

function Dashboard({ user }) {
  const [drives, setDrives] = useState([])
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(null)

  useEffect(() => {
    loadData()
  }, [user])

  const loadData = async () => {
    setLoading(true)
    try {
      const drivesRes = await axios.get(`${API}/drives`)
      const all = drivesRes.data

      if (user?.role === 'coordinator') {
        setDrives(all)
      } else {
        const eligible = all.filter(drive => {
          const branchMatch = drive.eligible_branches?.includes(user?.branch)
          const cgpaMatch = user?.cgpa >= drive.min_cgpa
          const backlogMatch = user?.active_backlogs <= drive.max_backlogs_allowed
          console.log(drive.company_name, { branchMatch, cgpaMatch, backlogMatch, userBranch: user?.branch, userCgpa: user?.cgpa })
          return branchMatch && cgpaMatch && backlogMatch
        })
        setDrives(eligible)

        // Load student's existing applications
        const appsRes = await axios.get(`${API}/applications/student/${user.id}`)
        setApplications(appsRes.data)
      }
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  const handleApply = async (driveId) => {
    setApplying(driveId)
    try {
      await axios.post(`${API}/applications`, {
        student_id: user.id,
        drive_id: driveId
      })
      await loadData() // refresh applications
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to apply')
    }
    setApplying(null)
  }

  const getApplicationStatus = (driveId) => {
    const app = applications.find(a => a.drive_id === driveId)
    return app?.status || null
  }

  const statusColors = {
    applied: 'bg-blue-900 text-blue-300',
    shortlisted: 'bg-yellow-900 text-yellow-300',
    rejected: 'bg-red-900 text-red-300',
    offered: 'bg-green-900 text-green-300',
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-2">
        {user?.role === 'coordinator' ? 'All Placement Drives' : 'Drives You Qualify For'}
      </h1>
      <p className="text-gray-400 mb-6">
        {user?.role === 'coordinator'
          ? 'All active placement drives'
          : `Showing drives matching your profile — ${user?.branch}, ${user?.cgpa} CGPA`}
      </p>

      {loading && <p className="text-gray-400">Loading drives...</p>}

      {!loading && drives.length === 0 && (
        <div className="bg-gray-900 rounded-xl p-8 text-center">
          <p className="text-gray-400">No matching drives found.</p>
        </div>
      )}

      <div className="grid gap-4">
        {drives.map(drive => {
          const status = getApplicationStatus(drive.id)
          return (
            <div key={drive.id} className="bg-gray-900 rounded-xl p-5 border border-gray-800 hover:border-blue-500 transition-colors">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h2 className="text-lg font-semibold text-white">{drive.company_name}</h2>
                  <p className="text-blue-400 text-sm">{drive.role || 'Role TBA'}</p>
                </div>
                {drive.package_lpa && (
                  <span className="bg-green-900 text-green-400 text-sm font-bold px-3 py-1 rounded-full">
                    {drive.package_lpa} LPA
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                {drive.eligible_branches?.map(b => (
                  <span key={b} className="bg-gray-800 text-gray-300 text-xs px-2 py-1 rounded">
                    {b}
                  </span>
                ))}
              </div>

              <div className="flex justify-between items-center">
                <div className="flex gap-4 text-xs text-gray-400">
                  <span>Min CGPA: {drive.min_cgpa}</span>
                  <span>Backlogs allowed: {drive.max_backlogs_allowed}</span>
                  {drive.apply_deadline && (
                    <span className="text-yellow-400">
                      Deadline: {drive.apply_deadline.split('T')[0]}
                    </span>
                  )}
                </div>

                {user?.role === 'student' && (
                  status ? (
                    <span className={`text-xs font-medium px-3 py-1.5 rounded-full ${statusColors[status]}`}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </span>
                  ) : (
                    <button
                      onClick={() => handleApply(drive.id)}
                      disabled={applying === drive.id}
                      className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-medium px-4 py-1.5 rounded-full transition-colors"
                    >
                      {applying === drive.id ? 'Applying...' : 'Apply Now'}
                    </button>
                  )
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Dashboard