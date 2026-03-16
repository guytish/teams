import { useState, useEffect } from 'react'
import { initFromCloud, getIsAdmin, setIsAdmin as storeSetIsAdmin, getAdminPassword, setAdminPassword } from './store'
import FeatureManager from './components/FeatureManager'
import PlayerManager from './components/PlayerManager'
import ConflictManager from './components/ConflictManager'
import GameDay from './components/GameDay'

const tabs = [
  {
    id: 'gameday',
    label: 'Game',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
  },
  {
    id: 'players',
    label: 'Players',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
  },
  {
    id: 'features',
    label: 'Features',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
      </svg>
    ),
    adminOnly: true,
  },
  {
    id: 'conflicts',
    label: 'Conflicts',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
      </svg>
    ),
    adminOnly: true,
  },
]

export default function App() {
  const [activeTab, setActiveTab] = useState('gameday')
  const [loading, setLoading] = useState(true)
  const [isAdmin, setAdmin] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState(false)

  useEffect(() => {
    initFromCloud().finally(() => {
      setAdmin(getIsAdmin())
      setLoading(false)
    })
  }, [])

  const hasPassword = getAdminPassword() !== ''

  const handleLogin = () => {
    if (!hasPassword) {
      // Setting password for first time
      if (!password.trim()) return
      setAdminPassword(password.trim())
      storeSetIsAdmin(true)
      setAdmin(true)
      setShowLogin(false)
      setPassword('')
    } else {
      if (password === getAdminPassword()) {
        storeSetIsAdmin(true)
        setAdmin(true)
        setShowLogin(false)
        setPassword('')
        setLoginError(false)
      } else {
        setLoginError(true)
      }
    }
  }

  const handleLogout = () => {
    storeSetIsAdmin(false)
    setAdmin(false)
    if (activeTab === 'features' || activeTab === 'conflicts') {
      setActiveTab('gameday')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-500 mt-3">Loading...</p>
        </div>
      </div>
    )
  }

  const visibleTabs = tabs.filter(t => !t.adminOnly || isAdmin)

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-indigo-600 text-white px-4 py-3 flex items-center justify-between shrink-0">
        <h1 className="text-lg font-bold">Team Builder</h1>
        <button
          onClick={() => isAdmin ? handleLogout() : setShowLogin(true)}
          className="opacity-80 active:opacity-100"
        >
          {isAdmin ? (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          )}
        </button>
      </header>

      {/* Login / Set Password modal */}
      {showLogin && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-xs space-y-4">
            <h3 className="font-bold text-gray-800 text-center">
              {hasPassword ? 'Admin Login' : 'Set Admin Password'}
            </h3>
            {!hasPassword && (
              <p className="text-xs text-gray-500 text-center">Choose a password for admin access</p>
            )}
            <input
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setLoginError(false) }}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="Password"
              className={`w-full border rounded-xl px-4 py-3 text-[16px] outline-none focus:ring-2 focus:ring-indigo-500 ${
                loginError ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'
              }`}
              autoFocus
            />
            {loginError && <p className="text-red-500 text-xs text-center">Wrong password</p>}
            <div className="flex gap-2">
              <button
                onClick={() => { setShowLogin(false); setPassword(''); setLoginError(false) }}
                className="flex-1 py-2.5 rounded-xl text-gray-600 font-medium text-sm border border-gray-200 active:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleLogin}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm active:bg-indigo-700"
              >
                {hasPassword ? 'Login' : 'Set Password'}
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 overflow-y-auto pb-20 px-4 py-4">
        {activeTab === 'gameday' && <GameDay isAdmin={isAdmin} />}
        {activeTab === 'players' && <PlayerManager isAdmin={isAdmin} />}
        {activeTab === 'features' && isAdmin && <FeatureManager />}
        {activeTab === 'conflicts' && isAdmin && <ConflictManager />}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex z-50 safe-area-bottom">
        {visibleTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex flex-col items-center justify-center py-2 pt-2.5 transition-colors ${
              activeTab === tab.id
                ? 'text-indigo-600'
                : 'text-gray-400 active:text-gray-600'
            }`}
          >
            {tab.icon}
            <span className="text-[10px] mt-0.5 font-medium">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
