'use client'

import { memo } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { TreeNodeComponent } from './tree-node'
import type { JsonNode } from '@/lib/types'
import { cn } from '@/lib/utils'

interface TreeViewProps {
  tree: JsonNode | null
  expandedNodes: Set<string>
  selectedNodeId: string | null
  searchQuery: string
  onToggle: (id: string) => void
  onSelect: (id: string | null) => void
  className?: string
}

export const TreeView = memo(function TreeView({
  tree,
  expandedNodes,
  selectedNodeId,
  searchQuery,
  onToggle,
  onSelect,
  className
}: TreeViewProps) {
  if (!tree) {
    return (
      <div className={cn('flex items-center justify-center h-full text-muted-foreground', className)}>
        Enter valid JSON to see the tree view
      </div>
    )
  }

  function renderNode(node: JsonNode): React.ReactNode {
    const isExpanded = expandedNodes.has(node.id)
    const isSelected = selectedNodeId === node.id

    return (
      <div key={node.id}>
        <TreeNodeComponent
          node={node}
          isExpanded={isExpanded}
          isSelected={isSelected}
          onToggle={onToggle}
          onSelect={onSelect}
          searchQuery={searchQuery}
        />
        {isExpanded && node.children && (
          <div className="border-l border-border/50 ml-4">
            {node.children.map(child => renderNode(child))}
          </div>
        )}
        {isExpanded && node.children && node.children.length > 0 && (
          <div 
            className="text-muted-foreground font-mono text-sm py-1 px-2"
            style={{ paddingLeft: (node.depth + 1) * 16 + 20 }}
          >
            {node.type === 'array' ? ']' : '}'}
          </div>
        )}
      </div>
    )
  }

  return (
    <ScrollArea className={cn('h-full', className)}>
      <div className="p-4 font-mono text-sm">
        {renderNode(tree)}
      </div>
    </ScrollArea>
  )
})
