const DB_NAME = 'drums-only-metronome'
const DB_VERSION = 3

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = (e) => {
      const db = e.target.result
      // v1: presets store
      if (!db.objectStoreNames.contains('presets')) {
        db.createObjectStore('presets', { keyPath: 'id', autoIncrement: true })
      }
      // v2: songs and setlists stores
      if (!db.objectStoreNames.contains('songs')) {
        db.createObjectStore('songs', { keyPath: 'id', autoIncrement: true })
      }
      if (!db.objectStoreNames.contains('setlists')) {
        db.createObjectStore('setlists', { keyPath: 'id', autoIncrement: true })
      }
      // v3: practice stats + journal stores
      if (!db.objectStoreNames.contains('sessions')) {
        db.createObjectStore('sessions', { keyPath: 'id', autoIncrement: true })
      }
      if (!db.objectStoreNames.contains('practiceEntries')) {
        db.createObjectStore('practiceEntries', { keyPath: 'id', autoIncrement: true })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

// ─── Presets (legacy) ───

export async function getAllPresets() {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('presets', 'readonly')
    const store = tx.objectStore('presets')
    const request = store.getAll()
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function savePreset(preset) {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('presets', 'readwrite')
    const store = tx.objectStore('presets')
    const request = store.add(preset)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function deletePreset(id) {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('presets', 'readwrite')
    const store = tx.objectStore('presets')
    const request = store.delete(id)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

// ─── Songs ───

export async function getAllSongs() {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('songs', 'readonly')
    const store = tx.objectStore('songs')
    const request = store.getAll()
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function getSong(id) {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('songs', 'readonly')
    const store = tx.objectStore('songs')
    const request = store.get(id)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function saveSong(song) {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('songs', 'readwrite')
    const store = tx.objectStore('songs')
    const now = Date.now()
    if (song.id) {
      // Update existing
      const getReq = store.get(song.id)
      getReq.onsuccess = () => {
        const existing = getReq.result || {}
        const updated = { ...existing, ...song, updatedAt: now }
        const putReq = store.put(updated)
        putReq.onsuccess = () => resolve(updated.id)
        putReq.onerror = () => reject(putReq.error)
      }
      getReq.onerror = () => reject(getReq.error)
    } else {
      // Create new
      const newSong = { ...song, createdAt: now, updatedAt: now }
      delete newSong.id // let autoIncrement assign it
      const addReq = store.add(newSong)
      addReq.onsuccess = () => resolve(addReq.result)
      addReq.onerror = () => reject(addReq.error)
    }
  })
}

export async function deleteSong(id) {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('songs', 'readwrite')
    const store = tx.objectStore('songs')
    const request = store.delete(id)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

// ─── Setlists ───

export async function getAllSetlists() {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('setlists', 'readonly')
    const store = tx.objectStore('setlists')
    const request = store.getAll()
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function getSetlist(id) {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('setlists', 'readonly')
    const store = tx.objectStore('setlists')
    const request = store.get(id)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function saveSetlist(setlist) {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('setlists', 'readwrite')
    const store = tx.objectStore('setlists')
    const now = Date.now()
    if (setlist.id) {
      const getReq = store.get(setlist.id)
      getReq.onsuccess = () => {
        const existing = getReq.result || {}
        const updated = { ...existing, ...setlist, updatedAt: now }
        const putReq = store.put(updated)
        putReq.onsuccess = () => resolve(updated.id)
        putReq.onerror = () => reject(putReq.error)
      }
      getReq.onerror = () => reject(getReq.error)
    } else {
      const newSetlist = { ...setlist, createdAt: now, updatedAt: now }
      delete newSetlist.id
      const addReq = store.add(newSetlist)
      addReq.onsuccess = () => resolve(addReq.result)
      addReq.onerror = () => reject(addReq.error)
    }
  })
}

export async function deleteSetlist(id) {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('setlists', 'readwrite')
    const store = tx.objectStore('setlists')
    const request = store.delete(id)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

// ─── Sessions (append-only, auto-logged) ───

export async function getAllSessions() {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('sessions', 'readonly')
    const store = tx.objectStore('sessions')
    const request = store.getAll()
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function saveSession(session) {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('sessions', 'readwrite')
    const store = tx.objectStore('sessions')
    const now = Date.now()
    const newSession = { ...session, createdAt: now, updatedAt: now }
    delete newSession.id
    const addReq = store.add(newSession)
    addReq.onsuccess = () => resolve(addReq.result)
    addReq.onerror = () => reject(addReq.error)
  })
}

// ─── Practice entries (manual journal) ───

export async function getAllPracticeEntries() {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('practiceEntries', 'readonly')
    const store = tx.objectStore('practiceEntries')
    const request = store.getAll()
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function getPracticeEntry(id) {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('practiceEntries', 'readonly')
    const store = tx.objectStore('practiceEntries')
    const request = store.get(id)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function savePracticeEntry(entry) {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('practiceEntries', 'readwrite')
    const store = tx.objectStore('practiceEntries')
    const now = Date.now()
    if (entry.id) {
      const getReq = store.get(entry.id)
      getReq.onsuccess = () => {
        const existing = getReq.result || {}
        const updated = { ...existing, ...entry, updatedAt: now }
        const putReq = store.put(updated)
        putReq.onsuccess = () => resolve(updated.id)
        putReq.onerror = () => reject(putReq.error)
      }
      getReq.onerror = () => reject(getReq.error)
    } else {
      const newEntry = { ...entry, createdAt: now, updatedAt: now }
      delete newEntry.id
      const addReq = store.add(newEntry)
      addReq.onsuccess = () => resolve(addReq.result)
      addReq.onerror = () => reject(addReq.error)
    }
  })
}

export async function deletePracticeEntry(id) {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('practiceEntries', 'readwrite')
    const store = tx.objectStore('practiceEntries')
    const request = store.delete(id)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}
