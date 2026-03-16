const BIN_ID = '69b82ac1b7ec241ddc7370be'
const ACCESS_KEY = '$2a$10$MzVRNMK4Pl2LGWd3dvxCEenZNoPfG7PDOamHIA9Fobcsv3/NDyFGu'
const BASE = 'https://api.jsonbin.io/v3/b'

export async function loadPresets() {
  const res = await fetch(`${BASE}/${BIN_ID}/latest`, {
    headers: { 'X-Access-Key': ACCESS_KEY },
  })
  if (!res.ok) throw new Error('Failed to load presets')
  const data = await res.json()
  return data.record
}

export async function savePresets(presets) {
  const res = await fetch(`${BASE}/${BIN_ID}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Access-Key': ACCESS_KEY,
    },
    body: JSON.stringify(presets),
  })
  if (!res.ok) throw new Error('Failed to save presets')
  return res.json()
}
