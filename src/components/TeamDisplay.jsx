export default function TeamDisplay({ teams, features, onPlayerClick, selectedPlayerId }) {
  if (!teams || teams.length === 0) return null

  const maxTotal = Math.max(...teams.map(t => t.totalScore), 1)
  const minTotal = Math.min(...teams.map(t => t.totalScore))
  const spread = maxTotal > 0 ? ((maxTotal - minTotal) / maxTotal * 100).toFixed(1) : 0

  return (
    <div className="space-y-3">
      {/* Balance badge */}
      <div className="flex justify-center">
        <span className={`text-xs font-medium px-3 py-1 rounded-full ${
          spread <= 5 ? 'bg-green-100 text-green-700' :
          spread <= 15 ? 'bg-amber-100 text-amber-700' :
          'bg-red-100 text-red-700'
        }`}>
          {spread <= 5 ? 'Excellent' : spread <= 15 ? 'Good' : 'Fair'} balance ({spread}% spread)
        </span>
      </div>

      {/* Team Cards */}
      {teams.map((team, i) => (
        <div key={i} className={`rounded-xl border-2 ${team.color.border} ${team.color.bg} overflow-hidden`}>
          <div className={`${team.color.header} text-white px-4 py-2.5 flex items-center justify-between`}>
            <span className="font-bold text-[15px]">Team {i + 1}</span>
            <div className="flex items-center gap-3">
              <span className="text-sm opacity-90 font-mono">{team.totalScore.toFixed(1)} pts</span>
              <span className="text-sm opacity-70">{team.players.length}p</span>
            </div>
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
                  <span className="text-xs text-gray-400 font-mono">{player.score.toFixed(1)}</span>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {/* Per-feature comparison */}
      {features.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-4 overflow-x-auto">
          <h3 className="font-semibold text-gray-800 text-sm mb-2">Feature Breakdown</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-1.5 text-gray-500 font-medium text-xs">Feature</th>
                {teams.map((team, i) => (
                  <th key={i} className={`text-center py-1.5 font-medium text-xs ${team.color.text}`}>T{i + 1}</th>
                ))}
                <th className="text-center py-1.5 text-gray-500 font-medium text-xs">Diff</th>
              </tr>
            </thead>
            <tbody>
              {features.map(f => {
                const totals = teams.map(t => {
                  const fs = t.featureScores.find(s => s.feature.id === f.id)
                  return fs ? fs.total : 0
                })
                const diff = Math.max(...totals) - Math.min(...totals)
                return (
                  <tr key={f.id} className="border-b border-gray-50">
                    <td className="py-1.5 text-gray-600 text-xs">{f.name}</td>
                    {teams.map((team, i) => {
                      const fs = team.featureScores.find(s => s.feature.id === f.id)
                      return (
                        <td key={i} className="text-center py-1.5 font-mono text-xs text-gray-700">
                          {fs ? fs.total : 0}
                        </td>
                      )
                    })}
                    <td className={`text-center py-1.5 font-mono text-xs font-medium ${
                      diff === 0 ? 'text-green-600' : diff <= 3 ? 'text-amber-600' : 'text-red-600'
                    }`}>
                      {diff === 0 ? '=' : diff}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {teams.some(t => t.hasConflicts) && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm text-center">
          Some teams have conflicts. Try rebalancing or swap manually.
        </div>
      )}
    </div>
  )
}
