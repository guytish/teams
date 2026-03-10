export default function TeamDisplay({ teams, features, onPlayerClick, selectedPlayerId }) {
  if (!teams || teams.length === 0) return null

  // Calculate per-feature balance quality
  const featureDiffs = features.map(f => {
    const totals = teams.map(t => {
      const fs = t.featureScores.find(s => s.feature.id === f.id)
      return fs ? fs.total : 0
    })
    const max = Math.max(...totals)
    const min = Math.min(...totals)
    return { feature: f, totals, diff: max - min, maxVal: max }
  })

  const allBalanced = featureDiffs.every(d => d.maxVal === 0 || d.diff / d.maxVal <= 0.1)
  const anyBad = featureDiffs.some(d => d.maxVal > 0 && d.diff / d.maxVal > 0.25)

  return (
    <div className="space-y-3">
      {/* Balance badge */}
      <div className="flex justify-center">
        <span className={`text-xs font-medium px-3 py-1 rounded-full ${
          allBalanced ? 'bg-green-100 text-green-700' :
          anyBad ? 'bg-red-100 text-red-700' :
          'bg-amber-100 text-amber-700'
        }`}>
          {allBalanced ? 'Excellent' : anyBad ? 'Fair' : 'Good'} balance
        </span>
      </div>

      {/* Per-feature balance bars (the main view now) */}
      {features.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
          {featureDiffs.map(({ feature: f, totals, diff, maxVal }) => {
            const barMax = Math.max(...totals, 1)
            return (
              <div key={f.id}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-600">{f.name}</span>
                  <span className={`text-[10px] font-mono font-medium ${
                    diff === 0 ? 'text-green-600' :
                    maxVal > 0 && diff / maxVal > 0.2 ? 'text-red-500' :
                    'text-amber-600'
                  }`}>
                    {diff === 0 ? 'equal' : `diff ${diff}`}
                  </span>
                </div>
                <div className="space-y-1">
                  {teams.map((team, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className={`text-[10px] w-5 font-medium ${team.color.text}`}>T{i + 1}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-2.5">
                        <div
                          className={`${team.color.header} rounded-full h-2.5 transition-all`}
                          style={{ width: `${(totals[i] / barMax) * 100}%`, minWidth: totals[i] > 0 ? '8px' : '0' }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-gray-500 w-6 text-right">{totals[i]}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Team Cards */}
      {teams.map((team, i) => (
        <div key={i} className={`rounded-xl border-2 ${team.color.border} ${team.color.bg} overflow-hidden`}>
          <div className={`${team.color.header} text-white px-4 py-2.5 flex items-center justify-between`}>
            <span className="font-bold text-[15px]">Team {i + 1}</span>
            <span className="text-sm opacity-70">{team.players.length} players</span>
          </div>
          <div className="p-2.5 space-y-1.5">
            {team.players.map(player => {
              const isSelected = selectedPlayerId === player.id
              return (
                <div
                  key={player.id}
                  onClick={() => onPlayerClick?.(player.id)}
                  className={`rounded-xl px-3.5 py-2.5 flex items-center justify-between transition-all ${
                    onPlayerClick ? 'cursor-pointer active:scale-[0.98]' : ''
                  } ${
                    isSelected
                      ? 'bg-yellow-100 ring-2 ring-yellow-400 shadow-sm'
                      : 'bg-white/80 active:bg-white'
                  }`}
                >
                  <span className="font-medium text-gray-800 text-[15px]">{player.name}</span>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {teams.some(t => t.hasConflicts) && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm text-center">
          Some teams have conflicts. Try rebalancing or swap manually.
        </div>
      )}
    </div>
  )
}
