import { useState, useEffect } from 'react'
import { getFeatures, setFeatures } from '../store'

export default function FeatureManager() {
  const [features, setLocal] = useState([])
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', min: 1, max: 10, weight: 1 })

  useEffect(() => { setLocal(getFeatures()) }, [])

  const save = (updated) => { setLocal(updated); setFeatures(updated) }

  const openAdd = () => {
    setEditing(null)
    setForm({ name: '', min: 1, max: 10, weight: 1 })
    setShowForm(true)
  }

  const openEdit = (f) => {
    setEditing(f.id)
    setForm({ name: f.name, min: f.min, max: f.max, weight: f.weight })
    setShowForm(true)
  }

  const handleSave = () => {
    if (!form.name.trim()) return
    if (editing) {
      save(features.map(f => f.id === editing ? { ...f, ...form, name: form.name.trim() } : f))
    } else {
      save([...features, { id: crypto.randomUUID(), ...form, name: form.name.trim() }])
    }
    setShowForm(false)
    setEditing(null)
  }

  const handleDelete = (id) => {
    if (confirm('Delete this feature?')) {
      save(features.filter(f => f.id !== id))
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-gray-800 text-lg">Features</h2>
        <button
          onClick={openAdd}
          className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl active:bg-indigo-700 transition-colors text-sm font-semibold shadow-sm"
        >
          + Add
        </button>
      </div>

      <p className="text-gray-500 text-sm">
        Attributes used to balance teams. Weight controls importance.
      </p>

      {/* Full-screen form */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
            <button
              onClick={() => { setShowForm(false); setEditing(null) }}
              className="text-gray-500 active:text-gray-800 text-[15px] py-1"
            >
              Cancel
            </button>
            <h3 className="font-bold text-gray-800">{editing ? 'Edit Feature' : 'New Feature'}</h3>
            <button
              onClick={handleSave}
              className="text-indigo-600 font-bold active:text-indigo-800 text-[15px] py-1"
            >
              Save
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Name</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-[16px] bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="e.g., Speed"
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">Min</label>
                <input
                  type="number"
                  value={form.min}
                  onChange={e => setForm({ ...form, min: Number(e.target.value) })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-[16px] bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">Max</label>
                <input
                  type="number"
                  value={form.max}
                  onChange={e => setForm({ ...form, max: Number(e.target.value) })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-[16px] bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Weight (importance)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={form.weight}
                onChange={e => setForm({ ...form, weight: Number(e.target.value) })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-[16px] bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <p className="text-xs text-gray-400 mt-1">Higher = more important for balancing (e.g., 1.5x)</p>
            </div>
          </div>
        </div>
      )}

      {/* Feature list */}
      {features.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-400 text-sm">
          No features defined yet
        </div>
      ) : (
        <div className="space-y-2">
          {features.map(f => (
            <div key={f.id} className="bg-white rounded-xl shadow-sm p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-800 text-[15px]">{f.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">Range {f.min}-{f.max} &middot; Weight {f.weight}x</p>
              </div>
              <div className="flex gap-4 shrink-0 ml-3">
                <button onClick={() => openEdit(f)} className="text-indigo-600 active:text-indigo-800 text-sm font-medium py-1">Edit</button>
                <button onClick={() => handleDelete(f.id)} className="text-red-500 active:text-red-700 text-sm font-medium py-1">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
