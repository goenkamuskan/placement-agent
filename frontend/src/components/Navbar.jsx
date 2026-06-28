import { Link, useLocation } from 'react-router-dom'

function Navbar({ role, onLogout, user }) {
  const location = useLocation()

  const studentLinks = [
    { to: '/', label: 'Dashboard' },
    { to: '/query', label: 'Ask AI' },
  ]

  const coordinatorLinks = [
    { to: '/', label: 'Dashboard' },
    { to: '/coordinator', label: 'Coordinator Panel' },
    { to: '/query', label: 'Ask AI' },
  ]

  const links = role === 'coordinator' ? coordinatorLinks : studentLinks

  return (
    <nav className="bg-gray-900 border-b border-gray-800 px-6 py-4">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <span className="text-blue-400 font-bold text-lg">🎓 Placement Agent</span>
        <div className="flex items-center gap-6">
          {links.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`text-sm font-medium transition-colors ${
                location.pathname === link.to
                  ? 'text-blue-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <div className="flex items-center gap-3 ml-4 border-l border-gray-700 pl-4">
            <span className="text-xs text-gray-500">{user?.email}</span>
            <span className={`text-xs px-2 py-1 rounded-full ${
              role === 'coordinator' 
                ? 'bg-purple-900 text-purple-300' 
                : 'bg-blue-900 text-blue-300'
            }`}>
              {role}
            </span>
            <button
              onClick={onLogout}
              className="text-xs text-gray-400 hover:text-red-400 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar