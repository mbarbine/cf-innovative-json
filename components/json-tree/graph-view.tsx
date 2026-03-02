'use client'

import { memo, useMemo, useRef, useEffect, useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import type { JsonNode } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  RotateCcw, 
  Move,
  ChevronRight,
  ChevronDown,
  Copy,
  Check,
  Map,
  MapPinOff,
  Expand,
  Shrink,
  Info
} from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'

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
  isCollapsed: boolean
}

interface Edge {
  from: PositionedNode
  to: PositionedNode
}

// Node dimensions - compact and clean
const NODE_WIDTH = 180
const NODE_HEIGHT = 52
const NODE_PADDING = 12
const HORIZONTAL_GAP = 80
const VERTICAL_GAP = 12
const MAX_VISIBLE_CHILDREN = 20

// Color system matching jsontree style
const TYPE_STYLES = {
  string: { 
    bg: 'bg-emerald-500/10', 
    border: 'border-emerald-500/50',
    text: 'text-emerald-500',
    fill: 'rgb(16, 185, 129)',
    fillBg: 'rgba(16, 185, 129, 0.1)'
  },
  number: { 
    bg: 'bg-blue-500/10', 
    border: 'border-blue-500/50',
    text: 'text-blue-500',
    fill: 'rgb(59, 130, 246)',
    fillBg: 'rgba(59, 130, 246, 0.1)'
  },
  boolean: { 
    bg: 'bg-violet-500/10', 
    border: 'border-violet-500/50',
    text: 'text-violet-500',
    fill: 'rgb(139, 92, 246)',
    fillBg: 'rgba(139, 92, 246, 0.1)'
  },
  null: { 
    bg: 'bg-gray-500/10', 
    border: 'border-gray-500/50',
    text: 'text-gray-500',
    fill: 'rgb(107, 114, 128)',
    fillBg: 'rgba(107, 114, 128, 0.1)'
  },
  object: { 
    bg: 'bg-amber-500/10', 
    border: 'border-amber-500/50',
    text: 'text-amber-500',
    fill: 'rgb(245, 158, 11)',
    fillBg: 'rgba(245, 158, 11, 0.1)'
  },
  array: { 
    bg: 'bg-pink-500/10', 
    border: 'border-pink-500/50',
    text: 'text-pink-500',
    fill: 'rgb(236, 72, 153)',
    fillBg: 'rgba(236, 72, 153, 0.1)'
  },
}

function calculateLayout(
  tree: JsonNode, 
  collapsedNodes: Set<string>
): { nodes: PositionedNode[]; edges: Edge[]; width: number; height: number } {
  const nodes: PositionedNode[] = []
  const edges: Edge[] = []
  
  function getSubtreeHeight(node: JsonNode): number {
    if (collapsedNodes.has(node.id) || !node.children || node.children.length === 0) {
      return NODE_HEIGHT + VERTICAL_GAP
    }
    const visibleChildren = node.children.slice(0, MAX_VISIBLE_CHILDREN)
    return visibleChildren.reduce((sum, child) => sum + getSubtreeHeight(child), 0)
  }
  
  function positionNode(
    node: JsonNode,
    depth: number,
    startY: number,
    parentPos?: PositionedNode
  ): number {
    const x = depth * (NODE_WIDTH + HORIZONTAL_GAP) + 50
    const isCollapsed = collapsedNodes.has(node.id)
    
    let subtreeHeight = NODE_HEIGHT + VERTICAL_GAP
    if (!isCollapsed && node.children && node.children.length > 0) {
      const visibleChildren = node.children.slice(0, MAX_VISIBLE_CHILDREN)
      subtreeHeight = visibleChildren.reduce((sum, child) => sum + getSubtreeHeight(child), 0)
    }
    
    const y = startY + (subtreeHeight - NODE_HEIGHT) / 2
    
    const posNode: PositionedNode = {
      node,
      x,
      y,
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
      isCollapsed
    }
    
    nodes.push(posNode)
    
    if (parentPos) {
      edges.push({ from: parentPos, to: posNode })
    }
    
    if (!isCollapsed && node.children && node.children.length > 0) {
      let currentY = startY
      const visibleChildren = node.children.slice(0, MAX_VISIBLE_CHILDREN)
      for (const child of visibleChildren) {
        const childHeight = positionNode(child, depth + 1, currentY, posNode)
        currentY += childHeight
      }
    }
    
    return subtreeHeight
  }
  
  positionNode(tree, 0, 50)
  
  const maxX = Math.max(...nodes.map(n => n.x + n.width), 0) + 100
  const maxY = Math.max(...nodes.map(n => n.y + n.height), 0) + 100
  
  return { nodes, edges, width: maxX, height: maxY }
}

// Node component with comprehensive tooltips
const GraphNode = memo(function GraphNode({ 
  posNode, 
  isSelected,
  isHovered,
  isOnPath,
  onSelect,
  onHover,
  onToggleCollapse,
  onCopyPath,
  scale
}: { 
  posNode: PositionedNode
  isSelected: boolean
  isHovered: boolean
  isOnPath: boolean
  onSelect: (id: string) => void
  onHover: (id: string | null) => void
  onToggleCollapse: (id: string) => void
  onCopyPath: (path: string[]) => void
  scale: number
}) {
  const { node, x, y, width, height, isCollapsed } = posNode
  const hasChildren = node.children && node.children.length > 0
  const style = TYPE_STYLES[node.type]
  const [copied, setCopied] = useState(false)
  
  const displayValue = useMemo(() => {
    if (hasChildren) {
      const count = node.children!.length
      const hidden = count > MAX_VISIBLE_CHILDREN ? ` (+${count - MAX_VISIBLE_CHILDREN})` : ''
      return node.type === 'array' 
        ? `[${Math.min(count, MAX_VISIBLE_CHILDREN)} items${hidden}]`
        : `{${Math.min(count, MAX_VISIBLE_CHILDREN)} keys${hidden}}`
    }
    if (node.type === 'string') {
      const str = String(node.value)
      return str.length > 16 ? `"${str.slice(0, 16)}..."` : `"${str}"`
    }
    if (node.type === 'null') return 'null'
    if (node.type === 'boolean') return String(node.value)
    const numStr = String(node.value)
    return numStr.length > 12 ? numStr.slice(0, 12) + '...' : numStr
  }, [node, hasChildren])

  const fullValue = useMemo(() => {
    if (hasChildren) {
      return node.type === 'array' 
        ? `Array with ${node.children!.length} items`
        : `Object with ${node.children!.length} keys`
    }
    if (node.type === 'string') return `"${String(node.value)}"`
    return String(node.value)
  }, [node, hasChildren])

  const jsonPath = useMemo(() => {
    return '$' + node.path.map(p => 
      /^\d+$/.test(p) ? `[${p}]` : `.${p}`
    ).join('')
  }, [node.path])

  const handleCopy = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onCopyPath(node.path)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }, [node.path, onCopyPath])

  const handleToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onToggleCollapse(node.id)
  }, [node.id, onToggleCollapse])

  // Determine if we should show tooltip content (only when zoomed enough)
  const showInteractiveElements = scale > 0.4

  return (
    <g 
      transform={`translate(${x}, ${y})`}
      onClick={() => onSelect(node.id)}
      onMouseEnter={() => onHover(node.id)}
      onMouseLeave={() => onHover(null)}
      className="cursor-pointer select-none"
    >
      {/* Selection glow */}
      {isSelected && (
        <rect
          x={-6}
          y={-6}
          width={width + 12}
          height={height + 12}
          rx={14}
          fill="none"
          stroke={style.fill}
          strokeWidth={3}
          opacity={0.5}
          className="animate-pulse"
        />
      )}
      
      {/* Path highlight glow */}
      {isOnPath && !isSelected && (
        <rect
          x={-3}
          y={-3}
          width={width + 6}
          height={height + 6}
          rx={11}
          fill="none"
          stroke={style.fill}
          strokeWidth={2}
          opacity={0.3}
        />
      )}
      
      {/* Hover glow */}
      {isHovered && !isSelected && (
        <rect
          x={-4}
          y={-4}
          width={width + 8}
          height={height + 8}
          rx={12}
          fill={style.fillBg}
          stroke={style.fill}
          strokeWidth={1}
          opacity={0.4}
        />
      )}
      
      {/* Main node container */}
      <rect
        width={width}
        height={height}
        rx={8}
        fill={isSelected ? style.fill : style.fillBg}
        stroke={style.fill}
        strokeWidth={isSelected ? 2 : 1}
        className="transition-all duration-150"
      />
      
      {/* Collapse/Expand toggle */}
      {hasChildren && showInteractiveElements && (
        <g onClick={handleToggle} className="cursor-pointer">
          <rect
            x={width - 28}
            y={height / 2 - 10}
            width={20}
            height={20}
            rx={4}
            fill={isSelected ? 'rgba(255,255,255,0.2)' : style.fillBg}
            stroke={style.fill}
            strokeWidth={0.5}
          />
          {isCollapsed ? (
            <ChevronRight 
              x={width - 26} 
              y={height / 2 - 8} 
              width={16} 
              height={16}
              color={isSelected ? 'white' : style.fill}
            />
          ) : (
            <ChevronDown 
              x={width - 26} 
              y={height / 2 - 8} 
              width={16} 
              height={16}
              color={isSelected ? 'white' : style.fill}
            />
          )}
        </g>
      )}
      
      {/* Copy button (visible on hover) */}
      {isHovered && showInteractiveElements && (
        <g onClick={handleCopy} className="cursor-pointer">
          <rect
            x={8}
            y={height - 22}
            width={18}
            height={18}
            rx={4}
            fill={isSelected ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}
          />
          {copied ? (
            <Check x={10} y={height - 20} width={14} height={14} color={isSelected ? 'white' : '#22c55e'} />
          ) : (
            <Copy x={10} y={height - 20} width={14} height={14} color={isSelected ? 'white' : style.fill} />
          )}
        </g>
      )}
      
      {/* Key label */}
      <text
        x={NODE_PADDING}
        y={18}
        className="text-[11px] font-semibold"
        fill={isSelected ? 'white' : 'currentColor'}
        style={{ fontFamily: 'var(--font-sans)' }}
      >
        {node.key.length > 20 ? node.key.slice(0, 20) + '...' : node.key}
      </text>
      
      {/* Value display */}
      <text
        x={NODE_PADDING}
        y={36}
        className="text-[10px] font-mono"
        fill={isSelected ? 'rgba(255,255,255,0.85)' : style.fill}
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        {displayValue}
      </text>
      
      {/* Type badge */}
      <rect
        x={NODE_PADDING}
        y={height - 14}
        width={node.type.length * 5.5 + 8}
        height={12}
        rx={3}
        fill={isSelected ? 'rgba(255,255,255,0.15)' : style.fillBg}
        stroke={isSelected ? 'rgba(255,255,255,0.3)' : style.fill}
        strokeWidth={0.5}
      />
      <text
        x={NODE_PADDING + 4}
        y={height - 5}
        className="text-[7px] font-medium uppercase tracking-wide"
        fill={isSelected ? 'rgba(255,255,255,0.9)' : style.fill}
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        {node.type}
      </text>

      {/* Tooltip trigger overlay - invisible but captures hover for tooltip */}
      <title>{`${node.key}: ${fullValue}\nPath: ${jsonPath}\nType: ${node.type}${hasChildren ? `\nChildren: ${node.children!.length}` : ''}`}</title>
    </g>
  )
})

// Edge component with smooth bezier curves
function GraphEdge({ edge, isHighlighted }: { edge: Edge; isHighlighted: boolean }) {
  const startX = edge.from.x + edge.from.width
  const startY = edge.from.y + edge.from.height / 2
  const endX = edge.to.x
  const endY = edge.to.y + edge.to.height / 2
  
  const controlOffset = Math.min((endX - startX) * 0.5, 50)
  const pathD = `M ${startX} ${startY} C ${startX + controlOffset} ${startY}, ${endX - controlOffset} ${endY}, ${endX} ${endY}`
  
  const fromStyle = TYPE_STYLES[edge.from.node.type]
  
  return (
    <g>
      {isHighlighted && (
        <path
          d={pathD}
          fill="none"
          stroke={fromStyle.fill}
          strokeWidth={4}
          opacity={0.2}
          strokeLinecap="round"
        />
      )}
      <path
        d={pathD}
        fill="none"
        stroke={isHighlighted ? fromStyle.fill : 'currentColor'}
        strokeWidth={isHighlighted ? 2 : 1}
        opacity={isHighlighted ? 0.8 : 0.2}
        strokeLinecap="round"
        className="transition-all duration-150"
      />
      <circle
        cx={endX}
        cy={endY}
        r={isHighlighted ? 4 : 2.5}
        fill={isHighlighted ? fromStyle.fill : 'currentColor'}
        opacity={isHighlighted ? 0.8 : 0.3}
        className="transition-all duration-150"
      />
    </g>
  )
}

// Minimap component
function MiniMap({ 
  layout, 
  transform, 
  containerSize,
  onNavigate,
  collapsedCount
}: { 
  layout: { nodes: PositionedNode[]; width: number; height: number }
  transform: { x: number; y: number; scale: number }
  containerSize: { width: number; height: number }
  onNavigate: (x: number, y: number) => void
  collapsedCount: number
}) {
  const size = { width: 160, height: 100 }
  const scale = Math.min(size.width / layout.width, size.height / layout.height) * 0.85
  
  const viewWidth = containerSize.width / transform.scale
  const viewHeight = containerSize.height / transform.scale
  const viewX = -transform.x / transform.scale
  const viewY = -transform.y / transform.scale
  
  const handleClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = (e.clientX - rect.left - 8) / scale
    const clickY = (e.clientY - rect.top - 8) / scale
    onNavigate(clickX, clickY)
  }, [scale, onNavigate])
  
  return (
    <div className="bg-background/95 backdrop-blur-md rounded-xl border border-border shadow-2xl p-2 select-none">
      <div className="flex items-center justify-between mb-1.5 px-1">
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Overview</span>
        <span className="text-[9px] text-muted-foreground">
          {layout.nodes.length} nodes
          {collapsedCount > 0 && <span className="text-amber-500 ml-1">({collapsedCount} hidden)</span>}
        </span>
      </div>
      <svg 
        width={size.width} 
        height={size.height}
        className="cursor-crosshair rounded-lg bg-muted/30"
        onClick={handleClick}
      >
        <g transform={`translate(8, 8)`}>
          {layout.nodes.map((posNode) => (
            <rect
              key={posNode.node.id}
              x={posNode.x * scale}
              y={posNode.y * scale}
              width={Math.max(posNode.width * scale, 3)}
              height={Math.max(posNode.height * scale, 2)}
              rx={1}
              fill={TYPE_STYLES[posNode.node.type].fill}
              opacity={0.7}
            />
          ))}
          <rect
            x={viewX * scale}
            y={viewY * scale}
            width={Math.max(viewWidth * scale, 10)}
            height={Math.max(viewHeight * scale, 10)}
            fill="rgba(16, 185, 129, 0.1)"
            stroke="rgb(16, 185, 129)"
            strokeWidth={1.5}
            rx={2}
            className="transition-all duration-75"
          />
        </g>
      </svg>
    </div>
  )
}

// Control button with tooltip
function ControlButton({ 
  onClick, 
  icon: Icon, 
  tooltip, 
  active = false,
  disabled = false
}: { 
  onClick: () => void
  icon: React.ElementType
  tooltip: string
  active?: boolean
  disabled?: boolean
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={active ? 'secondary' : 'ghost'}
          size="icon"
          className={cn(
            "h-9 w-9 transition-all",
            active && "bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/30",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          onClick={onClick}
          disabled={disabled}
        >
          <Icon className="w-4 h-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">
        {tooltip}
      </TooltipContent>
    </Tooltip>
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
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set())
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 })
  const [showMiniMap, setShowMiniMap] = useState(true)
  const [copiedPath, setCopiedPath] = useState<string | null>(null)

  // Measure container
  useEffect(() => {
    if (!containerRef.current) return
    const observer = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect
      if (width > 0 && height > 0) {
        setContainerSize({ width, height })
      }
    })
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  const layout = useMemo(() => {
    if (!tree) return null
    return calculateLayout(tree, collapsedNodes)
  }, [tree, collapsedNodes])

  // Find nodes on path to selected
  const pathNodeIds = useMemo(() => {
    if (!selectedNodeId || !layout) return new Set<string>()
    const ids = new Set<string>()
    const findPath = (nodeId: string) => {
      ids.add(nodeId)
      for (const edge of layout.edges) {
        if (edge.to.node.id === nodeId) {
          findPath(edge.from.node.id)
          break
        }
      }
    }
    findPath(selectedNodeId)
    return ids
  }, [selectedNodeId, layout])

  const highlightedEdges = useMemo(() => {
    if (!selectedNodeId || !layout) return new Set<string>()
    const set = new Set<string>()
    const findPath = (nodeId: string) => {
      for (const edge of layout.edges) {
        if (edge.to.node.id === nodeId) {
          set.add(`${edge.from.node.id}-${edge.to.node.id}`)
          findPath(edge.from.node.id)
          break
        }
      }
    }
    findPath(selectedNodeId)
    return set
  }, [selectedNodeId, layout])

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
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    const newScale = Math.min(Math.max(transform.scale * delta, 0.1), 5)
    const scaleRatio = newScale / transform.scale
    
    setTransform(t => ({
      x: mouseX - (mouseX - t.x) * scaleRatio,
      y: mouseY - (mouseY - t.y) * scaleRatio,
      scale: newScale
    }))
  }, [transform.scale])

  const handleToggleCollapse = useCallback((nodeId: string) => {
    setCollapsedNodes(prev => {
      const next = new Set(prev)
      if (next.has(nodeId)) next.delete(nodeId)
      else next.add(nodeId)
      return next
    })
  }, [])

  const handleCopyPath = useCallback((path: string[]) => {
    const jsonPath = '$' + path.map(p => /^\d+$/.test(p) ? `[${p}]` : `.${p}`).join('')
    navigator.clipboard.writeText(jsonPath)
    setCopiedPath(jsonPath)
    setTimeout(() => setCopiedPath(null), 2000)
  }, [])

  const handleNavigate = useCallback((x: number, y: number) => {
    setTransform(t => ({
      ...t,
      x: -x * t.scale + containerSize.width / 2,
      y: -y * t.scale + containerSize.height / 2
    }))
  }, [containerSize])

  const fitToScreen = useCallback(() => {
    if (!layout) return
    const padding = 80
    const scaleX = (containerSize.width - padding * 2) / layout.width
    const scaleY = (containerSize.height - padding * 2) / layout.height
    const scale = Math.min(scaleX, scaleY, 1.2)
    
    setTransform({
      x: (containerSize.width - layout.width * scale) / 2,
      y: (containerSize.height - layout.height * scale) / 2,
      scale
    })
  }, [layout, containerSize])

  const resetView = useCallback(() => {
    setTransform({ x: 50, y: 50, scale: 1 })
    setCollapsedNodes(new Set())
  }, [])

  const expandAll = useCallback(() => {
    setCollapsedNodes(new Set())
  }, [])

  const collapseAll = useCallback(() => {
    if (!layout) return
    const ids = new Set<string>()
    layout.nodes.forEach(n => {
      if (n.node.children && n.node.children.length > 0) {
        ids.add(n.node.id)
      }
    })
    // Keep root expanded
    if (tree) ids.delete(tree.id)
    setCollapsedNodes(ids)
  }, [layout, tree])

  // Auto-fit on tree change
  useEffect(() => {
    if (layout && containerSize.width > 0 && containerSize.height > 0) {
      const timer = setTimeout(fitToScreen, 50)
      return () => clearTimeout(timer)
    }
  }, [tree?.id])

  useEffect(() => {
    const handleGlobalMouseUp = () => setIsDragging(false)
    window.addEventListener('mouseup', handleGlobalMouseUp)
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp)
  }, [])

  if (!tree || !layout) {
    return (
      <div className={cn(
        'flex flex-col items-center justify-center h-full text-muted-foreground gap-4 p-8',
        className
      )}>
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-muted/50 to-muted/30 flex items-center justify-center border border-border">
          <Move className="w-10 h-10 opacity-40" />
        </div>
        <div className="text-center space-y-1.5">
          <p className="font-semibold text-foreground">No Graph to Display</p>
          <p className="text-sm opacity-70 max-w-xs">Enter valid JSON in the editor to see an interactive visualization</p>
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div 
        ref={containerRef}
        className={cn(
          'relative overflow-hidden h-full w-full',
          'bg-gradient-to-br from-background via-background to-muted/20',
          className
        )}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        {/* Background grid */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.4 }}>
          <defs>
            <pattern id="smallGrid" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="10" cy="10" r="0.5" fill="currentColor" opacity="0.3" />
            </pattern>
            <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">
              <rect width="80" height="80" fill="url(#smallGrid)" />
              <path d="M 80 0 L 0 0 0 80" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.15" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* Graph canvas */}
        <svg
          width={layout.width}
          height={layout.height}
          className="absolute top-0 left-0"
          style={{
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
            transformOrigin: '0 0',
            transition: isDragging ? 'none' : 'transform 0.08s ease-out'
          }}
        >
          {/* Edges layer */}
          <g className="text-muted-foreground">
            {layout.edges.map((edge, i) => (
              <GraphEdge 
                key={i} 
                edge={edge} 
                isHighlighted={highlightedEdges.has(`${edge.from.node.id}-${edge.to.node.id}`)}
              />
            ))}
          </g>

          {/* Nodes layer */}
          <g className="text-foreground">
            {layout.nodes.map(posNode => (
              <GraphNode
                key={posNode.node.id}
                posNode={posNode}
                isSelected={selectedNodeId === posNode.node.id}
                isHovered={hoveredNodeId === posNode.node.id}
                isOnPath={pathNodeIds.has(posNode.node.id)}
                onSelect={onSelect}
                onHover={setHoveredNodeId}
                onToggleCollapse={handleToggleCollapse}
                onCopyPath={handleCopyPath}
                scale={transform.scale}
              />
            ))}
          </g>
        </svg>

        {/* Copied notification */}
        {copiedPath && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="bg-emerald-500 text-white px-4 py-2 rounded-lg shadow-xl text-sm font-mono flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>Copied: {copiedPath}</span>
            </div>
          </div>
        )}

        {/* Controls - Bottom Left */}
        <div className="absolute bottom-4 left-4 flex items-center gap-3 z-20">
          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-background/95 backdrop-blur-md rounded-xl border border-border shadow-xl p-1.5">
            <ControlButton onClick={() => setTransform(t => ({ ...t, scale: Math.min(t.scale * 1.25, 5) }))} icon={ZoomIn} tooltip="Zoom In (Scroll)" />
            
            <div className="w-28 px-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Slider
                      value={[transform.scale * 100]}
                      min={10}
                      max={500}
                      step={5}
                      onValueChange={([val]) => setTransform(t => ({ ...t, scale: val / 100 }))}
                      className="cursor-pointer"
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  Zoom: {Math.round(transform.scale * 100)}%
                </TooltipContent>
              </Tooltip>
            </div>
            
            <ControlButton onClick={() => setTransform(t => ({ ...t, scale: Math.max(t.scale * 0.75, 0.1) }))} icon={ZoomOut} tooltip="Zoom Out (Scroll)" />
            
            <span className="text-xs text-muted-foreground min-w-[3.5rem] text-center font-mono tabular-nums px-1">
              {Math.round(transform.scale * 100)}%
            </span>
          </div>
          
          {/* View controls */}
          <div className="flex items-center gap-1 bg-background/95 backdrop-blur-md rounded-xl border border-border shadow-xl p-1.5">
            <ControlButton onClick={fitToScreen} icon={Maximize2} tooltip="Fit to Screen" />
            <ControlButton onClick={resetView} icon={RotateCcw} tooltip="Reset View" />
            <div className="w-px h-5 bg-border mx-0.5" />
            <ControlButton onClick={expandAll} icon={Expand} tooltip="Expand All Nodes" />
            <ControlButton onClick={collapseAll} icon={Shrink} tooltip="Collapse All Nodes" />
          </div>
        </div>

        {/* Mini map toggle and display - Top Right */}
        <div className="absolute top-4 right-4 flex flex-col items-end gap-2 z-20">
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-8 px-3 bg-background/95 backdrop-blur-md border border-border shadow-lg rounded-lg text-xs",
                    showMiniMap && "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                  )}
                  onClick={() => setShowMiniMap(p => !p)}
                >
                  {showMiniMap ? <Map className="w-3.5 h-3.5 mr-1.5" /> : <MapPinOff className="w-3.5 h-3.5 mr-1.5" />}
                  {showMiniMap ? 'Hide Map' : 'Show Map'}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left" className="text-xs">
                Toggle minimap navigation
              </TooltipContent>
            </Tooltip>
          </div>
          
          {showMiniMap && layout.nodes.length > 2 && (
            <MiniMap 
              layout={layout}
              transform={transform}
              containerSize={containerSize}
              onNavigate={handleNavigate}
              collapsedCount={collapsedNodes.size}
            />
          )}
        </div>

        {/* Info panel - Bottom Right */}
        <div className="absolute bottom-4 right-4 z-20">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="bg-background/95 backdrop-blur-md rounded-xl border border-border shadow-xl px-4 py-2.5 cursor-help">
                <div className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-muted-foreground">Nodes:</span>
                    <span className="font-semibold text-foreground tabular-nums">{layout.nodes.length}</span>
                  </div>
                  {collapsedNodes.size > 0 && (
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-amber-500" />
                      <span className="text-muted-foreground">Hidden:</span>
                      <span className="font-semibold text-amber-500 tabular-nums">{collapsedNodes.size}</span>
                    </div>
                  )}
                  <Info className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs max-w-xs">
              <p className="font-medium mb-1">Graph Statistics</p>
              <p className="text-muted-foreground">
                Displaying {layout.nodes.length} nodes from your JSON.
                {collapsedNodes.size > 0 && ` ${collapsedNodes.size} nodes are collapsed.`}
              </p>
              <p className="text-muted-foreground mt-1">
                Tip: Click nodes to select, scroll to zoom, drag to pan.
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  )
})
