"use client"

import { useState, useEffect } from "react"
import { useFormContext } from "react-hook-form"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Skeleton } from "@/components/ui/skeleton"
import { useRepairFormContext } from "../multi-step-repair-form"
import { getApprovedDiagnostics } from "@/lib/api/repairs"
import { Badge } from "@/components/ui/badge"

export function DiagnosticSelectionStep() {
  const { register, setValue, watch } = useFormContext()
  const { setDiagnostic, setVehicle, setCustomer, setIsLoading } = useRepairFormContext()
  const [diagnostics, setDiagnostics] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredDiagnostics, setFilteredDiagnostics] = useState<any[]>([])

  const selectedDiagnosticId = watch("diagnostics_id")

  useEffect(() => {
    const fetchDiagnostics = async () => {
      setLoading(true)
      try {
        const data = await getApprovedDiagnostics()
        setDiagnostics(data)
        setFilteredDiagnostics(data)
      } catch (error) {
        console.error("Error fetching diagnostics:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDiagnostics()
  }, [])

  useEffect(() => {
    if (searchTerm) {
      const filtered = diagnostics.filter(
        (diagnostic) =>
          diagnostic.vehicle?.make?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          diagnostic.vehicle?.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          diagnostic.vehicle?.license_plate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          diagnostic.customer?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          diagnostic.customer?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          diagnostic.observation?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      setFilteredDiagnostics(filtered)
    } else {
      setFilteredDiagnostics(diagnostics)
    }
  }, [searchTerm, diagnostics])

  const handleDiagnosticSelect = (diagnostic: any) => {
    setValue("diagnostics_id", diagnostic.id)
    setValue("vehicle_id", diagnostic.vehicle.id)
    setValue("customer_id", diagnostic.customer.id)
    setDiagnostic(diagnostic)
    setVehicle(diagnostic.vehicle)
    setCustomer(diagnostic.customer)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="search">Search Diagnostics</Label>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            id="search"
            placeholder="Search by vehicle, customer, or observation..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Select an Approved Diagnostic</Label>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-2 p-4 border rounded-md">
                <Skeleton className="h-4 w-4 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredDiagnostics.length === 0 ? (
          <div className="text-center p-4 border rounded-md">
            <p className="text-muted-foreground">No approved diagnostics found</p>
          </div>
        ) : (
          <RadioGroup
            value={selectedDiagnosticId}
            onValueChange={(value) => {
              const diagnostic = diagnostics.find((d) => d.id === value)
              if (diagnostic) {
                handleDiagnosticSelect(diagnostic)
              }
            }}
          >
            <div className="space-y-2">
              {filteredDiagnostics.map((diagnostic) => (
                <div
                  key={diagnostic.id}
                  className={`flex items-start space-x-2 p-4 border rounded-md cursor-pointer hover:bg-muted/50 ${
                    selectedDiagnosticId === diagnostic.id ? "bg-muted/50 border-primary" : ""
                  }`}
                  onClick={() => handleDiagnosticSelect(diagnostic)}
                >
                  <RadioGroupItem value={diagnostic.id} id={diagnostic.id} className="mt-1" />
                  <div className="space-y-2 flex-1">
                    <div className="flex justify-between">
                      <Label htmlFor={diagnostic.id} className="font-medium cursor-pointer">
                        {diagnostic.vehicle?.make} {diagnostic.vehicle?.model}{" "}
                        {diagnostic.vehicle?.license_plate && `(${diagnostic.vehicle?.license_plate})`}
                      </Label>
                      <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                        Approved
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Customer: {diagnostic.customer?.first_name} {diagnostic.customer?.last_name}
                    </div>
                    {diagnostic.observation && (
                      <div className="text-sm mt-2">
                        <span className="font-medium">Observation:</span> {diagnostic.observation}
                      </div>
                    )}
                    {diagnostic.recommendation && (
                      <div className="text-sm mt-1">
                        <span className="font-medium">Recommendation:</span> {diagnostic.recommendation}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </RadioGroup>
        )}
      </div>
    </div>
  )
}
