"use client"

import { useState, useEffect, useCallback } from "react"
import { AlertTriangle, Download, KeyRound } from "lucide-react"
import * as XLSX from "xlsx"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { BULK_RESETTABLE_ROLE_VALUES } from "@/lib/bulk-password-reset-constants"
import {
  executeBulkPasswordReset,
  type BulkPasswordResetRow,
  type BulkPasswordResetPartialError,
} from "@/app/actions/bulk-password-reset"
import { getZones } from "@/app/actions/users"

const ROLE_LABELS: Record<string, string> = {
  capitan: "Capitán",
  director_tecnico: "Director técnico",
  arbitro: "Árbitro",
  representante: "Representante",
  supervisor: "Supervisor",
}

function rowsToSheetData(rows: BulkPasswordResetRow[]) {
  return rows.map((r) => ({
    Correo: r.correo,
    Nombre: r.nombre,
    Rol: r.rol,
    Equipo: r.equipo,
    Zona: r.zona,
    Distribuidor: r.distribuidor,
    Estado: r.estado,
    "Contraseña nueva": r.contraseña,
  }))
}

export function BulkPasswordResetSection() {
  const { toast } = useToast()
  const [zones, setZones] = useState<{ id: string; name: string }[]>([])
  const [zoneId, setZoneId] = useState<string>("all")
  const [allNonAdmin, setAllNonAdmin] = useState(true)
  const [selectedRoles, setSelectedRoles] = useState<Record<string, boolean>>(() => {
    const o: Record<string, boolean> = {}
    for (const r of BULK_RESETTABLE_ROLE_VALUES) o[r] = false
    return o
  })
  const [adminPassword, setAdminPassword] = useState("")
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [running, setRunning] = useState(false)
  const [lastPartialErrors, setLastPartialErrors] = useState<BulkPasswordResetPartialError[] | null>(null)

  const loadZones = useCallback(async () => {
    const res = await getZones()
    if (res.data) setZones(res.data as { id: string; name: string }[])
  }, [])

  useEffect(() => {
    void loadZones()
  }, [loadZones])

  function toggleRole(key: string, checked: boolean) {
    setSelectedRoles((prev) => ({ ...prev, [key]: checked }))
  }

  function buildRolesPayload(): string[] | null {
    if (allNonAdmin) return null
    const picked = BULK_RESETTABLE_ROLE_VALUES.filter((r) => selectedRoles[r])
    return picked.length > 0 ? [...picked] : null
  }

  async function runReset() {
    const rolesPayload = buildRolesPayload()
    if (!allNonAdmin && (!rolesPayload || rolesPayload.length === 0)) {
      toast({
        title: "Selecciona roles",
        description: "Marca al menos un rol o activa “Todos los roles no administradores”.",
        variant: "destructive",
      })
      return
    }

    setRunning(true)
    setLastPartialErrors(null)
    try {
      const result = await executeBulkPasswordReset(adminPassword, {
        zoneId: zoneId === "all" ? null : zoneId,
        roles: rolesPayload,
      })

      if (!result.success || !result.rows) {
        toast({
          title: "No se pudo completar",
          description: result.error || "Error desconocido",
          variant: "destructive",
        })
        if (result.partialErrors?.length) setLastPartialErrors(result.partialErrors)
        setConfirmOpen(false)
        return
      }

      const sheet = XLSX.utils.json_to_sheet(rowsToSheetData(result.rows))
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, sheet, "Contraseñas")
      const fname = `reset-contrasenas-${new Date().toISOString().slice(0, 10)}.xlsx`
      XLSX.writeFile(wb, fname)

      toast({
        title: "Listo",
        description: `Se generaron ${result.resetCount} contraseñas nuevas. Archivo: ${fname}.`,
      })

      setLastPartialErrors(result.partialErrors ?? null)

      setAdminPassword("")
      setConfirmOpen(false)
    } finally {
      setRunning(false)
    }
  }

  const canSubmit = adminPassword.trim().length > 0 && (allNonAdmin || BULK_RESETTABLE_ROLE_VALUES.some((r) => selectedRoles[r]))

  return (
    <>
      <Card className="border-amber-500/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            Reset global de contraseñas
          </CardTitle>
          <CardDescription>
            Genera una contraseña nueva por usuario y descarga un Excel. Las contraseñas actuales no se pueden recuperar
            (solo hay hash en el sistema). Los usuarios <strong>administradores nunca</strong> se incluyen.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Archivo muy sensible</AlertTitle>
            <AlertDescription>
              Quien tenga el Excel puede iniciar sesión como esos usuarios. Bórralo del ordenador cuando ya lo hayas
              repartido y usa canales seguros.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label>Zona</Label>
            <Select value={zoneId} onValueChange={setZoneId}>
              <SelectTrigger className="max-w-md">
                <SelectValue placeholder="Zona" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las zonas</SelectItem>
                {zones.map((z) => (
                  <SelectItem key={z.id} value={z.id}>
                    {z.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3 rounded-lg border p-3">
              <Checkbox
                id="all-non-admin"
                checked={allNonAdmin}
                onCheckedChange={(v) => setAllNonAdmin(v === true)}
              />
              <div>
                <Label htmlFor="all-non-admin" className="cursor-pointer font-medium">
                  Todos los roles no administradores
                </Label>
                <p className="text-xs text-muted-foreground">
                  Capitán, director técnico, árbitro, representante, supervisor (según existan en la base de datos).
                </p>
              </div>
            </div>

            {!allNonAdmin && (
              <div className="grid gap-2 sm:grid-cols-2">
                {BULK_RESETTABLE_ROLE_VALUES.map((key) => (
                  <label key={key} className="flex cursor-pointer items-center gap-2 rounded-md border p-2">
                    <Checkbox
                      checked={selectedRoles[key]}
                      onCheckedChange={(v) => toggleRole(key, v === true)}
                      id={`role-${key}`}
                    />
                    <Label htmlFor={`role-${key}`} className="cursor-pointer text-sm font-normal">
                      {ROLE_LABELS[key] || key}
                    </Label>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="bulk-admin-pwd">Tu contraseña de administrador (confirmación)</Label>
            <Input
              id="bulk-admin-pwd"
              type="password"
              autoComplete="current-password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              className="max-w-md"
            />
          </div>

          <Button type="button" disabled={!canSubmit || running} onClick={() => setConfirmOpen(true)} className="gap-2">
            <Download className="h-4 w-4" />
            {running ? "Procesando…" : "Resetear y descargar Excel"}
          </Button>

          {lastPartialErrors && lastPartialErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertTitle>Algunos usuarios no se actualizaron</AlertTitle>
              <AlertDescription>
                <ul className="mt-2 list-inside list-disc text-sm">
                  {lastPartialErrors.map((e) => (
                    <li key={e.email}>
                      {e.email}: {e.message}
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Generar nuevas contraseñas?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2 text-left">
              <span className="block">
                Los usuarios seleccionados (nunca administradores) dejarán de poder entrar con su contraseña anterior.
              </span>
              <span className="block">Descargarás un Excel con las contraseñas nuevas. Esta acción no se puede deshacer.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={running}>Cancelar</AlertDialogCancel>
            <Button type="button" disabled={running} onClick={() => void runReset()}>
              Confirmar
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
