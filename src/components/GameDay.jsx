import { useState, useEffect, useMemo } from 'react'
import { getPlayers, getFeatures, getConflicts } from '../store'
import { generateTeams, recalcTeams } from '../utils/teamBalancer'
import TeamDisplay from './TeamDisplay'

export default function GameDay() {
  const [allPlayers, setAllPlayers] = useState([])
  const [features, setFeatures] = useState([])
  const [conflicts, setConflicts] = useState([])
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [numTeams, setNumTeams] = useState(2)
  const [playersPerTeam, setPlayersPerTeam] = useState(0)

  const [rawTeams, setRawTeams] = useState(null)
  const [round, setRound] = useState(1)
  const [selectedSwap, setSelectedSwap] = useState(null)
  const [showBench, setShowBench] = useState(false)

  useEffect(() => {
    setAllPlayers(getPlayers())
    setFeatures(getFeatures())
    setConflicts(getConflicts())
  }, [])

  const scoredPlayers = useMemo(() =>
    allPlayers.map(p => ({
      ...p,
      score: features.reduce((sum, f) => sum + (p.ratings[f.id] || 0) * f.weight, 0),
    })),
    [allPlayers, features]
  )

  const teams = useMemo(() => {
    if (!rawTeams) return null
    return recalcTeams(rawTeams, features, conflicts)
  }, [rawTeams, features, conflicts])

  const teamPlayerIds = useMemo(() => {
    if (!rawTeams) return new Set()
    return new Set(rawTeams.flat().map(p => p.id))
  }, [rawTeams])

  const bench = useMemo(() =>
    scoredPlayers.filter(p => !teamPlayerIds.has(p.id)),
    [scoredPlayers, teamPlayerIds]
  )

  const activeConflicts = useMemo(() =>
    conflicts.filter(c => selectedIds.has(c.player1Id) && selectedIds.has(c.player2Id)),
    [conflicts, selectedIds]
  )

  // --- Handlers ---
  const togglePlayer = (id) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id); else next.add(id)
    setSelectedIds(next)
  }

  const handleGenerate = () => {
    const selected = scoredPlayers.filter(p => selectedIds.has(p.id))
    if (selected.length < numTeams) return
    const ppt = playersPerTeam > 0 ? playersPerTeam : 0
    setRawTeams(generateTeams(selected, features, conflicts, numTeams, ppt))
    setRound(1)
    setSelectedSwap(null)
    setShowBench(false)
  }

  const handlePlayerClick = (playerId) => {
    if (!selectedSwap) { setSelectedSwap(playerId); return }
    if (selectedSwap === playerId) { setSelectedSwap(null); return }
    performSwap(selectedSwap, playerId)
    setSelectedSwap(null)
  }

  const findInTeams = (id) => {
    for (let t = 0; t < rawTeams.length; t++) {
      const i = rawTeams[t].findIndex(p => p.id === id)
      if (i !== -1) return { team: t, idx: i }
    }
    return null
  }

  const performSwap = (id1, id2) => {
    const loc1 = findInTeams(id1)
    const loc2 = findInTeams(id2)
    if (!loc1 && !loc2) return

    const newTeams = rawTeams.map(t => [...t])
    const bp1 = !loc1 ? bench.find(p => p.id === id1) : null
    const bp2 = !loc2 ? bench.find(p => p.id === id2) : null

    if (loc1 && loc2) {
      const p1 = newTeams[loc1.team][loc1.idx]
      const p2 = newTeams[loc2.team][loc2.idx]
      newTeams[loc1.team][loc1.idx] = p2
      newTeams[loc2.team][loc2.idx] = p1
    } else if (loc1 && bp2) {
      newTeams[loc1.team][loc1.idx] = bp2
    } else if (bp1 && loc2) {
      newTeams[loc2.team][loc2.idx] = bp1
    }

    setRawTeams(newTeams)
  }

  const handleRebalance = () => {
    const active = rawTeams.flat()
    if (active.length < rawTeams.length) return
    setRawTeams(generateTeams(active, features, conflicts, rawTeams.length))
    setRound(r => r + 1)
    setSelectedSwap(null)
  }

  const handleReset = () => {
    setRawTeams(null)
    setRound(1)
    setSelectedSwap(null)
    setShowBench(false)
  }

  const isPlaying = rawTeams !== null

  // --- Render ---
  return (
    <div className="space-y-4">
      {!isPlaying ? (
        <>
          {/* Player selection */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-gray-800">
                Who's Playing? <span className="text-indigo-600">({selectedIds.size})</span>
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedIds(new Set(allPlayers.map(p => p.id)))}
                  className="text-xs bg-gray-100 active:bg-gray-200 px-2.5 py-1.5 rounded-lg"
                >
                  All
                </button>
                <button
                  onClick={() => setSelectedIds(new Set())}
                  className="text-xs bg-gray-100 active:bg-gray-200 px-2.5 py-1.5 rounded-lg"
                >
                  None
                </button>
              </div>
            </div>

            {allPlayers.length === 0 ? (
              <p className="text-gray-400 text-sm py-6 text-center">
                No players yet. Add them in the Players tab.
              </p>
            ) : (
              <div className="space-y-1 max-h-[50vh] overflow-y-auto hide-scrollbar">
                {allPlayers.map(p => (
                  <label
                    key={p.id}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                      selectedIds.has(p.id) ? 'bg-indigo-50' : 'active:bg-gray-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.has(p.id)}
                      onChange={() => togglePlayer(p.id)}
                      className="accent-indigo-600 w-5 h-5 shrink-0"
                    />
                    <span className={`text-[15px] ${selectedIds.has(p.id) ? 'font-medium text-gray-800' : 'text-gray-500'}`}>
                      {p.name}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Conflict warnings */}
          {activeConflicts.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
              <p className="text-amber-700 font-medium text-sm mb-1">Conflicts</p>
              {activeConflicts.map(c => (
                <p key={c.id} className="text-amber-600 text-xs">
                  {allPlayers.find(p => p.id === c.player1Id)?.name} vs {allPlayers.find(p => p.id === c.player2Id)?.name}
                </p>
              ))}
            </div>
          )}

          {/* Config + Generate */}
          <div className="bg-white rounded-xl shadow-sm p-4 space-y-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1 font-medium">Teams</label>
                <select
                  value={numTeams}
                  onChange={e => setNumTeams(Number(e.target.value))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-[15px] bg-gray-50 focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  {[2, 3].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1 font-medium">Per Team</label>
                <select
                  value={playersPerTeam}
                  onChange={e => setPlayersPerTeam(Number(e.target.value))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-[15px] bg-gray-50 focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value={0}>Auto</option>
                  {[2, 3, 4, 5, 6, 7, 8].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={selectedIds.size < numTeams}
              className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-semibold text-[15px] active:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              Generate Teams
            </button>
          </div>
        </>
      ) : (
        <>
          {/* Round header + controls */}
          <div className="bg-white rounded-xl shadow-sm p-3">
            <div className="flex items-center justify-between">
              <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-bold text-sm">
                Round {round}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={handleRebalance}
                  className="text-sm bg-gray-100 active:bg-gray-200 px-3 py-1.5 rounded-lg font-medium text-gray-700"
                >
                  Rebalance
                </button>
                <button
                  onClick={handleGenerate}
                  className="text-sm bg-gray-100 active:bg-gray-200 px-3 py-1.5 rounded-lg font-medium text-gray-700"
                >
                  Shuffle
                </button>
                <button
                  onClick={handleReset}
                  className="text-sm bg-gray-100 active:bg-gray-200 px-3 py-1.5 rounded-lg font-medium text-gray-700"
                >
                  Reset
                </button>
              </div>
            </div>
            {selectedSwap && (
              <p className="text-amber-600 text-sm mt-2 text-center">
                Tap another player to swap
              </p>
            )}
          </div>

          {/* Teams */}
          {teams && (
            <TeamDisplay
              teams={teams}
              features={features}
              onPlayerClick={handlePlayerClick}
              selectedPlayerId={selectedSwap}
            />
          )}

          {/* Bench toggle */}
          {bench.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <button
                onClick={() => setShowBench(!showBench)}
                className="w-full flex items-center justify-between p-4 active:bg-gray-50"
              >
                <span className="font-semibold text-gray-800">
                  Bench <span className="text-gray-400 font-normal">({bench.length})</span>
                </span>
                <svg
                  className={`w-5 h-5 text-gray-400 transition-transform ${showBench ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </button>

              {showBench && (
                <div className="px-4 pb-4 space-y-1.5">
                  {bench.map(p => {
                    const isSelected = selectedSwap === p.id
                    return (
                      <div
                        key={p.id}
                        onClick={() => handlePlayerClick(p.id)}
                        className={`p-3 rounded-xl flex justify-between items-center transition-all ${
                          isSelected
                            ? 'bg-yellow-100 ring-2 ring-yellow-400'
                            : 'bg-gray-50 active:bg-gray-100'
                        }`}
                      >
                        <span className="text-[15px] font-medium text-gray-700">{p.name}</span>
                        <span className="text-xs text-gray-400 font-mono">{p.score.toFixed(1)}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
