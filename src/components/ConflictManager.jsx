import { useState, useEffect } from 'react'
import { getPlayers, getConflicts, setConflicts } from '../store'

export default function ConflictManager() {
  const [players, setPlayersLocal] = useState([])
  const [conflicts, setLocal] = useState([])
  const [player1, setPlayer1] = useState('')
  const [player2, setPlayer2] = useState('')

  useEffect(() => {
    const p = getPlayers()
    setPlayersLocal(p)
    const playerIds = new Set(p.map(pl => pl.id))
    const c = getConflicts().filter(c => playerIds.has(c.player1Id) && playerIds.has(c.player2Id))
    setLocal(c)
    setConflicts(c)
  }, [])

  const save = (updated) => { setLocal(updated); setConflicts(updated) }

  const handleAdd = () => {
    if (!player1 || !player2 || player1 === player2) return
    const exists = conflicts.some(c =>
      (c.player1Id === player1 && c.player2Id === player2) ||
      (c.player1Id === player2 && c.player2Id === player1)
    )
    if (exists) return
    save([...conflicts, { id: crypto.randomUUID(), player1Id: player1, player2Id: player2 }])
    setPlayer1('')
    setPlayer2('')
  }

  const getName = (id) => players.find(p => p.id === id)?.name || 'Unknown'

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-bold text-gray-800 text-lg">Conflicts</h2>
        <p className="text-gray-500 text-sm mt-1">Players who should not be on the same team.</p>
      </div>

      {/* Add conflict */}
      <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
        <h3 className="font-semibold text-gray-800 text-[15px]">Add Conflict</h3>
        {players.length < 2 ? (
          <p className="text-gray-400 text-sm">Need at least 2 players.</p>
        ) : (
          <>
            <div>
              <label className="block text-xs text-gray-500 mb-1 font-medium">Player 1</label>
              <select
                value={player1}
                onChange={e => setPlayer1(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-[15px] bg-gray-50 focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="">Select player...</option>
                {players.filter(p => p.id !== player2).map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <p className="text-center text-gray-400 text-sm">cannot play with</p>
            <div>
              <label className="block text-xs text-gray-500 mb-1 font-medium">Player 2</label>
              <select
                value={player2}
                onChange={e => setPlayer2(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-[15px] bg-gray-50 focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="">Select player...</option>
                {players.filter(p => p.id !== player1).map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleAdd}
              disabled={!player1 || !player2 || player1 === player2}
              className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold text-[15px] active:bg-indigo-700 disabled:opacity-40 transition-colors shadow-sm"
            >
              Add Conflict
            </button>
          </>
        )}
      </div>

      {/* Conflict list */}
      {conflicts.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-400 text-sm">
          No conflicts defined
        </div>
      ) : (
        <div className="space-y-2">
          {conflicts.map(c => (
            <div key={c.id} className="bg-white rounded-xl shadow-sm p-4 flex items-center justify-between">
              <div className="text-[15px]">
                <span className="font-medium text-gray-800">{getName(c.player1Id)}</span>
                <span className="text-red-400 text-sm mx-2">vs</span>
                <span className="font-medium text-gray-800">{getName(c.player2Id)}</span>
              </div>
              <button
                onClick={() => save(conflicts.filter(x => x.id !== c.id))}
                className="text-red-500 active:text-red-700 text-sm font-medium py-1 shrink-0 ml-3"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
