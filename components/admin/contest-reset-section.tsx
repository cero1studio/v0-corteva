"use client"

import { useState } from "react"
import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/components/ui/use-toast"
import { executeContestReset, type ContestResetOptions } from "@/app/actions/contest-reset"

const defaultOptions: ContestResetOptions = {
  sales: false,
  competitorClients: false,
  freeKickGoals: false,
  penalties: false,
  retoPublicado: false,
}

export function ContestResetSection() {
  const { toast } = useToast()
  const [options, setOptions] = useState<ContestResetOptions>({ ...defaultOptions })
  const [password, setPassword] = useState("")
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [running, setRunning] = useState(false)

  const anySelected = Object.values(options).some(Boolean)

  function setOption<K extends keyof ContestResetOptions>(key: K, value: boolean) {
    setOptions((prev) => ({ ...prev, [key]: value }))
  }

  async function runReset() {
    setRunning(true)
    try {
      const result = await executeContestReset(password, options)
      if (result.success) {
        toast({
          title: "Reseteo completado",
          description: "Se borraron los datos seleccionados y se actualizaron totales de equipos si aplica.",
        })
        setPassword("")
        setOptions({ ...defaultOptions })
        setConfirmOpen(false)
      } else {
        toast({
          title: "No se pudo completar",
          description: result.error || "Error desconocido",
          variant: "destructive",
        })
      }
    } finally {
      setRunning(false)
    }
  }

  return (
    <>
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Reseteo de datos del concurso
          </CardTitle>
          <CardDescription>
            Borra registros de la base de datos. Equipos, usuarios, zonas y configuración no se modifican. Requiere tu
            contraseña de inicio de sesión.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Acción irreversible</AlertTitle>
            <AlertDescription>
              No hay copia de seguridad automática desde esta pantalla. Asegúrate de exportar lo que necesites antes.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <p className="text-sm font-medium">Selecciona qué borrar</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 hover:bg-muted/40">
                <Checkbox
                  checked={options.sales}
                  onCheckedChange={(v) => setOption("sales", v === true)}
                  id="reset-sales"
                />
                <div>
                  <Label htmlFor="reset-sales" className="cursor-pointer font-medium">
                    Ventas
                  </Label>
                  <p className="text-xs text-muted-foreground">Todas las ventas registradas</p>
                </div>
              </label>
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 hover:bg-muted/40">
                <Checkbox
                  checked={options.competitorClients}
                  onCheckedChange={(v) => setOption("competitorClients", v === true)}
                  id="reset-clients"
                />
                <div>
                  <Label htmlFor="reset-clients" className="cursor-pointer font-medium">
                    Clientes competencia
                  </Label>
                  <p className="text-xs text-muted-foreground">Clientes capturados por equipos (tabla competitor_clients)</p>
                </div>
              </label>
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 hover:bg-muted/40">
                <Checkbox
                  checked={options.freeKickGoals}
                  onCheckedChange={(v) => setOption("freeKickGoals", v === true)}
                  id="reset-fk"
                />
                <div>
                  <Label htmlFor="reset-fk" className="cursor-pointer font-medium">
                    Tiros libres
                  </Label>
                  <p className="text-xs text-muted-foreground">Historial de goles por tiro libre</p>
                </div>
              </label>
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 hover:bg-muted/40">
                <Checkbox
                  checked={options.penalties}
                  onCheckedChange={(v) => setOption("penalties", v === true)}
                  id="reset-penalties"
                />
                <div>
                  <Label htmlFor="reset-penalties" className="cursor-pointer font-medium">
                    Penaltis y desafíos semanales
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Historial de penaltis y penaltis otorgados por metas semanales de ventas y goles.
                  </p>
                </div>
              </label>
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 hover:bg-muted/40 sm:col-span-2">
                <Checkbox
                  checked={options.retoPublicado}
                  onCheckedChange={(v) => setOption("retoPublicado", v === true)}
                  id="reset-reto"
                />
                <div>
                  <Label htmlFor="reset-reto" className="cursor-pointer font-medium">
                    Texto del reto en dashboards
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Borra el texto guardado y desactiva el reto en capitanes y directores técnicos.
                  </p>
                </div>
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reset-password">Tu contraseña (confirmación)</Label>
            <Input
              id="reset-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña con la que inicias sesión"
            />
          </div>

          <Button
            type="button"
            variant="destructive"
            disabled={!anySelected || !password.trim() || running}
            onClick={() => setConfirmOpen(true)}
          >
            {running ? "Procesando…" : "Ejecutar reseteo"}
          </Button>
        </CardContent>
      </Card>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmar borrado?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span className="block">
                Se eliminarán permanentemente los datos marcados. Esta acción no se puede deshacer.
              </span>
              {options.sales && <span className="block text-foreground">• Ventas</span>}
              {options.competitorClients && <span className="block text-foreground">• Clientes competencia</span>}
              {options.freeKickGoals && <span className="block text-foreground">• Tiros libres</span>}
              {options.penalties && <span className="block text-foreground">• Penaltis e historial</span>}
              {options.retoPublicado && <span className="block text-foreground">• Texto del reto y estado desactivado</span>}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={running}>Cancelar</AlertDialogCancel>
            <Button type="button" variant="destructive" disabled={running} onClick={() => void runReset()}>
              Sí, borrar
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
