"use client"

import { useState, useEffect } from "react"
import { useFormContext } from "react-hook-form"
import { Check, AlertCircle } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import { useRepairFormContext } from "../multi-step-repair-form"
import { getTechniciansWithSpecialties } from "@/lib/api/technicians"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { getInitials } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

export function TechnicianAssignmentStep() {
  const { toast } = useToast()
  const { register, setValue, watch } = useFormContext()
  const { setTechnicians } = useRepairFormContext()
  const [availableTechnicians, setAvailableTechnicians] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const selectedTechnicianIds = watch("technician_specialty_ids") || []

  useEffect(() => {
    const fetchTechnicians = async () => {
      setLoading(true)
      try {
        const { success, data, error } = await getTechniciansWithSpecialties()

        if (success && data) {
          // In a real implementation, we would check how many active repairs each technician has
          // For now, we'll simulate this by marking some technicians as "fully booked"
          const techniciansWithAvailability = data.map((tech) => ({
            ...tech,
            activeRepairs: Math.floor(Math.random() * 6), // Simulate 0-5 active repairs
          }))

          setAvailableTechnicians(techniciansWithAvailability)
          setTechnicians(techniciansWithAvailability)
        } else {
          throw new Error(error || "Failed to fetch technicians")
        }
      } catch (err) {
        console.error("Error fetching technicians:", err)
        setError("Failed to load technicians. Please try again.")
        toast({
          title: "Error",
          description: "Failed to load technicians",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchTechnicians()
  }, [toast, setTechnicians])

  const handleTechnicianToggle = (techId: string, checked: boolean) => {
    let updatedSelection = [...selectedTechnicianIds]

    if (checked) {
      // Check if we're already at the maximum of 5 technicians
      if (updatedSelection.length >= 5) {
        toast({
          title: "Maximum Reached",
          description: "You can assign a maximum of 5 technicians to a repair",
          variant: "destructive",
        })
        return
      }
      updatedSelection.push(techId)
    } else {
      updatedSelection = updatedSelection.filter((id) => id !== techId)
    }

    setValue("technician_specialty_ids", updatedSelection)
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Assign Technicians</Label>
          <span className="text-sm text-muted-foreground">{selectedTechnicianIds.length}/5 selected</span>
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-2 p-4 border rounded-md">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : availableTechnicians.length === 0 ? (
          <div className="text-center p-4 border rounded-md">
            <p className="text-muted-foreground">No technicians available</p>
          </div>
        ) : (
          <div className="space-y-2">
            {availableTechnicians.map((technician) => {
              const isSelected = selectedTechnicianIds.includes(technician.id)
              const isFullyBooked = technician.activeRepairs >= 5

              return (
                <div
                  key={technician.id}
                  className={`flex items-center space-x-3 p-4 border rounded-md ${
                    isSelected ? "bg-muted/50 border-primary" : ""
                  } ${isFullyBooked ? "opacity-50" : ""}`}
                >
                  <Checkbox
                    id={`tech-${technician.id}`}
                    checked={isSelected}
                    onCheckedChange={(checked) => handleTechnicianToggle(technician.id, checked === true)}
                    disabled={!isSelected && isFullyBooked}
                  />
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>{getInitials(technician.full_name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <Label
                      htmlFor={`tech-${technician.id}`}
                      className={`font-medium ${isFullyBooked ? "text-muted-foreground" : ""}`}
                    >
                      {technician.full_name}
                    </Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {technician.specialties.map((specialty: any) => (
                        <Badge key={specialty.id} variant="outline" className="text-xs">
                          {specialty.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="text-sm">
                    {isFullyBooked ? (
                      <span className="text-red-500 flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Fully Booked
                      </span>
                    ) : (
                      <span className="text-green-500 flex items-center">
                        <Check className="h-3 w-3 mr-1" />
                        Available
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {selectedTechnicianIds.length === 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Technicians Selected</AlertTitle>
          <AlertDescription>
            You haven't assigned any technicians to this repair. You can still proceed, but the repair will be
            unassigned.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
