"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, CheckCircle, XCircle, Plus } from "lucide-react"
import {
  createFreeKickGoal,
  getFreeKickGoals,
  deleteFreeKickGoal,
  getZones,
  exportFreeKickGoalsToExcel,
} from "@/app/actions/free-kick-goals"
import { useCachedList } from "@/lib/global-cache"
import * as XLSX from "xlsx"
import { AwardFreeKickModal } from "@/components/admin/free-kicks/award-free-kick-modal"
import { TeamSummary } from "@/components/admin/free-kicks/team-summary"
import { HistoryTable } from "@/components/admin/free-kicks/history-table"

export default function TirosLibresPage() {
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [exporting, setExporting] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)

  const fetchData = useCallback(async () => {
    const [zonesData, goalsData] = await Promise.all([getZones(), getFreeKickGoals()])
    return { zones: zonesData, goals: goalsData }
  }, [])

  const { data, loading, error, refresh } = useCachedList("admin-free-kicks", fetchData, [])
  const zones = data?.zones || []
  const freeKickGoals = data?.goals || []

  const handleSubmit = async (formData: FormData) => {
    setSubmitting(true)
    setMessage(null)

    try {
      const result = await createFreeKickGoal(formData)

      if (result.success) {
        setMessage({ type: "success", text: "Tiro libre adjudicado exitosamente" })
        await refresh()
        setModalOpen(false)
      } else {
        setMessage({ type: "error", text: result.error || "Error al adjudicar tiro libre" })
      }
    } catch (error) {
      console.error("Error submitting form:", error)
      setMessage({ type: "error", text: "Error inesperado" })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    setDeleting(id)
    setMessage(null)

    try {
      const result = await deleteFreeKickGoal(id)

      if (result.success) {
        setMessage({ type: "success", text: "Tiro libre eliminado exitosamente" })
        setTimeout(async () => {
          await refresh()
        }, 100)
      } else {
        setMessage({ type: "error", text: result.error || "Error al eliminar tiro libre" })
      }
    } catch (error) {
      console.error("Error deleting goal:", error)
      setMessage({ type: "error", text: "Error inesperado al eliminar" })
    } finally {
      setDeleting(null)
    }
  }

  const handleExportExcel = async () => {
    setExporting(true)
    setMessage(null)

    try {
      const result = await exportFreeKickGoalsToExcel()

      if (result.success && result.data) {
        // Crear worksheet con formato específico para números
        const ws = XLSX.utils.json_to_sheet(result.data, {
          cellStyles: true,
          raw: false,
        })

        // Configurar formato de columnas numéricas
        const range = XLSX.utils.decode_range(ws["!ref"] || "A1")
        for (let row = range.s.r + 1; row <= range.e.r; row++) {
          // Columna Goles (D)
          const golesCell = XLSX.utils.encode_cell({ r: row, c: 3 })
          if (ws[golesCell]) {
            ws[golesCell].t = "n" // Tipo número
          }

          // Columna Puntos (E)
          const puntosCell = XLSX.utils.encode_cell({ r: row, c: 4 })
          if (ws[puntosCell]) {
            ws[puntosCell].t = "n" // Tipo número
          }
        }

        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, "Tiros Libres")

        const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" })
        const blob = new Blob([excelBuffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `tiros-libres-${new Date().toISOString().split("T")[0]}.xlsx`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)

        setMessage({ type: "success", text: "Archivo Excel descargado exitosamente" })
      } else {
        setMessage({ type: "error", text: result.error || "Error al exportar datos" })
      }
    } catch (error) {
      console.error("Error exporting Excel:", error)
      setMessage({ type: "error", text: "Error al generar archivo Excel" })
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Cargando...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tiros Libres</h1>
          <p className="text-muted-foreground">
            Adjudica puntos por tiros libres. No suman a goles del concurso.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setModalOpen(true)} variant="default">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Tiro Libre
          </Button>
          <Button onClick={handleExportExcel} disabled={exporting || freeKickGoals.length === 0} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            {exporting ? "Exportando..." : "Descargar Excel"}
          </Button>
        </div>
      </div>

      {message && (
        <Alert variant={message.type === "error" ? "destructive" : "default"}>
          {message.type === "success" ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="history" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="history">Historial</TabsTrigger>
          <TabsTrigger value="summary">Resumen por Equipo</TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="space-y-4">
          <HistoryTable freeKickGoals={freeKickGoals} zones={zones} onDelete={handleDelete} deleting={deleting} />
        </TabsContent>

        <TabsContent value="summary" className="space-y-4">
          <TeamSummary freeKickGoals={freeKickGoals} />
        </TabsContent>
      </Tabs>

      <AwardFreeKickModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        zones={zones}
        onSubmit={handleSubmit}
        submitting={submitting}
      />
    </div>
  )
}
