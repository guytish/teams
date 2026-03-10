export const TEAM_COLORS = [
  { name: 'Red', bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', header: 'bg-red-500' },
  { name: 'Blue', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', header: 'bg-blue-500' },
  { name: 'Green', bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', header: 'bg-green-500' },
]

export function generateTeams(players, features, conflicts, numTeams, maxPerTeam = 0) {
  if (players.length < numTeams) return []

  const scored = players.map(p => ({
    ...p,
    score: features.reduce((sum, f) => sum + (p.ratings[f.id] || 0) * f.weight, 0),
  }))

  const maxScore = Math.max(...scored.map(p => p.score), 1)
  scored.forEach(p => {
    p.sortScore = p.score + (Math.random() - 0.5) * maxScore * 0.1
  })
  scored.sort((a, b) => b.sortScore - a.sortScore)

  const perTeam = maxPerTeam > 0 ? maxPerTeam : Math.ceil(scored.length / numTeams)
  const totalActive = Math.min(scored.length, numTeams * perTeam)
  const active = scored.slice(0, totalActive)
  const benchPool = scored.slice(totalActive)

  const teams = Array.from({ length: numTeams }, () => [])
  let idx = 0
  let direction = 1

  for (const player of active) {
    teams[idx].push(player)
    if ((direction === 1 && idx === numTeams - 1) || (direction === -1 && idx === 0)) {
      direction *= -1
    } else {
      idx += direction
    }
  }

  // Hill-climbing
  let currentMetric = calcBalance(teams, features, conflicts)
  let improved = true
  let iterations = 0

  while (improved && iterations < 100) {
    improved = false
    iterations++

    for (let t1 = 0; t1 < numTeams; t1++) {
      for (let t2 = t1 + 1; t2 < numTeams; t2++) {
        for (let p1 = 0; p1 < teams[t1].length; p1++) {
          for (let p2 = 0; p2 < teams[t2].length; p2++) {
            ;[teams[t1][p1], teams[t2][p2]] = [teams[t2][p2], teams[t1][p1]]
            const nm = calcBalance(teams, features, conflicts)
            if (nm < currentMetric - 0.001) {
              currentMetric = nm
              improved = true
            } else {
              ;[teams[t1][p1], teams[t2][p2]] = [teams[t2][p2], teams[t1][p1]]
            }
          }
        }
      }
    }

    for (let t = 0; t < numTeams; t++) {
      for (let tp = 0; tp < teams[t].length; tp++) {
        for (let bp = 0; bp < benchPool.length; bp++) {
          ;[teams[t][tp], benchPool[bp]] = [benchPool[bp], teams[t][tp]]
          const nm = calcBalance(teams, features, conflicts)
          if (nm < currentMetric - 0.001) {
            currentMetric = nm
            improved = true
          } else {
            ;[teams[t][tp], benchPool[bp]] = [benchPool[bp], teams[t][tp]]
          }
        }
      }
    }
  }

  return teams
}

export function recalcTeams(rawTeams, features, conflicts) {
  return rawTeams.map((team, i) => ({
    players: team,
    color: TEAM_COLORS[i % TEAM_COLORS.length],
    totalScore: team.reduce((sum, p) => sum + p.score, 0),
    featureScores: features.map(f => ({
      feature: f,
      total: team.reduce((sum, p) => sum + (p.ratings[f.id] || 0), 0),
      avg: team.length > 0
        ? team.reduce((sum, p) => sum + (p.ratings[f.id] || 0), 0) / team.length
        : 0,
    })),
    hasConflicts: teamHasConflicts(team, conflicts),
  }))
}

/**
 * Find balance-improving swaps for the given teams.
 * Returns the optimized teams and a list of player moves.
 */
export function findBalanceSuggestions(rawTeams, features, conflicts) {
  // Map players to teams before optimization
  const before = {}
  rawTeams.forEach((team, t) => team.forEach(p => { before[p.id] = t }))

  // Deep copy and optimize
  const optimized = rawTeams.map(t => [...t])
  let metric = calcBalance(optimized, features, conflicts)
  let improved = true
  let iterations = 0

  while (improved && iterations < 50) {
    improved = false
    iterations++
    for (let t1 = 0; t1 < optimized.length; t1++) {
      for (let t2 = t1 + 1; t2 < optimized.length; t2++) {
        for (let p1 = 0; p1 < optimized[t1].length; p1++) {
          for (let p2 = 0; p2 < optimized[t2].length; p2++) {
            ;[optimized[t1][p1], optimized[t2][p2]] = [optimized[t2][p2], optimized[t1][p1]]
            const nm = calcBalance(optimized, features, conflicts)
            if (nm < metric - 0.1) {
              metric = nm
              improved = true
            } else {
              ;[optimized[t1][p1], optimized[t2][p2]] = [optimized[t2][p2], optimized[t1][p1]]
            }
          }
        }
      }
    }
  }

  // Find what changed
  const after = {}
  optimized.forEach((team, t) => team.forEach(p => { after[p.id] = t }))

  const moves = []
  for (const id of Object.keys(before)) {
    if (before[id] !== after[id]) {
      const player = rawTeams.flat().find(p => p.id === id)
      moves.push({ player, from: before[id], to: after[id] })
    }
  }

  return { optimizedTeams: optimized, moves }
}

function calcBalance(teams, features, conflicts) {
  const scores = teams.map(t => t.reduce((s, p) => s + p.score, 0))
  const avgScore = scores.reduce((a, b) => a + b, 0) / teams.length
  const scoreVar = scores.reduce((s, v) => s + (v - avgScore) ** 2, 0)

  let featureVar = 0
  for (const f of features) {
    const fScores = teams.map(t => t.reduce((s, p) => s + (p.ratings[f.id] || 0), 0))
    const avg = fScores.reduce((a, b) => a + b, 0) / teams.length
    featureVar += fScores.reduce((s, v) => s + (v - avg) ** 2, 0) * f.weight
  }

  let penalty = 0
  for (const team of teams) {
    const ids = new Set(team.map(p => p.id))
    for (const c of conflicts) {
      if (ids.has(c.player1Id) && ids.has(c.player2Id)) penalty += 100000
    }
  }

  return scoreVar + featureVar + penalty
}

function teamHasConflicts(team, conflicts) {
  const ids = new Set(team.map(p => p.id))
  return conflicts.some(c => ids.has(c.player1Id) && ids.has(c.player2Id))
}
