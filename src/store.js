import { loadCloudData, saveCloudData } from './cloudStore'

const KEYS = {
  features: 'tb_features',
  players: 'tb_players',
  conflicts: 'tb_conflicts',
  presets: 'tb_presets',
  adminPassword: 'tb_admin_password',
  isAdmin: 'tb_is_admin',
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

// --- Cloud sync (debounced) ---
let syncTimeout = null

function scheduleSyncToCloud() {
  clearTimeout(syncTimeout)
  syncTimeout = setTimeout(async () => {
    try {
      const presets = getPresets()
      await saveCloudData({
        players: getPlayers(),
        features: getFeatures(),
        conflicts: getConflicts(),
        monday: presets.monday,
        friday: presets.friday,
        adminPassword: getAdminPassword(),
      })
    } catch (e) {
      console.error('Cloud sync failed:', e)
    }
  }, 1500)
}

export async function initFromCloud() {
  try {
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), 8000)
    )
    const cloud = await Promise.race([loadCloudData(), timeout])

    if (cloud.players && cloud.players.length > 0) {
      save(KEYS.players, cloud.players)
    }
    if (cloud.features && cloud.features.length > 0) {
      save(KEYS.features, cloud.features)
    }
    if (cloud.conflicts) {
      save(KEYS.conflicts, cloud.conflicts)
    }

    save(KEYS.presets, {
      monday: cloud.monday || [],
      friday: cloud.friday || [],
    })

    if (cloud.adminPassword !== undefined) {
      save(KEYS.adminPassword, cloud.adminPassword)
    }

    // Migration: push existing localStorage data to cloud if cloud was empty
    if (!cloud.players || !cloud.features) {
      scheduleSyncToCloud()
    }
  } catch (e) {
    console.error('Failed to load from cloud:', e)
  }
}

// --- Data access ---

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
  scheduleSyncToCloud()
}

export function getPlayers() {
  return load(KEYS.players) || []
}

export function setPlayers(players) {
  save(KEYS.players, players)
  scheduleSyncToCloud()
}

export function getConflicts() {
  return load(KEYS.conflicts) || []
}

export function setConflicts(conflicts) {
  save(KEYS.conflicts, conflicts)
  scheduleSyncToCloud()
}

export function getPresets() {
  return load(KEYS.presets) || { monday: [], friday: [] }
}

export function setPresets(presets) {
  save(KEYS.presets, presets)
  scheduleSyncToCloud()
}

export function getAdminPassword() {
  return load(KEYS.adminPassword) || ''
}

export function setAdminPassword(password) {
  save(KEYS.adminPassword, password)
  scheduleSyncToCloud()
}

export function getIsAdmin() {
  return load(KEYS.isAdmin) || false
}

export function setIsAdmin(val) {
  save(KEYS.isAdmin, val)
}

export function deletePlayer(id) {
  setPlayers(getPlayers().filter(p => p.id !== id))
  setConflicts(getConflicts().filter(c => c.player1Id !== id && c.player2Id !== id))
  const presets = getPresets()
  setPresets({
    monday: presets.monday.filter(pid => pid !== id),
    friday: presets.friday.filter(pid => pid !== id),
  })
}
