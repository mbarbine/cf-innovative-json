'use client'

const DB_NAME = 'json-tree-platphorm-schema-registry'
const DB_VERSION = 1
const DRAFT_STORE = 'json-drafts'
const CURRENT_DRAFT_ID = 'current'

export type LocalJsonDraft = {
  id: string
  title: string
  content: string
  storageMode: 'indexeddb'
  syncStatus: 'local_only'
  updatedAt: string
}

function openDraftDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(DRAFT_STORE)) {
        db.createObjectStore(DRAFT_STORE, { keyPath: 'id' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function loadLocalJsonDraft(): Promise<LocalJsonDraft | null> {
  if (typeof indexedDB === 'undefined') return null
  const db = await openDraftDb()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(DRAFT_STORE, 'readonly')
    const request = transaction.objectStore(DRAFT_STORE).get(CURRENT_DRAFT_ID)
    request.onsuccess = () => resolve(request.result || null)
    request.onerror = () => reject(request.error)
    transaction.oncomplete = () => db.close()
  })
}

export async function saveLocalJsonDraft(content: string): Promise<LocalJsonDraft> {
  if (typeof indexedDB === 'undefined') {
    throw new Error('IndexedDB is unavailable in this browser context.')
  }

  const draft: LocalJsonDraft = {
    id: CURRENT_DRAFT_ID,
    title: 'Local JSON draft',
    content,
    storageMode: 'indexeddb',
    syncStatus: 'local_only',
    updatedAt: new Date().toISOString(),
  }
  const db = await openDraftDb()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(DRAFT_STORE, 'readwrite')
    const request = transaction.objectStore(DRAFT_STORE).put(draft)
    request.onsuccess = () => resolve(draft)
    request.onerror = () => reject(request.error)
    transaction.oncomplete = () => db.close()
  })
}
