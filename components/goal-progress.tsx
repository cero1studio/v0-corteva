import { Progress } from "@/components/ui/progress"

interface GoalProgressProps {
  current: number
  target: number
}

export function GoalProgress({ current, target }: GoalProgressProps) {
  const percentage = Math.min(Math.round((current / target) * 100), 100)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="grid gap-1">
          <div className="text-sm font-medium text-muted-foreground">Progreso</div>
          <div className="text-3xl font-bold">
            {current} / {target}
          </div>
        </div>
        <div className="text-2xl font-bold text-corteva-600">{percentage}%</div>
      </div>
      <Progress value={percentage} className="h-2" />
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="space-y-1 rounded-lg border p-2">
          <div className="text-sm font-medium text-muted-foreground">Restante</div>
          <div className="text-lg font-bold">{Math.max(target - current, 0)}</div>
        </div>
        <div className="space-y-1 rounded-lg border p-2">
          <div className="text-sm font-medium text-muted-foreground">Días</div>
          <div className="text-lg font-bold">3</div>
        </div>
        <div className="space-y-1 rounded-lg border p-2">
          <div className="text-sm font-medium text-muted-foreground">Posición</div>
          <div className="text-lg font-bold text-corteva-600">#4</div>
        </div>
      </div>
    </div>
  )
}
