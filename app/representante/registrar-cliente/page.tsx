"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

const RegistrarClientePage = () => {
  const [name, setName] = useState("")
  const [contactInfo, setContactInfo] = useState("")

  const handleSubmit = (e) => {
    e.preventDefault()
    // Handle form submission logic here
    console.log("Name:", name)
    console.log("Contact Info:", contactInfo)
  }

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <Card className="w-[500px]">
        <CardHeader>
          <CardTitle>Registrar Nuevo Cliente</CardTitle>
          <CardDescription>Ingrese los datos del nuevo cliente ganadero.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Nombre Completo</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre completo del ganadero"
              />
            </div>
            <div>
              <Label htmlFor="contactInfo">Celular del Ganadero</Label>
              <Input
                id="contactInfo"
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                placeholder="Número de celular del ganadero"
              />
            </div>
            <Button type="submit">Registrar Cliente</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default RegistrarClientePage
