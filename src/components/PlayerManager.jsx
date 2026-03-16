import { useState, useEffect } from 'react'
import { getFeatures, getPlayers, setPlayers, getConflicts, setConflicts, getPresets, setPresets } from '../store'

const DAYS = ['monday', 'friday']

export default function PlayerManager({ isAdmin }) {
  const [players, setLocal] = useState([])
  const [features, setFeatures] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [name, setName] = useState('')
  const [ratings, setRatings] = useState({})
  const [search, setSearch] = useState('')
  const [presets, setPresetsLocal] = useState({ monday: [], friday: [] })

  useEffect(() => {
    setLocal(getPlayers())
    setFeatures(getFeatures())
    setPresetsLocal(getPresets())
  }, [])

  const save = (updated) => { setLocal(updated); setPlayers(updated) }

  const toggleDay = (playerId, day) => {
    const current = presets[day] || []
    const has = current.includes(playerId)
    const updated = {
      ...presets,
      [day]: has ? current.filter(id => id !== playerId) : [...current, playerId],
    }
    setPresetsLocal(updated)
    setPresets(updated)
  }

  const openAdd = () => {
    setEditing(null)
    setName('')
    setRatings(Object.fromEntries(features.map(f => [f.id, Math.round((f.min + f.max) / 2)])))
    setShowForm(true)
  }

  const openEdit = (player) => {
    setEditing(player.id)
    setName(player.name)
    setRatings({
      ...Object.fromEntries(features.map(f => [f.id, Math.round((f.min + f.max) / 2)])),
      ...player.ratings,
    })
    setShowForm(true)
  }

  const handleSave = () => {
    if (!name.trim()) return
    if (editing) {
      save(players.map(p => p.id === editing ? { ...p, name: name.trim(), ratings } : p))
    } else {
      save([...players, { id: crypto.randomUUID(), name: name.trim(), ratings }])
    }
    setShowForm(false)
  }

  const handleDelete = (id) => {
    if (!confirm('Delete this player?')) return
    save(players.filter(p => p.id !== id))
    const c = getConflicts().filter(c => c.player1Id !== id && c.player2Id !== id)
    setConflicts(c)
  }

  const filtered = search
    ? players.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    : players

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-gray-800 text-lg">Players ({players.length})</h2>
        {isAdmin && (
          <button
            onClick={openAdd}
            className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl active:bg-indigo-700 transition-colors text-sm font-semibold shadow-sm"
          >
            + Add
          </button>
        )}
      </div>

      {/* Search */}
      {players.length > 3 && (
        <input
          type="text"
          placeholder="Search players..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-[15px] bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
        />
      )}

      {/* Full-screen modal form (admin only) */}
      {showForm && isAdmin && (
        <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
            <button
              onClick={() => setShowForm(false)}
              className="text-gray-500 active:text-gray-800 text-[15px] py-1"
            >
              Cancel
            </button>
            <h3 className="font-bold text-gray-800">{editing ? 'Edit Player' : 'New Player'}</h3>
            <button
              onClick={handleSave}
              className="text-indigo-600 font-bold active:text-indigo-800 text-[15px] py-1"
            >
              Save
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-5 pb-12">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-[16px] bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Player name"
                autoFocus
              />
            </div>

            {features.length === 0 && (
              <p className="text-amber-600 text-sm bg-amber-50 rounded-xl p-3">
                No features defined yet. Go to Features tab to add some.
              </p>
            )}

            {features.map(f => (
              <div key={f.id}>
                <div className="flex justify-between items-baseline mb-1">
                  <label className="text-sm font-medium text-gray-600">{f.name}</label>
                  <span className="font-mono font-bold text-indigo-600 text-lg">{ratings[f.id] ?? f.min}</span>
                </div>
                <input
                  type="range"
                  min={f.min}
                  max={f.max}
                  value={ratings[f.id] ?? f.min}
                  onChange={e => setRatings({ ...ratings, [f.id]: Number(e.target.value) })}
                  className="w-full accent-indigo-600 h-2"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                  <span>{f.min}</span>
                  <span>{f.max}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Player list */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-400 text-sm">
          {players.length === 0 ? 'No players yet.' : 'No players match.'}
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map(player => (
            <div key={player.id} className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-center justify-between mb-2.5">
                <h3 className="font-bold text-gray-800 text-[15px]">{player.name}</h3>
                {isAdmin && (
                  <div className="flex gap-4">
                    <button onClick={() => openEdit(player)} className="text-indigo-600 active:text-indigo-800 text-sm font-medium py-1">Edit</button>
                    <button onClick={() => handleDelete(player.id)} className="text-red-500 active:text-red-700 text-sm font-medium py-1">Delete</button>
                  </div>
                )}
              </div>
              {/* Day chips */}
              <div className="flex gap-2 mb-2.5">
                {DAYS.map(day => {
                  const active = (presets[day] || []).includes(player.id)
                  return (
                    <button
                      key={day}
                      onClick={() => isAdmin && toggleDay(player.id, day)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                        active
                          ? day === 'monday'
                            ? 'bg-blue-100 text-blue-700 border border-blue-200'
                            : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                          : isAdmin
                            ? 'bg-gray-50 text-gray-400 border border-gray-100'
                            : 'hidden'
                      }`}
                    >
                      {day === 'monday' ? 'Mon' : 'Fri'}
                    </button>
                  )
                })}
              </div>
              {/* Rating bars (admin only) */}
              {isAdmin && (
                <div className="space-y-1.5">
                  {features.map(f => {
                    const val = player.ratings[f.id] || 0
                    const pct = f.max > f.min ? ((val - f.min) / (f.max - f.min)) * 100 : 0
                    return (
                      <div key={f.id} className="flex items-center gap-2">
                        <span className="w-14 text-gray-500 text-xs truncate">{f.name}</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-2">
                          <div className="bg-indigo-500 rounded-full h-2 transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="w-5 text-right font-mono text-xs text-gray-600">{val}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
