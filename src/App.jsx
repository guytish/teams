import { useState } from 'react'
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
  },
  {
    id: 'conflicts',
    label: 'Conflicts',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
      </svg>
    ),
  },
]

export default function App() {
  const [activeTab, setActiveTab] = useState('gameday')

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top header */}
      <header className="bg-indigo-600 text-white px-4 py-3 flex items-center justify-between shrink-0">
        <h1 className="text-lg font-bold">Team Builder</h1>
      </header>

      {/* Scrollable content */}
      <main className="flex-1 overflow-y-auto pb-20 px-4 py-4">
        {activeTab === 'gameday' && <GameDay />}
        {activeTab === 'players' && <PlayerManager />}
        {activeTab === 'features' && <FeatureManager />}
        {activeTab === 'conflicts' && <ConflictManager />}
      </main>

      {/* Bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex z-50 safe-area-bottom">
        {tabs.map(tab => (
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
