'use client'

import { memo, useState, useCallback } from 'react'
import { Plus, Minus, PenLine, X, ArrowLeftRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { DiffResult } from '@/lib/types'

interface DiffViewProps {
  sourceJson: string
  targetJson: string
  onClose: () => void
  className?: string
}

function computeDiff(source: string, target: string): DiffResult | { error: string } {
  try {
    const sourceObj = JSON.parse(source)
    const targetObj = JSON.parse(target)
    
    const result: DiffResult = {
      added: [],
      removed: [],
      modified: []
    }

    function getAllPaths(obj: unknown, prefix: string = ''): Map<string, unknown> {
      const paths = new Map<string, unknown>()
      
      if (obj === null || typeof obj !== 'object') {
        paths.set(prefix || '$', obj)
        return paths
      }

      if (Array.isArray(obj)) {
        paths.set(prefix || '$', `Array[${obj.length}]`)
        obj.forEach((item, index) => {
          const itemPaths = getAllPaths(item, `${prefix}[${index}]`)
          itemPaths.forEach((v, k) => paths.set(k, v))
        })
      } else {
        paths.set(prefix || '$', `Object{${Object.keys(obj).length}}`)
        Object.entries(obj).forEach(([key, value]) => {
          const newPrefix = prefix ? `${prefix}.${key}` : key
          const subPaths = getAllPaths(value, newPrefix)
          subPaths.forEach((v, k) => paths.set(k, v))
        })
      }

      return paths
    }

    const sourcePaths = getAllPaths(sourceObj)
    const targetPaths = getAllPaths(targetObj)

    sourcePaths.forEach((value, path) => {
      if (!targetPaths.has(path)) {
        result.removed.push(path)
      } else if (JSON.stringify(value) !== JSON.stringify(targetPaths.get(path))) {
        result.modified.push({
          path,
          oldValue: value,
          newValue: targetPaths.get(path)
        })
      }
    })

    targetPaths.forEach((_, path) => {
      if (!sourcePaths.has(path)) {
        result.added.push(path)
      }
    })

    return result
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export const DiffView = memo(function DiffView({
  sourceJson,
  targetJson,
  onClose,
  className
}: DiffViewProps) {
  const diff = computeDiff(sourceJson, targetJson)
  
  if ('error' in diff) {
    return (
      <div className={cn('flex flex-col h-full', className)}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="font-medium flex items-center gap-2">
            <ArrowLeftRight className="w-4 h-4" />
            JSON Diff
          </h3>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close diff view">
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex-1 flex items-center justify-center text-destructive">
          Error: {diff.error}
        </div>
      </div>
    )
  }
  
  const totalChanges = diff.added.length + diff.removed.length + diff.modified.length
  
  return (
    <div className={cn('flex flex-col h-full bg-background', className)}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-3">
          <h3 className="font-medium flex items-center gap-2">
            <ArrowLeftRight className="w-4 h-4" />
            JSON Diff
          </h3>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600">
              <Plus className="w-3 h-3 mr-1" />
              {diff.added.length}
            </Badge>
            <Badge variant="secondary" className="bg-red-500/10 text-red-600">
              <Minus className="w-3 h-3 mr-1" />
              {diff.removed.length}
            </Badge>
            <Badge variant="secondary" className="bg-amber-500/10 text-amber-600">
              <PenLine className="w-3 h-3 mr-1" />
              {diff.modified.length}
            </Badge>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close diff view">
          <X className="w-4 h-4" />
        </Button>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {totalChanges === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No differences found - JSON objects are identical
            </div>
          ) : (
            <>
              {/* Added */}
              {diff.added.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-emerald-600 flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Added ({diff.added.length})
                  </h4>
                  <div className="space-y-1">
                    {diff.added.map((path, i) => (
                      <div 
                        key={i}
                        className="px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded text-sm font-mono"
                      >
                        <span className="text-emerald-600">+ {path}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Removed */}
              {diff.removed.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-red-600 flex items-center gap-2">
                    <Minus className="w-4 h-4" />
                    Removed ({diff.removed.length})
                  </h4>
                  <div className="space-y-1">
                    {diff.removed.map((path, i) => (
                      <div 
                        key={i}
                        className="px-3 py-2 bg-red-500/10 border border-red-500/20 rounded text-sm font-mono"
                      >
                        <span className="text-red-600">- {path}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Modified */}
              {diff.modified.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-amber-600 flex items-center gap-2">
                    <PenLine className="w-4 h-4" />
                    Modified ({diff.modified.length})
                  </h4>
                  <div className="space-y-1">
                    {diff.modified.map((change, i) => (
                      <div 
                        key={i}
                        className="px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded text-sm font-mono space-y-1"
                      >
                        <div className="text-amber-600 font-medium">{change.path}</div>
                        <div className="flex items-start gap-2 text-xs">
                          <span className="text-red-500 line-through">
                            {JSON.stringify(change.oldValue)}
                          </span>
                          <span className="text-muted-foreground">→</span>
                          <span className="text-emerald-500">
                            {JSON.stringify(change.newValue)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  )
})
