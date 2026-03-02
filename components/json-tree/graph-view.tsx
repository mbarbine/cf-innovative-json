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
  Check
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

// Modern compact node dimensions
const NODE_MIN_WIDTH = 140
const NODE_MAX_WIDTH = 220
const NODE_HEIGHT = 44
const HORIZONTAL_SPACING = 60
const VERTICAL_SPACING = 16

// Color palette for different types
const TYPE_COLORS = {
  string: { bg: 'rgba(34, 197, 94, 0.15)', border: 'rgb(34, 197, 94)', text: 'rgb(34, 197, 94)' },
  number: { bg: 'rgba(59, 130, 246, 0.15)', border: 'rgb(59, 130, 246)', text: 'rgb(59, 130, 246)' },
  boolean: { bg: 'rgba(168, 85, 247, 0.15)', border: 'rgb(168, 85, 247)', text: 'rgb(168, 85, 247)' },
  null: { bg: 'rgba(156, 163, 175, 0.15)', border: 'rgb(156, 163, 175)', text: 'rgb(156, 163, 175)' },
  object: { bg: 'rgba(251, 146, 60, 0.15)', border: 'rgb(251, 146, 60)', text: 'rgb(251, 146, 60)' },
  array: { bg: 'rgba(236, 72, 153, 0.15)', border: 'rgb(236, 72, 153)', text: 'rgb(236, 72, 153)' },
}

function calculateNodeWidth(node: JsonNode): number {
  const keyLen = node.key.length
  const valueLen = node.type === 'string' 
    ? Math.min(String(node.value).length + 2, 20)
    : String(node.value).length
  const estimated = Math.max(keyLen, valueLen) * 8 + 48
  return Math.min(Math.max(estimated, NODE_MIN_WIDTH), NODE_MAX_WIDTH)
}

function calculateLayout(
  tree: JsonNode, 
  collapsedNodes: Set<string>
): { nodes: PositionedNode[]; edges: Edge[]; width: number; height: number } {
  const nodes: PositionedNode[] = []
  const edges: Edge[] = []
  
  function getSubtreeHeight(node: JsonNode, depth: number): number {
    if (collapsedNodes.has(node.id) || !node.children || node.children.length === 0) {
      return NODE_HEIGHT + VERTICAL_SPACING
    }
    
    // Limit visible children for performance
    const visibleChildren = node.children.slice(0, 15)
    let totalHeight = 0
    for (const child of visibleChildren) {
      totalHeight += getSubtreeHeight(child, depth + 1)
    }
    return Math.max(totalHeight, NODE_HEIGHT + VERTICAL_SPACING)
  }
  
  function positionNode(
    node: JsonNode,
    depth: number,
    startY: number,
    parentPos?: PositionedNode
  ): number {
    const nodeWidth = calculateNodeWidth(node)
    const x = depth * (NODE_MAX_WIDTH + HORIZONTAL_SPACING) + 40
    const isCollapsed = collapsedNodes.has(node.id)
    
    let subtreeHeight = NODE_HEIGHT + VERTICAL_SPACING
    if (!isCollapsed && node.children && node.children.length > 0) {
      const visibleChildren = node.children.slice(0, 15)
      subtreeHeight = visibleChildren.reduce((sum, child) => 
        sum + getSubtreeHeight(child, depth + 1), 0
      )
    }
    
    const y = startY + subtreeHeight / 2 - NODE_HEIGHT / 2
    
    const posNode: PositionedNode = {
      node,
      x,
      y,
      width: nodeWidth,
      height: NODE_HEIGHT,
      isCollapsed
    }
    
    nodes.push(posNode)
    
    if (parentPos) {
      edges.push({ from: parentPos, to: posNode })
    }
    
    if (!isCollapsed && node.children && node.children.length > 0) {
      let currentY = startY
      const visibleChildren = node.children.slice(0, 15)
      for (const child of visibleChildren) {
        const childHeight = positionNode(child, depth + 1, currentY, posNode)
        currentY += childHeight
      }
    }
    
    return subtreeHeight
  }
  
  positionNode(tree, 0, 40)
  
  const maxX = Math.max(...nodes.map(n => n.x + n.width), 0) + 80
  const maxY = Math.max(...nodes.map(n => n.y + n.height), 0) + 80
  
  return { nodes, edges, width: maxX, height: maxY }
}

// Beautiful animated node component
const GraphNode = memo(function GraphNode({ 
  posNode, 
  isSelected,
  isHovered,
  onSelect,
  onHover,
  onToggleCollapse,
  onCopyPath
}: { 
  posNode: PositionedNode
  isSelected: boolean
  isHovered: boolean
  onSelect: (id: string) => void
  onHover: (id: string | null) => void
  onToggleCollapse: (id: string) => void
  onCopyPath: (path: string[]) => void
}) {
  const { node, x, y, width, height, isCollapsed } = posNode
  const hasChildren = node.children && node.children.length > 0
  const colors = TYPE_COLORS[node.type]
  const [copied, setCopied] = useState(false)
  
  const displayValue = useMemo(() => {
    if (hasChildren) {
      const count = node.children!.length
      return node.type === 'array' 
        ? `Array[${count}]`
        : `Object{${count}}`
    }
    if (node.type === 'string') {
      const str = String(node.value)
      return str.length > 14 ? `"${str.slice(0, 14)}..."` : `"${str}"`
    }
    if (node.type === 'null') return 'null'
    if (node.type === 'boolean') return String(node.value)
    return String(node.value)
  }, [node, hasChildren])

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

  return (
    <g 
      transform={`translate(${x}, ${y})`}
      onClick={() => onSelect(node.id)}
      onMouseEnter={() => onHover(node.id)}
      onMouseLeave={() => onHover(null)}
      className="cursor-pointer"
      style={{ transition: 'transform 0.2s ease-out' }}
    >
      {/* Glow effect for selected/hovered */}
      {(isSelected || isHovered) && (
        <rect
          x={-4}
          y={-4}
          width={width + 8}
          height={height + 8}
          rx={14}
          fill="none"
          stroke={colors.border}
          strokeWidth={2}
          opacity={isSelected ? 0.6 : 0.3}
          className="animate-pulse"
        />
      )}
      
      {/* Main node background */}
      <rect
        width={width}
        height={height}
        rx={10}
        fill={isSelected ? colors.border : colors.bg}
        stroke={colors.border}
        strokeWidth={isSelected ? 2 : 1.5}
        className="transition-all duration-200"
      />
      
      {/* Collapse/Expand toggle for nodes with children */}
      {hasChildren && (
        <g 
          onClick={handleToggle}
          className="cursor-pointer"
        >
          <rect
            x={-12}
            y={height / 2 - 10}
            width={20}
            height={20}
            rx={4}
            fill={colors.bg}
            stroke={colors.border}
            strokeWidth={1}
          />
          {isCollapsed ? (
            <ChevronRight 
              x={-10} 
              y={height / 2 - 8} 
              width={16} 
              height={16}
              color={colors.text}
            />
          ) : (
            <ChevronDown 
              x={-10} 
              y={height / 2 - 8} 
              width={16} 
              height={16}
              color={colors.text}
            />
          )}
        </g>
      )}
      
      {/* Copy path button (visible on hover) */}
      {isHovered && (
        <g onClick={handleCopy} className="cursor-pointer">
          <rect
            x={width - 24}
            y={4}
            width={20}
            height={20}
            rx={4}
            fill="rgba(0,0,0,0.3)"
          />
          {copied ? (
            <Check x={width - 22} y={6} width={16} height={16} color="#22c55e" />
          ) : (
            <Copy x={width - 22} y={6} width={16} height={16} color="white" />
          )}
        </g>
      )}
      
      {/* Key name */}
      <text
        x={hasChildren ? 16 : 10}
        y={16}
        className={cn(
          'text-[11px] font-semibold',
          isSelected ? 'fill-white' : 'fill-foreground'
        )}
        style={{ fontFamily: 'var(--font-sans)' }}
      >
        {node.key.length > 18 ? node.key.slice(0, 18) + '...' : node.key}
      </text>
      
      {/* Value / Type indicator */}
      <text
        x={hasChildren ? 16 : 10}
        y={34}
        className="text-[10px] font-mono"
        style={{ 
          fill: isSelected ? 'rgba(255,255,255,0.8)' : colors.text,
          fontFamily: 'var(--font-mono)'
        }}
      >
        {displayValue}
      </text>
      
      {/* Type badge */}
      <rect
        x={width - 8 - (node.type.length * 5.5)}
        y={height - 16}
        width={node.type.length * 5.5 + 6}
        height={14}
        rx={3}
        fill={isSelected ? 'rgba(255,255,255,0.2)' : colors.bg}
        stroke={colors.border}
        strokeWidth={0.5}
      />
      <text
        x={width - 5 - (node.type.length * 5.5)}
        y={height - 6}
        className="text-[8px] font-medium uppercase"
        style={{ 
          fill: isSelected ? 'rgba(255,255,255,0.9)' : colors.text,
          fontFamily: 'var(--font-mono)'
        }}
      >
        {node.type}
      </text>
    </g>
  )
})

// Animated edge with gradient
function GraphEdge({ edge, isHighlighted }: { edge: Edge; isHighlighted: boolean }) {
  const startX = edge.from.x + edge.from.width
  const startY = edge.from.y + edge.from.height / 2
  const endX = edge.to.x - 12 // Account for toggle button
  const endY = edge.to.y + edge.to.height / 2
  
  // Bezier curve control points for smooth edges
  const controlX1 = startX + (endX - startX) * 0.4
  const controlX2 = startX + (endX - startX) * 0.6
  
  const pathD = `M ${startX} ${startY} C ${controlX1} ${startY}, ${controlX2} ${endY}, ${endX} ${endY}`
  
  return (
    <g>
      {/* Shadow/glow for highlighted edges */}
      {isHighlighted && (
        <path
          d={pathD}
          fill="none"
          stroke="rgb(34, 197, 94)"
          strokeWidth={4}
          opacity={0.3}
          strokeLinecap="round"
        />
      )}
      <path
        d={pathD}
        fill="none"
        stroke={isHighlighted ? 'rgb(34, 197, 94)' : 'currentColor'}
        strokeWidth={isHighlighted ? 2 : 1.5}
        opacity={isHighlighted ? 1 : 0.3}
        strokeLinecap="round"
        className="transition-all duration-200"
      />
      {/* Arrow head */}
      <circle
        cx={endX}
        cy={endY}
        r={3}
        fill={isHighlighted ? 'rgb(34, 197, 94)' : 'currentColor'}
        opacity={isHighlighted ? 1 : 0.4}
      />
    </g>
  )
}

// Mini map component
function MiniMap({ 
  layout, 
  transform, 
  containerSize,
  onNavigate 
}: { 
  layout: { nodes: PositionedNode[]; width: number; height: number }
  transform: { x: number; y: number; scale: number }
  containerSize: { width: number; height: number }
  onNavigate: (x: number, y: number) => void
}) {
  const miniMapSize = { width: 150, height: 100 }
  const scale = Math.min(
    miniMapSize.width / layout.width,
    miniMapSize.height / layout.height
  ) * 0.9
  
  const viewportWidth = containerSize.width / transform.scale
  const viewportHeight = containerSize.height / transform.scale
  const viewportX = -transform.x / transform.scale
  const viewportY = -transform.y / transform.scale
  
  const handleClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = (e.clientX - rect.left) / scale
    const clickY = (e.clientY - rect.top) / scale
    onNavigate(clickX, clickY)
  }, [scale, onNavigate])
  
  return (
    <div className="absolute top-4 right-4 bg-background/90 backdrop-blur-sm rounded-lg border border-border shadow-lg p-2">
      <svg 
        width={miniMapSize.width} 
        height={miniMapSize.height}
        className="cursor-pointer"
        onClick={handleClick}
      >
        <rect 
          width={miniMapSize.width} 
          height={miniMapSize.height} 
          fill="transparent"
        />
        {/* Nodes */}
        {layout.nodes.map((posNode) => (
          <rect
            key={posNode.node.id}
            x={posNode.x * scale}
            y={posNode.y * scale}
            width={Math.max(posNode.width * scale, 2)}
            height={Math.max(posNode.height * scale, 2)}
            rx={2}
            fill={TYPE_COLORS[posNode.node.type].border}
            opacity={0.6}
          />
        ))}
        {/* Viewport indicator */}
        <rect
          x={viewportX * scale}
          y={viewportY * scale}
          width={viewportWidth * scale}
          height={viewportHeight * scale}
          fill="rgba(34, 197, 94, 0.1)"
          stroke="rgb(34, 197, 94)"
          strokeWidth={1.5}
          rx={2}
        />
      </svg>
    </div>
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

  // Measure container size
  useEffect(() => {
    if (!containerRef.current) return
    const observer = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect
      setContainerSize({ width, height })
    })
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  const layout = useMemo(() => {
    if (!tree) return null
    return calculateLayout(tree, collapsedNodes)
  }, [tree, collapsedNodes])

  // Find highlighted edges (path to selected node)
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
    const newScale = Math.min(Math.max(transform.scale * delta, 0.15), 4)
    
    // Zoom toward mouse position
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
      if (next.has(nodeId)) {
        next.delete(nodeId)
      } else {
        next.add(nodeId)
      }
      return next
    })
  }, [])

  const handleCopyPath = useCallback((path: string[]) => {
    const jsonPath = '$' + path.map(p => 
      /^\d+$/.test(p) ? `[${p}]` : `.${p}`
    ).join('')
    navigator.clipboard.writeText(jsonPath)
    setCopiedPath(jsonPath)
    setTimeout(() => setCopiedPath(null), 2000)
  }, [])

  const handleNavigateFromMiniMap = useCallback((x: number, y: number) => {
    setTransform(t => ({
      ...t,
      x: -x * t.scale + containerSize.width / 2,
      y: -y * t.scale + containerSize.height / 2
    }))
  }, [containerSize])

  const fitToScreen = useCallback(() => {
    if (!layout) return
    const padding = 60
    const scaleX = (containerSize.width - padding * 2) / layout.width
    const scaleY = (containerSize.height - padding * 2) / layout.height
    const scale = Math.min(scaleX, scaleY, 1.5)
    
    setTransform({
      x: (containerSize.width - layout.width * scale) / 2,
      y: (containerSize.height - layout.height * scale) / 2,
      scale
    })
  }, [layout, containerSize])

  const resetView = useCallback(() => {
    setTransform({ x: 40, y: 40, scale: 1 })
  }, [])

  // Auto-fit on first load
  useEffect(() => {
    if (layout && containerSize.width > 0) {
      fitToScreen()
    }
  }, [tree]) // Only on tree change, not layout (to prevent re-fit on collapse)

  useEffect(() => {
    const handleGlobalMouseUp = () => setIsDragging(false)
    window.addEventListener('mouseup', handleGlobalMouseUp)
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp)
  }, [])

  if (!tree || !layout) {
    return (
      <div className={cn(
        'flex flex-col items-center justify-center h-full text-muted-foreground gap-4',
        className
      )}>
        <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center">
          <Move className="w-8 h-8 opacity-50" />
        </div>
        <div className="text-center">
          <p className="font-medium">No Graph to Display</p>
          <p className="text-sm opacity-70">Enter valid JSON to see the visualization</p>
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div 
        ref={containerRef}
        className={cn(
          'relative overflow-hidden h-full bg-gradient-to-br from-background to-muted/20',
          className
        )}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        {/* Background grid pattern */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* Main graph SVG */}
        <svg
          width="100%"
          height="100%"
          className="relative z-10"
          style={{
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
            transformOrigin: '0 0',
            transition: isDragging ? 'none' : 'transform 0.1s ease-out'
          }}
        >
          {/* Edges */}
          <g className="text-muted-foreground">
            {layout.edges.map((edge, i) => (
              <GraphEdge 
                key={i} 
                edge={edge} 
                isHighlighted={highlightedEdges.has(`${edge.from.node.id}-${edge.to.node.id}`)}
              />
            ))}
          </g>

          {/* Nodes */}
          {layout.nodes.map(posNode => (
            <GraphNode
              key={posNode.node.id}
              posNode={posNode}
              isSelected={selectedNodeId === posNode.node.id}
              isHovered={hoveredNodeId === posNode.node.id}
              onSelect={onSelect}
              onHover={setHoveredNodeId}
              onToggleCollapse={handleToggleCollapse}
              onCopyPath={handleCopyPath}
            />
          ))}
        </svg>

        {/* Mini map */}
        {showMiniMap && layout.nodes.length > 3 && (
          <MiniMap 
            layout={layout}
            transform={transform}
            containerSize={containerSize}
            onNavigate={handleNavigateFromMiniMap}
          />
        )}

        {/* Copied path notification */}
        {copiedPath && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-mono animate-in fade-in slide-in-from-top-2 duration-200">
            Copied: {copiedPath}
          </div>
        )}

        {/* Controls */}
        <div className="absolute bottom-4 left-4 flex items-center gap-2">
          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-background/90 backdrop-blur-sm rounded-lg border border-border shadow-lg p-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setTransform(t => ({ ...t, scale: Math.min(t.scale * 1.3, 4) }))}
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Zoom In</TooltipContent>
            </Tooltip>
            
            <div className="w-24 px-2">
              <Slider
                value={[transform.scale * 100]}
                min={15}
                max={400}
                step={5}
                onValueChange={([val]) => setTransform(t => ({ ...t, scale: val / 100 }))}
                className="h-8"
              />
            </div>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setTransform(t => ({ ...t, scale: Math.max(t.scale * 0.7, 0.15) }))}
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Zoom Out</TooltipContent>
            </Tooltip>
            
            <span className="text-xs text-muted-foreground min-w-[3rem] text-center font-mono">
              {Math.round(transform.scale * 100)}%
            </span>
          </div>
          
          {/* View controls */}
          <div className="flex items-center gap-1 bg-background/90 backdrop-blur-sm rounded-lg border border-border shadow-lg p-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={fitToScreen}>
                  <Maximize2 className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Fit to Screen</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={resetView}>
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Reset View</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Stats badge */}
        <div className="absolute bottom-4 right-4 bg-background/90 backdrop-blur-sm rounded-lg border border-border shadow-lg px-3 py-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{layout.nodes.length}</span> nodes
          {collapsedNodes.size > 0 && (
            <span className="ml-2">
              (<span className="text-amber-500">{collapsedNodes.size} collapsed</span>)
            </span>
          )}
        </div>

        {/* Toggle mini map */}
        <button
          onClick={() => setShowMiniMap(prev => !prev)}
          className="absolute top-4 right-[170px] bg-background/90 backdrop-blur-sm rounded-lg border border-border shadow-lg p-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {showMiniMap ? 'Hide Map' : 'Show Map'}
        </button>
      </div>
    </TooltipProvider>
  )
})
