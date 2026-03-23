'use client'

import { memo } from 'react'
import { ChevronRight, Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { JsonNode } from '@/lib/types'
import { getValueColor, truncateValue, copyToClipboard } from '@/lib/json-utils'
import { useState } from 'react'

interface TreeNodeProps {
  node: JsonNode
  isExpanded: boolean
  isSelected: boolean
  onToggle: (id: string) => void
  onSelect: (id: string) => void
  searchQuery?: string
}

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query) return text
  
  const lowerText = text.toLowerCase()
  const lowerQuery = query.toLowerCase()
  const index = lowerText.indexOf(lowerQuery)
  
  if (index === -1) return text
  
  return (
    <>
      {text.slice(0, index)}
      <mark className="bg-yellow-300 dark:bg-yellow-500/50 text-foreground rounded px-0.5">
        {text.slice(index, index + query.length)}
      </mark>
      {text.slice(index + query.length)}
    </>
  )
}

function formatValue(value: unknown, type: string): string {
  if (type === 'string') return `"${value}"`
  if (type === 'null') return 'null'
  return String(value)
}

export const TreeNodeComponent = memo(function TreeNodeComponent({
  node,
  isExpanded,
  isSelected,
  onToggle,
  onSelect,
  searchQuery
}: TreeNodeProps) {
  const [copied, setCopied] = useState(false)
  const hasChildren = node.children && node.children.length > 0
  const isRoot = node.depth === 0

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const textToCopy = hasChildren 
      ? JSON.stringify(node.value, null, 2)
      : formatValue(node.value, node.type)
    
    await copyToClipboard(textToCopy)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const renderValue = () => {
    if (hasChildren) {
      const childCount = node.children!.length
      const brackets = node.type === 'array' ? '[]' : '{}'
      return (
        <span className="text-muted-foreground" aria-label={`${childCount} items`}>
          {brackets[0]}
          {!isExpanded && (
            <span className="text-xs ml-1">
              {childCount} {childCount === 1 ? 'item' : 'items'}
            </span>
          )}
          {!isExpanded && brackets[1]}
        </span>
      )
    }

    const valueStr = formatValue(node.value, node.type)
    return (
      <span className={cn('font-mono', getValueColor(node.type))} aria-label={`${node.type} value ${valueStr}`}>
        {truncateValue(searchQuery ? String(highlightMatch(valueStr, searchQuery)) : valueStr, 50)}
      </span>
    )
  }

  return (
    <div
      className={cn(
        'group select-none',
        isSelected && 'bg-accent rounded'
      )}
      style={{ paddingLeft: isRoot ? 0 : node.depth * 16 }}
      role="treeitem"
      aria-expanded={hasChildren ? isExpanded : undefined}
      aria-selected={isSelected}
    >
      <div
        onClick={() => {
          onSelect(node.id)
          if (hasChildren) onToggle(node.id)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onSelect(node.id)
            if (hasChildren) onToggle(node.id)
          }
        }}
        tabIndex={0}
        className={cn(
          'flex items-center gap-1 py-1 px-2 rounded cursor-pointer',
          'hover:bg-accent/50 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
        )}
      >
        <span className="w-4 h-4 flex items-center justify-center flex-shrink-0" aria-hidden="true">
          {hasChildren && (
            <ChevronRight
              className={cn(
                'w-3.5 h-3.5 text-muted-foreground transition-transform duration-150',
                isExpanded && 'rotate-90'
              )}
            />
          )}
        </span>

        {!isRoot && (
          <>
            <span
              className={cn(
                'font-mono text-sm',
                node.type === 'array' ? 'text-blue-500 dark:text-blue-400' : 'text-foreground'
              )}
              aria-label={`Key ${node.key}`}
            >
              {searchQuery ? highlightMatch(node.key, searchQuery) : node.key}
            </span>
            <span className="text-muted-foreground mx-1" aria-hidden="true">:</span>
          </>
        )}

        {renderValue()}

        <button
          onClick={handleCopy}
          className={cn(
            'ml-auto p-1 rounded opacity-0 group-hover:opacity-100 focus:opacity-100',
            'hover:bg-muted transition-all',
            'text-muted-foreground hover:text-foreground',
            'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
          )}
          title="Copy value"
          aria-label={`Copy value of ${node.key || 'root'}`}
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-emerald-500" aria-hidden="true" />
          ) : (
            <Copy className="w-3.5 h-3.5" aria-hidden="true" />
          )}
        </button>
      </div>
    </div>
  )
})
