"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Zap, Search } from "lucide-react"
import { getCaptainsByZone, getCurrentChallenge } from "@/app/actions/free-kick-goals"

interface Zone {
  id: string
  name: string
}

interface Captain {
  id: string
  full_name: string
  teams: {
    id: string
    name: string
  }
}

interface AwardFreeKickModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  zones: Zone[]
  onSubmit: (formData: FormData) => Promise<void>
  submitting: boolean
}

export function AwardFreeKickModal({ open, onOpenChange, zones, onSubmit, submitting }: AwardFreeKickModalProps) {
  const [captains, setCaptains] = useState<Captain[]>([])
  const [selectedZone, setSelectedZone] = useState<string>("")
  const [selectedCaptain, setSelectedCaptain] = useState<string>("")
  const [useChallenge, setUseChallenge] = useState(false)
  const [challengeText, setChallengeText] = useState("")
  const [reasonText, setReasonText] = useState("")
  const [captainSearch, setCaptainSearch] = useState("")

  useEffect(() => {
    async function loadCaptains() {
      if (selectedZone) {
        try {
          const captainsData = await getCaptainsByZone(selectedZone)
          setCaptains(captainsData)
          setSelectedCaptain("")
        } catch (error) {
          console.error("Error loading captains:", error)
        }
      } else {
        setCaptains([])
        setSelectedCaptain("")
      }
    }
    loadCaptains()
  }, [selectedZone])

  useEffect(() => {
    async function loadChallenge() {
      const challenge = await getCurrentChallenge()
      setChallengeText(challenge)
    }
    loadChallenge()
  }, [])

  useEffect(() => {
    if (useChallenge && challengeText) {
      setReasonText(challengeText)
    } else if (!useChallenge) {
      setReasonText("")
    }
  }, [useChallenge, challengeText])

  const filteredCaptains = captains.filter(
    (captain) =>
      captain.full_name.toLowerCase().includes(captainSearch.toLowerCase()) ||
      captain.teams?.name?.toLowerCase().includes(captainSearch.toLowerCase()),
  )

  const handleSubmit = async (formData: FormData) => {
    await onSubmit(formData)
    setSelectedZone("")
    setSelectedCaptain("")
    setReasonText("")
    setUseChallenge(false)
    setCaptainSearch("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Adjudicar Tiro Libre
          </DialogTitle>
          <DialogDescription>Otorga goles adicionales a un equipo específico</DialogDescription>
        </DialogHeader>

        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="zone">Zona</Label>
            <Select value={selectedZone} onValueChange={setSelectedZone}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una zona" />
              </SelectTrigger>
              <SelectContent>
                {zones.map((zone) => (
                  <SelectItem key={zone.id} value={zone.id}>
                    {zone.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="team_id">Capitán</Label>
            {selectedZone && captains.length > 0 && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar capitán o equipo..."
                  value={captainSearch}
                  onChange={(e) => setCaptainSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            )}
            <Select name="team_id" value={selectedCaptain} onValueChange={setSelectedCaptain} disabled={!selectedZone}>
              <SelectTrigger>
                <SelectValue placeholder={selectedZone ? "Selecciona un capitán" : "Primero selecciona una zona"} />
              </SelectTrigger>
              <SelectContent>
                {filteredCaptains.map((captain) => (
                  <SelectItem key={captain.id} value={captain.teams?.id || captain.id}>
                    {captain.full_name} {captain.teams?.name ? `(${captain.teams.name})` : ""}
                  </SelectItem>
                ))}
                {captainSearch && filteredCaptains.length === 0 && (
                  <div className="px-2 py-1 text-sm text-muted-foreground">No se encontraron capitanes</div>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="goals">Goles</Label>
            <Input id="goals" name="goals" type="number" min="1" max="10" placeholder="1" required />
            <p className="text-xs text-muted-foreground">Cantidad de goles a adjudicar</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Razón</Label>
            {challengeText && (
              <div className="flex items-center space-x-2 mb-2">
                <Checkbox id="use-challenge" checked={useChallenge} onCheckedChange={setUseChallenge} />
                <Label htmlFor="use-challenge" className="text-sm">
                  Usar texto del reto actual
                </Label>
              </div>
            )}
            <Textarea
              id="reason"
              name="reason"
              placeholder="Describe la razón del tiro libre..."
              value={reasonText}
              onChange={(e) => {
                setReasonText(e.target.value)
                if (useChallenge) setUseChallenge(false)
              }}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={!selectedCaptain || submitting}>
            <Zap className="mr-2 h-4 w-4" />
            {submitting ? "Adjudicando..." : "Adjudicar Tiro Libre"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
