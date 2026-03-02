'use client'

import { memo } from 'react'
import type { TreeStats } from '@/lib/types'
import { cn } from '@/lib/utils'

interface StatsPanelProps {
  stats: TreeStats | null
  className?: string
}

const statItems = [
  { key: 'objectCount' as const, label: 'Objects', color: 'bg-purple-500' },
  { key: 'arrayCount' as const, label: 'Arrays', color: 'bg-blue-500' },
  { key: 'stringCount' as const, label: 'Strings', color: 'bg-emerald-500' },
  { key: 'numberCount' as const, label: 'Numbers', color: 'bg-cyan-500' },
  { key: 'booleanCount' as const, label: 'Booleans', color: 'bg-amber-500' },
  { key: 'nullCount' as const, label: 'Nulls', color: 'bg-gray-400' },
]

export const StatsPanel = memo(function StatsPanel({ stats, className }: StatsPanelProps) {
  if (!stats) return null

  const total = statItems.reduce((sum, item) => sum + (stats[item.key] || 0), 0)

  return (
    <div className={cn('p-4 border-t border-border bg-muted/30', className)}>
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-sm font-medium text-foreground">Statistics</h3>
        <span className="text-xs text-muted-foreground">
          {stats.totalNodes} total nodes, max depth {stats.maxDepth}
        </span>
      </div>

      {/* Bar Chart */}
      <div className="h-3 rounded-full overflow-hidden flex bg-muted mb-3">
        {statItems.map((item) => {
          const value = stats[item.key] || 0
          const percentage = total > 0 ? (value / total) * 100 : 0
          if (percentage === 0) return null
          
          return (
            <div
              key={item.key}
              className={cn('h-full transition-all', item.color)}
              style={{ width: `${percentage}%` }}
              title={`${item.label}: ${value}`}
            />
          )
        })}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {statItems.map((item) => {
          const value = stats[item.key] || 0
          return (
            <div key={item.key} className="flex items-center gap-1.5">
              <div className={cn('w-2.5 h-2.5 rounded-sm', item.color)} />
              <span className="text-xs text-muted-foreground">
                {item.label}
              </span>
              <span className="text-xs font-medium text-foreground ml-auto">
                {value}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
})
