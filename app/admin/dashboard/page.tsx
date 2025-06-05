"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardBody, Typography, IconButton } from "@material-tailwind/react"
import { EllipsisVerticalIcon } from "@heroicons/react/24/outline"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { useTranslations } from "next-intl"

const data = [
  { name: "Jan", uv: 4000, pv: 2400, amt: 2400 },
  { name: "Feb", uv: 3000, pv: 1398, amt: 2210 },
  { name: "Mar", uv: 2000, pv: 9800, amt: 2290 },
  { name: "Apr", uv: 2780, pv: 3908, amt: 2000 },
  { name: "May", uv: 1890, pv: 4800, amt: 2181 },
  { name: "Jun", uv: 2390, pv: 3800, amt: 2500 },
  { name: "Jul", uv: 3490, pv: 4300, amt: 2100 },
]

const DashboardPage = () => {
  const t = useTranslations("Admin.Dashboard")
  const [zoneStats, setZoneStats] = useState({
    zone1: { goals: 0 },
    zone2: { goals: 0 },
    zone3: { goals: 0 },
    zone4: { goals: 0 },
  })

  useEffect(() => {
    const fetchZoneStats = async () => {
      // Mock data for demonstration purposes
      const mockData = {
        zone1: {
          ventas: 1000,
          clientes: 50,
          tiros_libres: 10,
          puntos_para_gol: 100,
        },
        zone2: {
          ventas: 1500,
          clientes: 75,
          tiros_libres: 15,
          puntos_para_gol: 100,
        },
        zone3: {
          ventas: 800,
          clientes: 40,
          tiros_libres: 8,
          puntos_para_gol: 100,
        },
        zone4: {
          ventas: 2000,
          clientes: 100,
          tiros_libres: 20,
          puntos_para_gol: 100,
        },
      }

      const calculateGoals = (zoneData: any) => {
        const ventasGoals = zoneData.ventas / zoneData.puntos_para_gol
        const clientesGoals = (zoneData.clientes * 200) / zoneData.puntos_para_gol
        const tirosLibresGoals = zoneData.tiros_libres
        return ventasGoals + clientesGoals + tirosLibresGoals
      }

      setZoneStats({
        zone1: { goals: calculateGoals(mockData.zone1) },
        zone2: { goals: calculateGoals(mockData.zone2) },
        zone3: { goals: calculateGoals(mockData.zone3) },
        zone4: { goals: calculateGoals(mockData.zone4) },
      })
    }

    fetchZoneStats()
  }, [])

  return (
    <div className="container mx-auto py-8">
      <Typography variant="h1" className="text-3xl font-bold mb-4">
        {t("title")}
      </Typography>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader floated={false} className="card-header-custom">
            <Typography variant="h6" color="white">
              {t("zone")} 1
            </Typography>
            <IconButton size="sm" variant="text" color="white">
              <EllipsisVerticalIcon className="h-5 w-5" />
            </IconButton>
          </CardHeader>
          <CardBody>
            <Typography variant="h4" className="mb-2">
              {zoneStats.zone1.goals} goles
            </Typography>
            <Typography className="font-normal">{t("zoneDescription")}</Typography>
          </CardBody>
        </Card>

        <Card>
          <CardHeader floated={false} className="card-header-custom">
            <Typography variant="h6" color="white">
              {t("zone")} 2
            </Typography>
            <IconButton size="sm" variant="text" color="white">
              <EllipsisVerticalIcon className="h-5 w-5" />
            </IconButton>
          </CardHeader>
          <CardBody>
            <Typography variant="h4" className="mb-2">
              {zoneStats.zone2.goals} goles
            </Typography>
            <Typography className="font-normal">{t("zoneDescription")}</Typography>
          </CardBody>
        </Card>

        <Card>
          <CardHeader floated={false} className="card-header-custom">
            <Typography variant="h6" color="white">
              {t("zone")} 3
            </Typography>
            <IconButton size="sm" variant="text" color="white">
              <EllipsisVerticalIcon className="h-5 w-5" />
            </IconButton>
          </CardHeader>
          <CardBody>
            <Typography variant="h4" className="mb-2">
              {zoneStats.zone3.goals} goles
            </Typography>
            <Typography className="font-normal">{t("zoneDescription")}</Typography>
          </CardBody>
        </Card>

        <Card>
          <CardHeader floated={false} className="card-header-custom">
            <Typography variant="h6" color="white">
              {t("zone")} 4
            </Typography>
            <IconButton size="sm" variant="text" color="white">
              <EllipsisVerticalIcon className="h-5 w-5" />
            </IconButton>
          </CardHeader>
          <CardBody>
            <Typography variant="h4" className="mb-2">
              {zoneStats.zone4.goals} goles
            </Typography>
            <Typography className="font-normal">{t("zoneDescription")}</Typography>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader variant="gradient" color="blue" className="mb-4">
          <Typography variant="h6" color="white">
            {t("salesChart")}
          </Typography>
        </CardHeader>
        <CardBody>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="pv" stroke="#8884d8" fill="#8884d8" />
            </AreaChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>
    </div>
  )
}

export default DashboardPage
