"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Select } from "@mantine/core"
import { Table, Group, Text, ActionIcon, Tooltip, Loader, useMantineTheme } from "@mantine/core"
import { IconEye, IconDownload } from "@tabler/icons-react"
import dayjs from "dayjs"
import "dayjs/locale/es"
dayjs.locale("es")

const supabase = createClientComponentClient()

export default function Reportes() {
  const [teams, setTeams] = useState<any[]>([])
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null)
  const [salesData, setSalesData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const theme = useMantineTheme()

  useEffect(() => {
    loadTeams()
  }, [])

  useEffect(() => {
    if (selectedTeam) {
      loadSalesData(selectedTeam)
    }
  }, [selectedTeam])

  const loadTeams = async () => {
    const { data } = await supabase.from("teams").select("*").order("name")
    setTeams(data || [])
  }

  const loadSalesData = async (teamId: string) => {
    setLoading(true)
    try {
      const { data: sales } = await supabase
        .from("sales")
        .select(
          `
    id,
    quantity,
    points,
    created_at,
    team_id,
    representative_id,
    teams!sales_team_id_fkey(name),
    products!sales_product_id_fkey(name),
    profiles!sales_representative_id_fkey(full_name)
  `,
        )
        .eq("team_id", teamId)
        .order("created_at", { ascending: false })
        .limit(50)

      const salesData =
        sales?.map((sale: any) => ({
          id: sale.id,
          team_name: sale.teams?.name || "Desconocido",
          representative_name: sale.profiles?.full_name || "Desconocido",
          product_name: sale.products?.name || "Desconocido",
          quantity: sale.quantity,
          points: sale.points,
          created_at: sale.created_at,
        })) || []

      setSalesData(salesData)
    } catch (error) {
      console.error("Error fetching sales data:", error)
    } finally {
      setLoading(false)
    }
  }

  const rows = salesData.map((element) => (
    <tr key={element.id}>
      <td>{element.id}</td>
      <td>{element.team_name}</td>
      <td>{element.representative_name}</td>
      <td>{element.product_name}</td>
      <td>{element.quantity}</td>
      <td>{element.points}</td>
      <td>{dayjs(element.created_at).format("DD/MM/YYYY HH:mm")}</td>
      <td>
        <Group spacing="xs" position="right">
          <Tooltip label="Ver detalles">
            <ActionIcon color="blue" size="sm" variant="light">
              <IconEye size="1rem" />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Descargar">
            <ActionIcon color="green" size="sm" variant="light">
              <IconDownload size="1rem" />
            </ActionIcon>
          </Tooltip>
        </Group>
      </td>
    </tr>
  ))

  return (
    <div>
      <h1>Reportes</h1>

      <Select
        label="Selecciona un equipo"
        placeholder="Selecciona un equipo"
        data={teams.map((team) => ({ value: team.id, label: team.name }))}
        value={selectedTeam}
        onChange={setSelectedTeam}
      />

      {selectedTeam && (
        <>
          <h2>Reporte del equipo: {teams.find((team) => team.id === selectedTeam)?.name}</h2>
          {loading ? (
            <Group position="center">
              <Loader color="blue" size="sm" />
            </Group>
          ) : (
            <Table striped highlightOnHover>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Equipo</th>
                  <th>Representante</th>
                  <th>Producto</th>
                  <th>Cantidad</th>
                  <th>Puntos</th>
                  <th>Fecha</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {rows.length > 0 ? (
                  rows
                ) : (
                  <tr>
                    <td colSpan={8}>
                      <Text weight={500} align="center">
                        No hay ventas registradas para este equipo.
                      </Text>
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          )}
        </>
      )}
    </div>
  )
}
