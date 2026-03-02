import { useSyncExternalStore, useCallback } from 'react'
import type { JsonNode, ViewMode, TreeStats, SearchResult } from './types'
import { parseJsonToTree, calculateStats, searchTree, resetNodeIdCounter } from './json-utils'

interface JsonTreeState {
  rawJson: string
  tree: JsonNode | null
  stats: TreeStats | null
  viewMode: ViewMode
  searchQuery: string
  searchResults: SearchResult[]
  selectedNodeId: string | null
  expandedNodes: Set<string>
  isValid: boolean
  error: string | null
  history: string[]
  historyIndex: number
}

const defaultJson = `{
  "name": "JSON Tree Viewer",
  "version": "1.0.0",
  "description": "A powerful JSON visualization tool",
  "features": [
    "Tree View",
    "Graph View",
    "Search",
    "Format & Minify",
    "Dark Mode"
  ],
  "author": {
    "name": "Developer",
    "email": "dev@example.com"
  },
  "config": {
    "maxDepth": 10,
    "autoExpand": true,
    "syntaxHighlight": true
  },
  "stats": {
    "users": 1000,
    "stars": 500,
    "forks": 100
  },
  "isPublic": true,
  "license": null
}`

function createInitialState(): JsonTreeState {
  resetNodeIdCounter()
  let tree: JsonNode | null = null
  let stats: TreeStats | null = null
  let isValid = false
  let error: string | null = null

  try {
    const parsed = JSON.parse(defaultJson)
    tree = parseJsonToTree(parsed)
    stats = calculateStats(tree)
    isValid = true
  } catch (e) {
    error = (e as Error).message
  }

  return {
    rawJson: defaultJson,
    tree,
    stats,
    viewMode: 'tree',
    searchQuery: '',
    searchResults: [],
    selectedNodeId: null,
    expandedNodes: new Set(tree ? collectExpandedNodes(tree) : []),
    isValid,
    error,
    history: [defaultJson],
    historyIndex: 0
  }
}

function collectExpandedNodes(node: JsonNode): string[] {
  const ids: string[] = []
  function traverse(n: JsonNode) {
    if (n.isExpanded) ids.push(n.id)
    n.children?.forEach(traverse)
  }
  traverse(node)
  return ids
}

let state: JsonTreeState = createInitialState()
const listeners = new Set<() => void>()

function emitChange() {
  listeners.forEach(listener => listener())
}

function getSnapshot(): JsonTreeState {
  return state
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

// Actions
export function setRawJson(json: string, addToHistory = true) {
  resetNodeIdCounter()
  let tree: JsonNode | null = null
  let stats: TreeStats | null = null
  let isValid = false
  let error: string | null = null

  try {
    const parsed = JSON.parse(json)
    tree = parseJsonToTree(parsed)
    stats = calculateStats(tree)
    isValid = true
  } catch (e) {
    error = (e as Error).message
  }

  const newHistory = addToHistory && json !== state.rawJson
    ? [...state.history.slice(0, state.historyIndex + 1), json]
    : state.history

  state = {
    ...state,
    rawJson: json,
    tree,
    stats,
    isValid,
    error,
    expandedNodes: new Set(tree ? collectExpandedNodes(tree) : []),
    searchResults: state.searchQuery && tree 
      ? searchTree(tree, state.searchQuery)
      : [],
    history: newHistory,
    historyIndex: addToHistory && json !== state.rawJson 
      ? newHistory.length - 1 
      : state.historyIndex
  }
  emitChange()
}

export function setViewMode(mode: ViewMode) {
  state = { ...state, viewMode: mode }
  emitChange()
}

export function setSearchQuery(query: string) {
  const searchResults = query && state.tree 
    ? searchTree(state.tree, query)
    : []
  
  state = { ...state, searchQuery: query, searchResults }
  emitChange()
}

export function toggleNode(nodeId: string) {
  const newExpanded = new Set(state.expandedNodes)
  if (newExpanded.has(nodeId)) {
    newExpanded.delete(nodeId)
  } else {
    newExpanded.add(nodeId)
  }
  state = { ...state, expandedNodes: newExpanded }
  emitChange()
}

export function expandAll() {
  if (!state.tree) return
  
  const allIds: string[] = []
  function traverse(node: JsonNode) {
    if (node.children?.length) {
      allIds.push(node.id)
      node.children.forEach(traverse)
    }
  }
  traverse(state.tree)
  
  state = { ...state, expandedNodes: new Set(allIds) }
  emitChange()
}

export function collapseAll() {
  state = { ...state, expandedNodes: new Set() }
  emitChange()
}

export function selectNode(nodeId: string | null) {
  state = { ...state, selectedNodeId: nodeId }
  emitChange()
}

export function undo() {
  if (state.historyIndex > 0) {
    const newIndex = state.historyIndex - 1
    setRawJson(state.history[newIndex], false)
    state = { ...state, historyIndex: newIndex }
    emitChange()
  }
}

export function redo() {
  if (state.historyIndex < state.history.length - 1) {
    const newIndex = state.historyIndex + 1
    setRawJson(state.history[newIndex], false)
    state = { ...state, historyIndex: newIndex }
    emitChange()
  }
}

// Hook
export function useJsonTreeStore() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  
  return {
    ...snapshot,
    setRawJson: useCallback((json: string) => setRawJson(json), []),
    setViewMode: useCallback((mode: ViewMode) => setViewMode(mode), []),
    setSearchQuery: useCallback((query: string) => setSearchQuery(query), []),
    toggleNode: useCallback((id: string) => toggleNode(id), []),
    expandAll: useCallback(() => expandAll(), []),
    collapseAll: useCallback(() => collapseAll(), []),
    selectNode: useCallback((id: string | null) => selectNode(id), []),
    undo: useCallback(() => undo(), []),
    redo: useCallback(() => redo(), []),
    canUndo: snapshot.historyIndex > 0,
    canRedo: snapshot.historyIndex < snapshot.history.length - 1
  }
}
