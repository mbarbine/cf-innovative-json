'use client'

import { useEffect, useCallback } from 'react'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { useJsonTreeStore } from '@/lib/store'
import { formatJson, minifyJson } from '@/lib/json-utils'
import { JsonEditor } from './json-editor'
import { TreeView } from './tree-view'
import { GraphView } from './graph-view'
import { Toolbar } from './toolbar'
import { StatsPanel } from './stats-panel'
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

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const isMeta = e.metaKey || e.ctrlKey
    
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
    if (!isMeta && e.key === '1') {
      setViewMode('tree')
    }
    if (!isMeta && e.key === '2') {
      setViewMode('graph')
    }
    if (!isMeta && e.key === '3') {
      setViewMode('raw')
    }
  }, [undo, redo, isValid, rawJson, setRawJson, expandAll, collapseAll, setViewMode])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

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
      />

      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Editor Panel */}
        <ResizablePanel defaultSize={40} minSize={25}>
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
        <ResizablePanel defaultSize={60} minSize={30}>
          <div className="flex flex-col h-full">
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
      </ResizablePanelGroup>
    </div>
  )
}
