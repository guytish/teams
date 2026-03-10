const KEYS = {
  features: 'tb_features',
  players: 'tb_players',
  conflicts: 'tb_conflicts',
}

const DEFAULT_FEATURES = [
  { id: 'f1', name: 'Height', min: 1, max: 10, weight: 1 },
  { id: 'f2', name: 'Speed', min: 1, max: 10, weight: 1 },
  { id: 'f3', name: 'Skill', min: 1, max: 10, weight: 1.5 },
  { id: 'f4', name: 'Stamina', min: 1, max: 10, weight: 0.8 },
  { id: 'f5', name: 'Defense', min: 1, max: 10, weight: 1 },
]

function load(key) {
  try {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : null
  } catch {
    return null
  }
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function getFeatures() {
  let features = load(KEYS.features)
  if (!features) {
    features = DEFAULT_FEATURES
    save(KEYS.features, features)
  }
  return features
}

export function setFeatures(features) {
  save(KEYS.features, features)
}

export function getPlayers() {
  return load(KEYS.players) || []
}

export function setPlayers(players) {
  save(KEYS.players, players)
}

export function getConflicts() {
  return load(KEYS.conflicts) || []
}

export function setConflicts(conflicts) {
  save(KEYS.conflicts, conflicts)
}

export function deletePlayer(id) {
  setPlayers(getPlayers().filter(p => p.id !== id))
  setConflicts(getConflicts().filter(c => c.player1Id !== id && c.player2Id !== id))
}
