import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import type { Penalty } from "@/types/penalties"

interface PenaltyCardProps {
  penalty: Penalty
}

export function PenaltyCard({ penalty }: PenaltyCardProps) {
  const available = penalty.quantity - penalty.used
  const createdAt = new Date(penalty.created_at)
  const timeAgo = formatDistanceToNow(createdAt, { addSuffix: true, locale: es })

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">Penalti</CardTitle>
          <Badge variant={available > 0 ? "default" : "outline"}>{available > 0 ? "Activo" : "Usado"}</Badge>
        </div>
        <CardDescription>{timeAgo}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Cantidad:</span>
            <span className="font-medium">{penalty.quantity}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Usados:</span>
            <span className="font-medium">{penalty.used}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Disponibles:</span>
            <span className="font-medium">{available}</span>
          </div>
          {penalty.reason && (
            <div className="pt-2">
              <span className="text-muted-foreground">Motivo:</span>
              <p className="mt-1">{penalty.reason}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
