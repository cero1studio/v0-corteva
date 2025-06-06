"use client"

interface SkeletonProps {
  className?: string
  width?: string
  height?: string
}

export function Skeleton({ className = "", width = "100%", height = "20px" }: SkeletonProps) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className}`} style={{ width, height }} />
}

export function TableSkeleton({ rows = 5, columns = 4 }) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex space-x-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} height="24px" className="flex-1" />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex space-x-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} height="20px" className="flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

export function CardSkeleton() {
  return (
    <div className="p-6 border rounded-lg space-y-4">
      <Skeleton height="24px" width="60%" />
      <Skeleton height="16px" width="100%" />
      <Skeleton height="16px" width="80%" />
      <div className="flex space-x-2">
        <Skeleton height="32px" width="80px" />
        <Skeleton height="32px" width="80px" />
      </div>
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton height="32px" width="300px" />
        <Skeleton height="20px" width="200px" />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>

      {/* Chart */}
      <div className="p-6 border rounded-lg">
        <Skeleton height="24px" width="200px" className="mb-4" />
        <Skeleton height="300px" width="100%" />
      </div>
    </div>
  )
}
