import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function Loading() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-[300px]" />
        <Skeleton className="h-4 w-[450px]" />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-[120px]" />
              <Skeleton className="h-3 w-[180px]" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-7 w-[50px]" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-9 w-[300px]" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-[90px]" />
            <Skeleton className="h-8 w-[100px]" />
            <Skeleton className="h-8 w-[140px]" />
          </div>
        </div>

        <div className="rounded-md border">
          <div className="p-4">
            <div className="flex items-center gap-4 py-3">
              <Skeleton className="h-4 w-[50px]" />
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-4 w-[50px]" />
              <Skeleton className="h-4 w-[50px]" />
              <Skeleton className="h-4 w-[80px]" />
              <Skeleton className="h-4 w-[70px]" />
            </div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-3">
                <Skeleton className="h-4 w-[30px]" />
                <Skeleton className="h-4 w-[180px]" />
                <Skeleton className="h-4 w-[90px]" />
                <Skeleton className="h-4 w-[30px]" />
                <Skeleton className="h-4 w-[30px]" />
                <Skeleton className="h-4 w-[60px]" />
                <Skeleton className="h-6 w-[60px]" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
