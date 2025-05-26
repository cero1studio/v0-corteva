import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <Skeleton className="h-8 w-[300px] mb-2" />
          <Skeleton className="h-4 w-[250px]" />
        </div>
        <Skeleton className="h-10 w-[150px]" />
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_300px]">
        <div className="space-y-4">
          <Skeleton className="h-10 w-[300px]" />
          <Skeleton className="h-10 w-[200px]" />

          <div className="border rounded-lg p-4">
            <Skeleton className="h-6 w-[200px] mb-4" />
            <Skeleton className="h-4 w-full mb-2" />
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-6 w-6" />
                  <Skeleton className="h-6 w-full" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-lg border p-4">
          <Skeleton className="h-6 w-[100px] mb-4" />
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
