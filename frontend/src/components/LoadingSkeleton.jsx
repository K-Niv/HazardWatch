import React from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

/**
 * Renders pulsating skeleton placeholders for the 4 primary KPI metrics cards.
 */
export function KPICardsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className="border-border/60 bg-card/80 backdrop-blur-sm animate-pulse">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <div className="h-3 w-20 bg-muted/50 rounded" />
              <div className="w-3.5 h-3.5 rounded-full bg-muted/40" />
            </div>
            <div className="h-7 w-16 bg-muted/60 rounded mt-2" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="h-2.5 w-28 bg-muted/30 rounded mt-1" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

/**
 * Full visualization card skeleton for primary charts.
 */
export function ChartCardSkeleton({ className = '' }) {
  return (
    <Card className={`border-border/60 bg-card/80 backdrop-blur-sm ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="space-y-1.5">
          <div className="h-4 w-48 bg-muted/50 rounded animate-pulse" />
          <div className="h-3 w-64 bg-muted/30 rounded animate-pulse" />
        </div>
        <div className="h-7 w-32 bg-muted/40 rounded-lg animate-pulse" />
      </CardHeader>
      <CardContent className="pt-2">
        <div className="h-72 rounded-xl border border-border/40 bg-muted/10 p-6 flex flex-col justify-end">
          <div className="flex items-end justify-between gap-3 h-48 w-full pt-6">
            {[45, 70, 35, 85, 60, 50, 90, 65, 40, 75].map((h, i) => (
              <div
                key={i}
                className="flex-1 bg-gradient-to-t from-muted/40 to-muted/20 rounded-t animate-pulse transition-all"
                style={{ height: `${h}%`, animationDelay: `${i * 60}ms` }}
              />
            ))}
          </div>
          <div className="h-3 w-full bg-muted/30 rounded mt-4 animate-pulse" />
        </div>
      </CardContent>
    </Card>
  )
}
