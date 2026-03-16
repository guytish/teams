import { useState, useEffect, useMemo } from 'react'
import { getPlayers, getFeatures, getConflicts } from '../store'
import { generateTeams, recalcTeams, findBalanceSuggestions, TEAM_COLORS } from '../utils/teamBalancer'
import { loadPresets } from '../cloudStore'
import TeamDisplay from './TeamDisplay'

const PHASE = {
  SELECT: 'select',
  CONFIG: 'config',
  PLAYING: 'playing',
  ROUND_LOSER: 'round_loser',
  ROUND_OUTS: 'round_outs',
  ROUND_INS: 'round_ins',
  ROUND_REVIEW: 'round_review',
}

function TopBar({ left, title, right }) {
  return (
    <div className="flex items-center justify-between mb-4 min-h-[40px]">
      <div className="w-20 flex justify-start">
        {left}
      </div>
      <h2 className="font-bold text-gray-800 text-[17px] text-center">{title}</h2>
      <div className="w-20 flex justify-end">
        {right}
      </div>
    </div>
  )
}

function BackButton({ onClick }) {
  return (
    <button onClick={onClick} className="text-indigo-600 active:text-indigo-800 text-[15px] font-medium py-1">
      Back
    </button>
  )
}

function ActionButton({ onClick, disabled, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="text-indigo-600 active:text-indigo-800 text-[15px] font-bold py-1 disabled:text-gray-300"
    >
      {children}
    </button>
  )
}

export default function GameDay() {
  const [allPlayers, setAllPlayers] = useState([])
  const [features, setFeatures] = useState([])
  const [conflicts, setConflicts] = useState([])
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [numTeams, setNumTeams] = useState(2)
  const [playersPerTeam, setPlayersPerTeam] = useState(0)
  const [phase, setPhase] = useState(PHASE.SELECT)

  const [rawTeams, setRawTeams] = useState(null)
  const [round, setRound] = useState(1)

  const [losingTeamIdx, setLosingTeamIdx] = useState(null)
  const [outsIds, setOutsIds] = useState(new Set())
  const [insIds, setInsIds] = useState(new Set())
  const [suggestions, setSuggestions] = useState(null)

  const [presets, setPresets] = useState(null)
  const [activeDay, setActiveDay] = useState(null)

  useEffect(() => {
    setAllPlayers(getPlayers())
    setFeatures(getFeatures())
    setConflicts(getConflicts())
    loadPresets()
      .then(setPresets)
      .catch(() => setPresets({ monday: [], friday: [] }))
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
    setPhase(PHASE.PLAYING)
  }

  const handleShuffle = () => {
    const selected = scoredPlayers.filter(p => selectedIds.has(p.id))
    if (selected.length < numTeams) return
    const ppt = playersPerTeam > 0 ? playersPerTeam : 0
    setRawTeams(generateTeams(selected, features, conflicts, numTeams, ppt))
  }

  const startNewRound = () => {
    setLosingTeamIdx(null)
    setOutsIds(new Set())
    setInsIds(new Set())
    setSuggestions(null)
    setPhase(PHASE.ROUND_LOSER)
  }

  const toggleOut = (id) => {
    const next = new Set(outsIds)
    if (next.has(id)) next.delete(id); else next.add(id)
    setOutsIds(next)
  }

  const toggleIn = (id) => {
    const next = new Set(insIds)
    if (next.has(id)) next.delete(id); else next.add(id)
    setInsIds(next)
  }

  const buildProposedTeams = () => {
    return rawTeams.map((team, i) => {
      if (i === losingTeamIdx) {
        const filtered = team.filter(p => !outsIds.has(p.id))
        const incoming = bench.filter(p => insIds.has(p.id))
        return [...filtered, ...incoming]
      }
      return [...team]
    })
  }

  const goToReview = () => {
    const proposed = buildProposedTeams()
    const result = findBalanceSuggestions(proposed, features, conflicts)
    setSuggestions(result)
    setPhase(PHASE.ROUND_REVIEW)
  }

  const confirmRound = (applyOptimized) => {
    if (applyOptimized && suggestions) {
      setRawTeams(suggestions.optimizedTeams)
    } else {
      setRawTeams(buildProposedTeams())
    }
    setRound(r => r + 1)
    setPhase(PHASE.PLAYING)
  }

  const handleReset = () => {
    setRawTeams(null)
    setRound(1)
    setPhase(PHASE.SELECT)
  }

  const pickDay = (day) => {
    if (activeDay === day) {
      setActiveDay(null)
      setSelectedIds(new Set())
    } else {
      setActiveDay(day)
      if (!presets) return
      const ids = presets[day] || []
      setSelectedIds(new Set(ids.filter(id => allPlayers.some(p => p.id === id))))
    }
  }

  // ====== RENDERS ======

  if (phase === PHASE.SELECT) {
    return (
      <div>
        <TopBar
          title="Select Players"
          right={
            <ActionButton onClick={() => setPhase(PHASE.CONFIG)} disabled={selectedIds.size < 2}>
              Next
            </ActionButton>
          }
        />

        {/* Day picker */}
        {presets && allPlayers.length > 0 && (
          <div className="flex gap-2">
            {['monday', 'friday'].map(day => {
              const count = (presets[day] || []).filter(id => allPlayers.some(p => p.id === id)).length
              return (
                <button
                  key={day}
                  onClick={() => pickDay(day)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    activeDay === day
                      ? day === 'monday'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-white border border-gray-200 text-gray-700 active:bg-gray-50 shadow-sm'
                  }`}
                >
                  {day === 'monday' ? 'Monday' : 'Friday'} {count > 0 && `(${count})`}
                </button>
              )
            })}
          </div>
        )}

        {allPlayers.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-400 text-sm">
            No players yet. Add them in the Players tab.
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm">
            <div className="flex items-center justify-between p-3 border-b border-gray-100">
              <span className="text-sm text-gray-500">{selectedIds.size} of {allPlayers.length} selected</span>
              <div className="flex gap-2">
                <button onClick={() => setSelectedIds(new Set(allPlayers.map(p => p.id)))} className="text-xs bg-gray-100 active:bg-gray-200 px-2.5 py-1.5 rounded-lg">All</button>
                <button onClick={() => setSelectedIds(new Set())} className="text-xs bg-gray-100 active:bg-gray-200 px-2.5 py-1.5 rounded-lg">None</button>
              </div>
            </div>
            <div className="divide-y divide-gray-50">
              {allPlayers.map(p => (
                <label
                  key={p.id}
                  className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-colors ${
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
          </div>
        )}
      </div>
    )
  }

  if (phase === PHASE.CONFIG) {
    const totalActive = playersPerTeam > 0
      ? Math.min(selectedIds.size, numTeams * playersPerTeam)
      : selectedIds.size
    const benchCount = selectedIds.size - totalActive

    return (
      <div>
        <TopBar
          left={<BackButton onClick={() => setPhase(PHASE.SELECT)} />}
          title="Configure"
          right={
            <ActionButton onClick={handleGenerate} disabled={selectedIds.size < numTeams}>
              Go
            </ActionButton>
          }
        />

        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Number of Teams</label>
              <div className="flex gap-3">
                {[2, 3].map(n => (
                  <button
                    key={n}
                    onClick={() => setNumTeams(n)}
                    className={`flex-1 py-3 rounded-xl font-semibold text-[15px] transition-colors ${
                      numTeams === n
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-600 active:bg-gray-200'
                    }`}
                  >
                    {n} Teams
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Players per Team</label>
              <select
                value={playersPerTeam}
                onChange={e => setPlayersPerTeam(Number(e.target.value))}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-[15px] bg-gray-50 focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value={0}>Auto (split evenly)</option>
                {[2, 3, 4, 5, 6, 7, 8].map(n => <option key={n} value={n}>{n} per team</option>)}
              </select>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="grid grid-cols-3 text-center">
              <div>
                <p className="text-2xl font-bold text-indigo-600">{selectedIds.size}</p>
                <p className="text-xs text-gray-500 mt-0.5">Selected</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{totalActive}</p>
                <p className="text-xs text-gray-500 mt-0.5">Playing</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-600">{benchCount}</p>
                <p className="text-xs text-gray-500 mt-0.5">Bench</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (phase === PHASE.PLAYING) {
    return (
      <div className="space-y-4">
        <TopBar
          left={
            <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-bold text-xs">
              Round {round}
            </span>
          }
          title="Teams"
          right={
            <ActionButton onClick={startNewRound}>
              Next
            </ActionButton>
          }
        />

        {/* Quick actions */}
        <div className="flex gap-2">
          <button
            onClick={handleShuffle}
            className="flex-1 text-sm bg-white border border-gray-200 active:bg-gray-50 py-2.5 rounded-xl font-medium text-gray-600 shadow-sm"
          >
            Shuffle
          </button>
          <button
            onClick={handleReset}
            className="flex-1 text-sm bg-white border border-gray-200 active:bg-gray-50 py-2.5 rounded-xl font-medium text-gray-600 shadow-sm"
          >
            Reset
          </button>
        </div>

        {teams && <TeamDisplay teams={teams} features={features} />}

        {bench.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Bench ({bench.length})</h3>
            <div className="flex flex-wrap gap-2">
              {bench.map(p => (
                <span key={p.id} className="bg-gray-100 text-gray-600 text-sm px-3 py-1.5 rounded-lg">{p.name}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  if (phase === PHASE.ROUND_LOSER) {
    return (
      <div>
        <TopBar
          left={<BackButton onClick={() => setPhase(PHASE.PLAYING)} />}
          title="Who lost?"
          right={
            <ActionButton onClick={() => setPhase(PHASE.ROUND_OUTS)} disabled={losingTeamIdx === null}>
              Next
            </ActionButton>
          }
        />

        <div className="space-y-3">
          {rawTeams.map((team, i) => {
            const color = TEAM_COLORS[i % TEAM_COLORS.length]
            const isSelected = losingTeamIdx === i
            return (
              <button
                key={i}
                onClick={() => setLosingTeamIdx(i)}
                className={`w-full rounded-xl border-2 p-4 text-left transition-all ${
                  isSelected
                    ? `${color.border} ${color.bg} ring-2 ring-offset-1 ring-indigo-400`
                    : 'border-gray-200 bg-white active:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`font-bold text-[15px] ${isSelected ? color.text : 'text-gray-800'}`}>
                    Team {i + 1}
                  </span>
                  <span className="text-sm text-gray-500">{team.length} players</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {team.map(p => (
                    <span key={p.id} className="text-xs bg-white/80 text-gray-600 px-2 py-0.5 rounded">{p.name}</span>
                  ))}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  if (phase === PHASE.ROUND_OUTS) {
    const losingTeam = rawTeams[losingTeamIdx] || []
    const color = TEAM_COLORS[losingTeamIdx % TEAM_COLORS.length]

    return (
      <div>
        <TopBar
          left={<BackButton onClick={() => setPhase(PHASE.ROUND_LOSER)} />}
          title="Who sits out?"
          right={
            <ActionButton onClick={() => {
              if (outsIds.size === 0 && bench.length === 0) goToReview()
              else setPhase(PHASE.ROUND_INS)
            }}>
              {outsIds.size > 0 ? `Next (${outsIds.size})` : 'Skip'}
            </ActionButton>
          }
        />

        <div className="space-y-3">
          <div className={`rounded-xl ${color.bg} border ${color.border} px-4 py-2.5`}>
            <span className={`text-sm font-medium ${color.text}`}>From Team {losingTeamIdx + 1}</span>
          </div>

          <div className="bg-white rounded-xl shadow-sm divide-y divide-gray-50">
            {losingTeam.map(p => {
              const isOut = outsIds.has(p.id)
              return (
                <div
                  key={p.id}
                  onClick={() => toggleOut(p.id)}
                  className={`flex items-center justify-between px-4 py-3.5 cursor-pointer transition-colors ${
                    isOut ? 'bg-red-50' : 'active:bg-gray-50'
                  }`}
                >
                  <span className={`text-[15px] ${isOut ? 'font-medium text-red-700' : 'text-gray-700'}`}>{p.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 font-mono">{p.score.toFixed(1)}</span>
                    {isOut && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">OUT</span>}
                  </div>
                </div>
              )
            })}
          </div>

          <p className="text-xs text-gray-400 text-center">Tap players who will sit out</p>
        </div>
      </div>
    )
  }

  if (phase === PHASE.ROUND_INS) {
    return (
      <div>
        <TopBar
          left={<BackButton onClick={() => setPhase(PHASE.ROUND_OUTS)} />}
          title="Who comes in?"
          right={
            <ActionButton onClick={goToReview}>
              {insIds.size > 0 ? `Review (${insIds.size})` : 'Review'}
            </ActionButton>
          }
        />

        <div className="space-y-3">
          {outsIds.size > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">
              <span className="text-sm text-amber-700">
                {outsIds.size} sitting out.
                {bench.length > 0
                  ? ` Pick replacement${outsIds.size > 1 ? 's' : ''} from bench.`
                  : ' No bench players available.'}
              </span>
            </div>
          )}

          {bench.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-400 text-sm">
              No players on the bench
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm divide-y divide-gray-50">
              {bench.map(p => {
                const isIn = insIds.has(p.id)
                return (
                  <div
                    key={p.id}
                    onClick={() => toggleIn(p.id)}
                    className={`flex items-center justify-between px-4 py-3.5 cursor-pointer transition-colors ${
                      isIn ? 'bg-green-50' : 'active:bg-gray-50'
                    }`}
                  >
                    <span className={`text-[15px] ${isIn ? 'font-medium text-green-700' : 'text-gray-700'}`}>{p.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 font-mono">{p.score.toFixed(1)}</span>
                      {isIn && <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full font-medium">IN</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    )
  }

  if (phase === PHASE.ROUND_REVIEW) {
    const proposed = buildProposedTeams()
    const proposedDisplay = recalcTeams(proposed, features, conflicts)
    const hasSuggestions = suggestions && suggestions.moves.length > 0
    const optimizedDisplay = hasSuggestions
      ? recalcTeams(suggestions.optimizedTeams, features, conflicts)
      : null

    const outsPlayers = rawTeams[losingTeamIdx]?.filter(p => outsIds.has(p.id)) || []
    const insPlayers = bench.filter(p => insIds.has(p.id))

    return (
      <div className="space-y-4">
        <TopBar
          left={<BackButton onClick={() => setPhase(PHASE.ROUND_INS)} />}
          title={`Round ${round + 1}`}
        />

        {/* Changes summary */}
        {(outsPlayers.length > 0 || insPlayers.length > 0) && (
          <div className="bg-white rounded-xl shadow-sm p-4 space-y-2">
            <h3 className="text-sm font-semibold text-gray-700">Changes</h3>
            {outsPlayers.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-red-500 font-medium w-10">OUT:</span>
                {outsPlayers.map(p => (
                  <span key={p.id} className="text-xs bg-red-50 text-red-700 px-2.5 py-1 rounded-lg font-medium">{p.name}</span>
                ))}
              </div>
            )}
            {insPlayers.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-green-600 font-medium w-10">IN:</span>
                {insPlayers.map(p => (
                  <span key={p.id} className="text-xs bg-green-50 text-green-700 px-2.5 py-1 rounded-lg font-medium">{p.name}</span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Balance suggestions */}
        {hasSuggestions && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-amber-800">Suggested Swaps</h3>
              <p className="text-xs text-amber-600 mt-0.5">To improve team balance:</p>
            </div>
            <div className="space-y-2">
              {(() => {
                const pairs = []
                const used = new Set()
                for (const m of suggestions.moves) {
                  if (used.has(m.player.id)) continue
                  const counterpart = suggestions.moves.find(
                    m2 => !used.has(m2.player.id) && m2.from === m.to && m2.to === m.from && m2.player.id !== m.player.id
                  )
                  if (counterpart) {
                    used.add(m.player.id)
                    used.add(counterpart.player.id)
                    pairs.push({ a: m, b: counterpart })
                  } else {
                    used.add(m.player.id)
                    pairs.push({ a: m, b: null })
                  }
                }
                return pairs.map((pair, i) => (
                  <div key={i} className="bg-white rounded-lg px-3 py-2.5 text-sm">
                    {pair.b ? (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-gray-800">{pair.a.player.name}</span>
                        <span className="text-gray-400 text-xs">(T{pair.a.from + 1})</span>
                        <svg className="w-4 h-4 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                        </svg>
                        <span className="font-medium text-gray-800">{pair.b.player.name}</span>
                        <span className="text-gray-400 text-xs">(T{pair.b.from + 1})</span>
                      </div>
                    ) : (
                      <span className="text-gray-700">
                        Move <span className="font-medium">{pair.a.player.name}</span> from Team {pair.a.from + 1} to Team {pair.a.to + 1}
                      </span>
                    )}
                  </div>
                ))
              })()}
            </div>
          </div>
        )}

        {/* Preview teams */}
        <TeamDisplay teams={hasSuggestions ? optimizedDisplay : proposedDisplay} features={features} />

        {/* Action buttons */}
        <div className="space-y-2 pb-2">
          {hasSuggestions ? (
            <>
              <button
                onClick={() => confirmRound(true)}
                className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-semibold text-[15px] active:bg-indigo-700 transition-colors shadow-sm"
              >
                Apply Swaps & Start
              </button>
              <button
                onClick={() => confirmRound(false)}
                className="w-full bg-white border border-gray-200 text-gray-700 py-3 rounded-xl font-medium text-[15px] active:bg-gray-50 transition-colors"
              >
                Keep As Is
              </button>
            </>
          ) : (
            <button
              onClick={() => confirmRound(false)}
              className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-semibold text-[15px] active:bg-indigo-700 transition-colors shadow-sm"
            >
              Start Round {round + 1}
            </button>
          )}
        </div>
      </div>
    )
  }

  return null
}
