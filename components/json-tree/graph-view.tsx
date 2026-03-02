'use client'

import { memo, useMemo, useRef, useEffect, useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import type { JsonNode } from '@/lib/types'
import { getValueColor } from '@/lib/json-utils'

interface GraphViewProps {
  tree: JsonNode | null
  selectedNodeId: string | null
  onSelect: (id: string | null) => void
  className?: string
}

interface PositionedNode {
  node: JsonNode
  x: number
  y: number
  width: number
  height: number
}

interface Edge {
  from: PositionedNode
  to: PositionedNode
}

const NODE_WIDTH = 160
const NODE_HEIGHT = 48
const HORIZONTAL_SPACING = 80
const VERTICAL_SPACING = 24

function calculateLayout(tree: JsonNode): { nodes: PositionedNode[]; edges: Edge[]; width: number; height: number } {
  const nodes: PositionedNode[] = []
  const edges: Edge[] = []
  const levelHeights: number[] = []
  
  // First pass: calculate heights at each level
  function calculateHeights(node: JsonNode, depth: number): number {
    if (!node.children || node.children.length === 0) {
      levelHeights[depth] = Math.max(levelHeights[depth] || 0, 1)
      return 1
    }
    
    let totalHeight = 0
    for (const child of node.children.slice(0, 10)) { // Limit children for performance
      totalHeight += calculateHeights(child, depth + 1)
    }
    
    levelHeights[depth] = Math.max(levelHeights[depth] || 0, totalHeight)
    return totalHeight
  }
  
  calculateHeights(tree, 0)
  
  // Second pass: position nodes
  function positionNode(
    node: JsonNode,
    depth: number,
    startY: number,
    parentPos?: PositionedNode
  ): number {
    const x = depth * (NODE_WIDTH + HORIZONTAL_SPACING) + 50
    
    let height = NODE_HEIGHT + VERTICAL_SPACING
    if (node.children && node.children.length > 0) {
      const childHeights = node.children.slice(0, 10).map(child => {
        const h = calculateHeights(child, depth + 1)
        return h * (NODE_HEIGHT + VERTICAL_SPACING)
      })
      height = childHeights.reduce((a, b) => a + b, 0)
    }
    
    const y = startY + height / 2 - NODE_HEIGHT / 2
    
    const posNode: PositionedNode = {
      node,
      x,
      y,
      width: NODE_WIDTH,
      height: NODE_HEIGHT
    }
    
    nodes.push(posNode)
    
    if (parentPos) {
      edges.push({ from: parentPos, to: posNode })
    }
    
    if (node.children && node.children.length > 0) {
      let currentY = startY
      for (const child of node.children.slice(0, 10)) {
        const childHeight = positionNode(child, depth + 1, currentY, posNode)
        currentY += childHeight
      }
    }
    
    return height
  }
  
  positionNode(tree, 0, 50)
  
  const maxX = Math.max(...nodes.map(n => n.x + n.width)) + 50
  const maxY = Math.max(...nodes.map(n => n.y + n.height)) + 50
  
  return { nodes, edges, width: maxX, height: maxY }
}

function GraphNode({ 
  posNode, 
  isSelected, 
  onSelect 
}: { 
  posNode: PositionedNode
  isSelected: boolean
  onSelect: (id: string) => void 
}) {
  const { node, x, y, width, height } = posNode
  const hasChildren = node.children && node.children.length > 0
  
  const displayValue = useMemo(() => {
    if (hasChildren) {
      return node.type === 'array' 
        ? `[${node.children!.length}]`
        : `{${node.children!.length}}`
    }
    if (node.type === 'string') {
      const str = String(node.value)
      return str.length > 12 ? `"${str.slice(0, 12)}..."` : `"${str}"`
    }
    if (node.type === 'null') return 'null'
    return String(node.value)
  }, [node, hasChildren])

  return (
    <g 
      transform={`translate(${x}, ${y})`}
      onClick={() => onSelect(node.id)}
      className="cursor-pointer"
    >
      <rect
        width={width}
        height={height}
        rx={8}
        className={cn(
          'transition-all duration-150',
          isSelected 
            ? 'fill-primary stroke-primary' 
            : 'fill-card stroke-border hover:stroke-primary/50'
        )}
        strokeWidth={2}
      />
      <text
        x={width / 2}
        y={16}
        textAnchor="middle"
        className={cn(
          'text-xs font-medium',
          isSelected ? 'fill-primary-foreground' : 'fill-foreground'
        )}
      >
        {node.key.length > 14 ? node.key.slice(0, 14) + '...' : node.key}
      </text>
      <text
        x={width / 2}
        y={34}
        textAnchor="middle"
        className={cn(
          'text-xs font-mono',
          isSelected ? 'fill-primary-foreground/70' : getValueColor(node.type)
        )}
      >
        {displayValue}
      </text>
    </g>
  )
}

export const GraphView = memo(function GraphView({
  tree,
  selectedNodeId,
  onSelect,
  className
}: GraphViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  const layout = useMemo(() => {
    if (!tree) return null
    return calculateLayout(tree)
  }, [tree])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return
    setIsDragging(true)
    setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y })
  }, [transform])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return
    setTransform(t => ({
      ...t,
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    }))
  }, [isDragging, dragStart])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setTransform(t => ({
      ...t,
      scale: Math.min(Math.max(t.scale * delta, 0.1), 3)
    }))
  }, [])

  useEffect(() => {
    const handleGlobalMouseUp = () => setIsDragging(false)
    window.addEventListener('mouseup', handleGlobalMouseUp)
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp)
  }, [])

  if (!tree || !layout) {
    return (
      <div className={cn('flex items-center justify-center h-full text-muted-foreground', className)}>
        Enter valid JSON to see the graph view
      </div>
    )
  }

  return (
    <div 
      ref={containerRef}
      className={cn('relative overflow-hidden h-full bg-muted/20', className)}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      <svg
        width="100%"
        height="100%"
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          transformOrigin: '0 0'
        }}
      >
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon 
              points="0 0, 10 3.5, 0 7" 
              className="fill-border"
            />
          </marker>
        </defs>

        {/* Edges */}
        {layout.edges.map((edge, i) => {
          const startX = edge.from.x + edge.from.width
          const startY = edge.from.y + edge.from.height / 2
          const endX = edge.to.x
          const endY = edge.to.y + edge.to.height / 2
          const midX = (startX + endX) / 2

          return (
            <path
              key={i}
              d={`M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`}
              className="stroke-border fill-none"
              strokeWidth={2}
              markerEnd="url(#arrowhead)"
            />
          )
        })}

        {/* Nodes */}
        {layout.nodes.map(posNode => (
          <GraphNode
            key={posNode.node.id}
            posNode={posNode}
            isSelected={selectedNodeId === posNode.node.id}
            onSelect={onSelect}
          />
        ))}
      </svg>

      <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-background/80 backdrop-blur-sm rounded-lg p-2 border border-border">
        <button
          onClick={() => setTransform(t => ({ ...t, scale: Math.min(t.scale * 1.2, 3) }))}
          className="p-1 hover:bg-accent rounded"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35M11 8v6M8 11h6" />
          </svg>
        </button>
        <span className="text-xs text-muted-foreground min-w-[3rem] text-center">
          {Math.round(transform.scale * 100)}%
        </span>
        <button
          onClick={() => setTransform(t => ({ ...t, scale: Math.max(t.scale * 0.8, 0.1) }))}
          className="p-1 hover:bg-accent rounded"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35M8 11h6" />
          </svg>
        </button>
        <button
          onClick={() => setTransform({ x: 0, y: 0, scale: 1 })}
          className="p-1 hover:bg-accent rounded text-xs"
        >
          Reset
        </button>
      </div>
    </div>
  )
})
