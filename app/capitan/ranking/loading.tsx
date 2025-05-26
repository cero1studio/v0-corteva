import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function RankingLoading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
        <Skeleton className="h-10 w-64" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-[180px]" />
          <Skeleton className="h-10 w-[180px]" />
        </div>
      </div>

      <div className="space-y-2">
        <Skeleton className="h-10 w-[300px]" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-6 w-6" />
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="ml-auto h-6 w-16" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center gap-8 py-4">
                <div className="text-center">
                  <Skeleton className="mx-auto h-16 w-16 rounded-full" />
                  <Skeleton className="mx-auto mt-2 h-6 w-24" />
                </div>
                <div className="text-center">
                  <Skeleton className="mx-auto h-10 w-10" />
                  <Skeleton className="mx-auto mt-2 h-4 w-16" />
                </div>
                <div className="text-center">
                  <Skeleton className="mx-auto h-10 w-16" />
                  <Skeleton className="mx-auto mt-2 h-4 w-24" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center gap-8 py-4">
                <div className="text-center">
                  <Skeleton className="mx-auto h-10 w-16" />
                  <Skeleton className="mx-auto mt-2 h-4 w-24" />
                </div>
                <div className="text-center">
                  <Skeleton className="mx-auto h-10 w-10" />
                  <Skeleton className="mx-auto mt-2 h-4 w-24" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
