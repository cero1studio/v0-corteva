import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import type { PenaltyHistory } from "@/types/penalties"

interface PenaltyHistoryListProps {
  history: PenaltyHistory[]
}

export function PenaltyHistoryList({ history }: PenaltyHistoryListProps) {
  if (history.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-muted-foreground">
          No hay historial de penaltis disponible.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Historial de Penaltis</h3>
      {history.map((item) => (
        <Card key={item.id}>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <CardTitle className="text-base">
                {item.action === "earned" ? "Penalti Recibido" : "Penalti Utilizado"}
              </CardTitle>
              <Badge variant={item.action === "earned" ? "destructive" : "default"}>
                {item.action === "earned" ? "+" : "-"}
                {item.quantity}
              </Badge>
            </div>
            <CardDescription>
              {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: es })}
            </CardDescription>
          </CardHeader>
          <CardContent>{item.description && <p>{item.description}</p>}</CardContent>
        </Card>
      ))}
    </div>
  )
}
