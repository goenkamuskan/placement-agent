import { useEffect, useState } from 'react'
import axios from 'axios'

const API = 'http://localhost:8000/api/v1'

function Dashboard({ user }) {
  const [drives, setDrives] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get(`${API}/drives`)
      .then(res => {
        const all = res.data
        if (user?.role === 'coordinator') {
          setDrives(all)
        } else {
          // Filter to only drives student qualifies for
          const eligible = all.filter(drive => {
            const branchMatch = drive.eligible_branches?.includes(user?.branch)
            const cgpaMatch = user?.cgpa >= drive.min_cgpa
            const backlogMatch = user?.active_backlogs <= drive.max_backlogs_allowed
            return branchMatch && cgpaMatch && backlogMatch
          })
          setDrives(eligible)
        }
      })
      .catch(() => setDrives([]))
      .finally(() => setLoading(false))
  }, [user])

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
          <p className="text-gray-600 text-sm mt-1">
            {user?.role === 'coordinator' 
              ? 'Post a drive announcement from the Coordinator Panel.'
              : 'Check back later — new drives will appear here automatically.'}
          </p>
        </div>
      )}

      <div className="grid gap-4">
        {drives.map(drive => (
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

            <div className="flex gap-4 text-xs text-gray-400">
              <span>Min CGPA: {drive.min_cgpa}</span>
              <span>Backlogs allowed: {drive.max_backlogs_allowed}</span>
              {drive.apply_deadline && (
                <span className="text-yellow-400">
                  Deadline: {drive.apply_deadline.split('T')[0]}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Dashboard