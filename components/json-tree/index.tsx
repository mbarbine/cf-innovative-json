'use client'

import { useEffect, useCallback, useState } from 'react'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { useJsonTreeStore } from '@/lib/store'
import { formatJson, minifyJson } from '@/lib/json-utils'
import { parseUrlParams } from '@/lib/sharing'
import { JsonEditor } from './json-editor'
import { TreeView } from './tree-view'
import { GraphView } from './graph-view'
import { Toolbar } from './toolbar'
import { StatsPanel } from './stats-panel'
import { PathBreadcrumb } from './path-breadcrumb'
import { DiffView } from './diff-view'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

export function JsonTree() {
  const {
    rawJson,
    setRawJson,
    tree,
    stats,
    viewMode,
    setViewMode,
    searchQuery,
    setSearchQuery,
    searchResults,
    selectedNodeId,
    selectNode,
    expandedNodes,
    toggleNode,
    expandAll,
    collapseAll,
    isValid,
    error,
    undo,
    redo,
    canUndo,
    canRedo
  } = useJsonTreeStore()
  
  const [isDiffOpen, setIsDiffOpen] = useState(false)
  const [compareJson, setCompareJson] = useState('')
  const [selectedPath, setSelectedPath] = useState<string[]>([])
  
  // Load JSON from URL params on mount
  useEffect(() => {
    const shared = parseUrlParams()
    if (shared?.json) {
      setRawJson(shared.json)
      if (shared.viewMode) {
        setViewMode(shared.viewMode)
      }
    }
  }, [setRawJson, setViewMode])
  
  // Update selected path when node is selected
  useEffect(() => {
    if (selectedNodeId && tree) {
      const findNode = (node: typeof tree, targetId: string): string[] | null => {
        if (node.id === targetId) return node.path
        if (node.children) {
          for (const child of node.children) {
            const found = findNode(child, targetId)
            if (found) return found
          }
        }
        return null
      }
      const path = findNode(tree, selectedNodeId)
      if (path) setSelectedPath(path)
    } else {
      setSelectedPath([])
    }
  }, [selectedNodeId, tree])

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const isMeta = e.metaKey || e.ctrlKey
    const target = e.target as HTMLElement
    
    // Skip shortcuts when typing in input/textarea
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
      // Only allow specific shortcuts in editor
      if (!(isMeta && (e.key === 'z' || e.key === 's'))) return
    }
    
    if (isMeta && e.key === 'z' && !e.shiftKey) {
      e.preventDefault()
      undo()
    }
    if (isMeta && e.key === 'z' && e.shiftKey) {
      e.preventDefault()
      redo()
    }
    if (isMeta && e.shiftKey && e.key === 'f') {
      e.preventDefault()
      if (isValid) {
        try {
          setRawJson(formatJson(rawJson, 2))
        } catch {}
      }
    }
    if (isMeta && e.shiftKey && e.key === 'm') {
      e.preventDefault()
      if (isValid) {
        try {
          setRawJson(minifyJson(rawJson))
        } catch {}
      }
    }
    if (isMeta && e.key === 'e' && !e.shiftKey) {
      e.preventDefault()
      expandAll()
    }
    if (isMeta && e.shiftKey && e.key === 'e') {
      e.preventDefault()
      collapseAll()
    }
    if (isMeta && e.key === 'd') {
      e.preventDefault()
      setIsDiffOpen(prev => !prev)
    }
    if (e.key === 'Escape') {
      setIsDiffOpen(false)
      selectNode(null)
    }
    if (!isMeta && !e.shiftKey && e.key === '1') {
      setViewMode('tree')
    }
    if (!isMeta && !e.shiftKey && e.key === '2') {
      setViewMode('graph')
    }
    if (!isMeta && !e.shiftKey && e.key === '3') {
      setViewMode('raw')
    }
  }, [undo, redo, isValid, rawJson, setRawJson, expandAll, collapseAll, setViewMode, selectNode])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const handleNavigateToPath = useCallback((path: string[]) => {
    if (!tree) return
    const findNode = (node: typeof tree, targetPath: string[]): string | null => {
      if (node.path.join('/') === targetPath.join('/')) return node.id
      if (node.children) {
        for (const child of node.children) {
          const found = findNode(child, targetPath)
          if (found) return found
        }
      }
      return null
    }
    const nodeId = findNode(tree, path)
    if (nodeId) selectNode(nodeId)
  }, [tree, selectNode])

  return (
    <div className="flex flex-col h-full bg-background">
      <Toolbar
        viewMode={viewMode}
        setViewMode={setViewMode}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchResultCount={searchResults.length}
        rawJson={rawJson}
        setRawJson={setRawJson}
        expandAll={expandAll}
        collapseAll={collapseAll}
        undo={undo}
        redo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        stats={stats}
        isValid={isValid}
        onOpenDiff={() => setIsDiffOpen(prev => !prev)}
        isDiffOpen={isDiffOpen}
      />

      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Editor Panel */}
        <ResizablePanel defaultSize={isDiffOpen ? 30 : 40} minSize={20}>
          <JsonEditor
            value={rawJson}
            onChange={setRawJson}
            isValid={isValid}
            error={error}
            className="h-full"
          />
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* View Panel */}
        <ResizablePanel defaultSize={isDiffOpen ? 40 : 60} minSize={25}>
          <div className="flex flex-col h-full">
            {/* Path Breadcrumb */}
            {selectedPath.length > 0 && (
              <PathBreadcrumb 
                path={selectedPath} 
                onNavigate={handleNavigateToPath}
              />
            )}
            
            <div className="flex-1 overflow-hidden">
              {viewMode === 'tree' && (
                <TreeView
                  tree={tree}
                  expandedNodes={expandedNodes}
                  selectedNodeId={selectedNodeId}
                  searchQuery={searchQuery}
                  onToggle={toggleNode}
                  onSelect={selectNode}
                />
              )}
              {viewMode === 'graph' && (
                <GraphView
                  tree={tree}
                  selectedNodeId={selectedNodeId}
                  onSelect={selectNode}
                />
              )}
              {viewMode === 'raw' && (
                <ScrollArea className="h-full">
                  <pre className={cn(
                    'p-4 font-mono text-sm whitespace-pre-wrap break-all',
                    isValid ? 'text-foreground' : 'text-destructive'
                  )}>
                    {isValid ? JSON.stringify(JSON.parse(rawJson), null, 2) : rawJson}
                  </pre>
                </ScrollArea>
              )}
            </div>
            
            <StatsPanel stats={stats} />
          </div>
        </ResizablePanel>
        
        {/* Diff Panel */}
        {isDiffOpen && (
          <>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={30} minSize={20}>
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30">
                  <span className="text-sm font-medium">Compare JSON</span>
                </div>
                <div className="flex-1 relative">
                  <textarea
                    value={compareJson}
                    onChange={(e) => setCompareJson(e.target.value)}
                    placeholder="Paste JSON to compare..."
                    className="absolute inset-0 w-full h-full p-3 font-mono text-sm bg-background resize-none border-0 outline-none"
                  />
                </div>
                {compareJson && isValid && (
                  <DiffView
                    sourceJson={rawJson}
                    targetJson={compareJson}
                    onClose={() => setCompareJson('')}
                    className="border-t border-border max-h-[40%]"
                  />
                )}
              </div>
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </div>
  )
}
