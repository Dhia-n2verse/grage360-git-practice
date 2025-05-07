"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Clock, Loader2, Pencil, Eye } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  getBusinessInformation,
  getWorkingHours,
  upsertWorkingHours,
  type WorkingHours,
  type BusinessInformation,
} from "@/lib/api/business"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// Day name mapping
const dayNames: Record<string, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
}

// Day codes in order
const dayCodes = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const

type DayCode = (typeof dayCodes)[number]

interface WorkingHoursWithBusinessName extends WorkingHours {
  business_name?: string
}

export default function WorkingHoursPage() {
  const { toast } = useToast()

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [businesses, setBusinesses] = useState<BusinessInformation[]>([])
  const [workingHoursRecords, setWorkingHoursRecords] = useState<WorkingHoursWithBusinessName[]>([])

  const [formOpen, setFormOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<string | null>(null)
  const [viewingRecord, setViewingRecord] = useState<WorkingHoursWithBusinessName | null>(null)

  const [formState, setFormState] = useState<{
    businessId: string
    businessName: string
    days: Record<DayCode, { enabled: boolean; openTime: string; closeTime: string }>
  }>({
    businessId: "",
    businessName: "",
    days: {
      mon: { enabled: true, openTime: "09:00", closeTime: "18:00" },
      tue: { enabled: true, openTime: "09:00", closeTime: "18:00" },
      wed: { enabled: true, openTime: "09:00", closeTime: "18:00" },
      thu: { enabled: true, openTime: "09:00", closeTime: "18:00" },
      fri: { enabled: true, openTime: "09:00", closeTime: "18:00" },
      sat: { enabled: false, openTime: "09:00", closeTime: "18:00" },
      sun: { enabled: false, openTime: "09:00", closeTime: "18:00" },
    },
  })

  // Fetch businesses and working hours on component mount
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true)
      try {
        // Get business information
        const businessInfo = await getBusinessInformation()
        if (businessInfo) {
          setBusinesses([businessInfo])

          // Set default business ID
          setFormState((prev) => ({
            ...prev,
            businessId: businessInfo.id || "",
            businessName: businessInfo.business_name,
          }))

          // Fetch working hours for this business
          if (businessInfo.id) {
            const hours = await getWorkingHours(businessInfo.id)

            // Group by day and add business name
            const enhancedHours = hours.map((hour) => ({
              ...hour,
              business_name: businessInfo.business_name,
            }))

            setWorkingHoursRecords(enhancedHours)
          }
        }
      } catch (err) {
        console.error("Error fetching data:", err)
        setError("Failed to load data. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleEditHours = (businessId: string) => {
    // Find all hours for this business
    const businessHours = workingHoursRecords.filter((h) => h.business_id === businessId)

    if (businessHours.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No working hours found for this business.",
      })
      return
    }

    // Initialize form state
    const initialDays: Record<DayCode, { enabled: boolean; openTime: string; closeTime: string }> = {
      mon: { enabled: false, openTime: "09:00", closeTime: "18:00" },
      tue: { enabled: false, openTime: "09:00", closeTime: "18:00" },
      wed: { enabled: false, openTime: "09:00", closeTime: "18:00" },
      thu: { enabled: false, openTime: "09:00", closeTime: "18:00" },
      fri: { enabled: false, openTime: "09:00", closeTime: "18:00" },
      sat: { enabled: false, openTime: "09:00", closeTime: "18:00" },
      sun: { enabled: false, openTime: "09:00", closeTime: "18:00" },
    }

    // Update with existing hours
    businessHours.forEach((hour) => {
      const dayCode = hour.day as DayCode
      if (dayCode in initialDays) {
        initialDays[dayCode] = {
          enabled: hour.open_time !== null && hour.close_time !== null,
          openTime: hour.open_time ? formatTimeForDisplay(hour.open_time) : "09:00",
          closeTime: hour.close_time ? formatTimeForDisplay(hour.close_time) : "18:00",
        }
      }
    })

    // Set form state
    setFormState({
      businessId,
      businessName: businessHours[0].business_name || businesses.find((b) => b.id === businessId)?.business_name || "",
      days: initialDays,
    })

    setIsEditing(true)
    setFormOpen(true)
  }

  const handleViewHours = (businessId: string) => {
    // Find all hours for this business
    const businessHours = workingHoursRecords.filter((h) => h.business_id === businessId)

    if (businessHours.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No working hours found for this business.",
      })
      return
    }

    // Set viewing record (we'll just use the first one and include the business name)
    setViewingRecord({
      ...businessHours[0],
      business_name: businessHours[0].business_name || businesses.find((b) => b.id === businessId)?.business_name || "",
    })

    setViewDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError(null)

    try {
      // Validate business ID
      if (!formState.businessId) {
        setError("Please select a business.")
        setIsSaving(false)
        return
      }

      // Save each day's working hours
      const savePromises = dayCodes.map(async (dayCode) => {
        const dayState = formState.days[dayCode]

        // Prepare working hours object
        const hours: WorkingHours = {
          business_id: formState.businessId,
          day: dayCode,
          open_time: dayState.enabled ? `${dayState.openTime}:00` : null,
          close_time: dayState.enabled ? `${dayState.closeTime}:00` : null,
        }

        // Save to database
        return upsertWorkingHours(hours)
      })

      // Wait for all saves to complete
      const results = await Promise.all(savePromises)

      // Check for any errors
      const failures = results.filter((result) => !result.success)
      if (failures.length > 0) {
        throw new Error(`Failed to save ${failures.length} working hours records.`)
      }

      // Update local state
      // Refresh data
      const businessId = formState.businessId
      const hours = await getWorkingHours(businessId)

      // Group by day and add business name
      const enhancedHours = hours.map((hour) => ({
        ...hour,
        business_name: formState.businessName,
      }))

      setWorkingHoursRecords((prev) => {
        // Remove old records for this business
        const filtered = prev.filter((h) => h.business_id !== businessId)
        // Add new records
        return [...filtered, ...enhancedHours]
      })

      toast({
        title: isEditing ? "Working hours updated" : "Working hours created",
        description: `Working hours have been successfully ${isEditing ? "updated" : "created"}.`,
      })

      // Close dialog
      setFormOpen(false)
    } catch (err: any) {
      console.error("Error saving working hours:", err)
      setError(err.message || "An error occurred while saving. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  // Helper to format time for display (HH:MM:SS -> HH:MM)
  const formatTimeForDisplay = (time: string) => {
    return time.substring(0, 5)
  }

  // Group working hours by business for display
  const groupedHours = workingHoursRecords.reduce(
    (acc, hour) => {
      if (!acc[hour.business_id]) {
        acc[hour.business_id] = {
          businessId: hour.business_id,
          businessName: hour.business_name || "",
          days: {} as Record<DayCode, { open: string | null; close: string | null }>,
        }
      }

      acc[hour.business_id].days[hour.day as DayCode] = {
        open: hour.open_time,
        close: hour.close_time,
      }

      return acc
    },
    {} as Record<
      string,
      { businessId: string; businessName: string; days: Record<DayCode, { open: string | null; close: string | null }> }
    >,
  )

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading working hours...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Working Hours</h2>
          <p className="text-muted-foreground">Set and manage business working hours.</p>
        </div>
      </div>

      <Separator />

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {Object.keys(groupedHours).length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Working Hours</CardTitle>
            <CardDescription>No working hours have been set up for your business.</CardDescription>
          </CardHeader>
          <CardContent className="flex h-40 w-full items-center justify-center">
            <div className="text-center">
              <h3 className="text-lg font-medium">No working hours found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Contact your administrator to set up working hours for your business.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Business Working Hours</CardTitle>
            <CardDescription>Current working hours for your business.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Business Name</TableHead>
                    <TableHead>Monday</TableHead>
                    <TableHead>Tuesday</TableHead>
                    <TableHead>Wednesday</TableHead>
                    <TableHead>Thursday</TableHead>
                    <TableHead>Friday</TableHead>
                    <TableHead>Saturday</TableHead>
                    <TableHead>Sunday</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.values(groupedHours).map((businessHours) => (
                    <TableRow key={businessHours.businessId}>
                      <TableCell className="font-medium">{businessHours.businessName}</TableCell>
                      {dayCodes.map((day) => (
                        <TableCell key={day}>
                          {businessHours.days[day]?.open && businessHours.days[day]?.close ? (
                            <span>
                              {formatTimeForDisplay(businessHours.days[day].open!)} -{" "}
                              {formatTimeForDisplay(businessHours.days[day].close!)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">Closed</span>
                          )}
                        </TableCell>
                      ))}
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleViewHours(businessHours.businessId)}>
                          <Eye className="h-4 w-4" />
                          <span className="sr-only md:not-sr-only md:ml-2">View</span>
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleEditHours(businessHours.businessId)}>
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only md:not-sr-only md:ml-2">Update</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Working Hours Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Update Working Hours" : "Create New Working Hours"}</DialogTitle>
            <DialogDescription>
              {isEditing ? "Update the working hours for your business." : "Set the working hours for your business."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-6 py-4">
              <div className="space-y-2">
                <Label htmlFor="business">Business</Label>
                <Select
                  value={formState.businessId}
                  onValueChange={(value) => {
                    const business = businesses.find((b) => b.id === value)
                    setFormState((prev) => ({
                      ...prev,
                      businessId: value,
                      businessName: business?.business_name || "",
                    }))
                  }}
                  disabled={isEditing || businesses.length <= 1}
                >
                  <SelectTrigger id="business">
                    <SelectValue placeholder="Select business" />
                  </SelectTrigger>
                  <SelectContent>
                    {businesses.map((business) => (
                      <SelectItem key={business.id} value={business.id || ""}>
                        {business.business_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Working Hours</h3>
                {dayCodes.map((dayCode) => (
                  <div key={dayCode} className="flex items-center space-x-4 py-2">
                    <div className="w-32">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={formState.days[dayCode].enabled}
                          onCheckedChange={(checked) => {
                            setFormState((prev) => ({
                              ...prev,
                              days: {
                                ...prev.days,
                                [dayCode]: {
                                  ...prev.days[dayCode],
                                  enabled: checked,
                                },
                              },
                            }))
                          }}
                          disabled={isSaving}
                        />
                        <Label>{dayNames[dayCode]}</Label>
                      </div>
                    </div>

                    {formState.days[dayCode].enabled ? (
                      <div className="flex flex-1 items-center space-x-2">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <Input
                            type="time"
                            value={formState.days[dayCode].openTime}
                            onChange={(e) => {
                              setFormState((prev) => ({
                                ...prev,
                                days: {
                                  ...prev.days,
                                  [dayCode]: {
                                    ...prev.days[dayCode],
                                    openTime: e.target.value,
                                  },
                                },
                              }))
                            }}
                            className="w-32"
                            disabled={isSaving}
                          />
                        </div>
                        <span className="text-muted-foreground">to</span>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <Input
                            type="time"
                            value={formState.days[dayCode].closeTime}
                            onChange={(e) => {
                              setFormState((prev) => ({
                                ...prev,
                                days: {
                                  ...prev.days,
                                  [dayCode]: {
                                    ...prev.days[dayCode],
                                    closeTime: e.target.value,
                                  },
                                },
                              }))
                            }}
                            className="w-32"
                            disabled={isSaving}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="text-muted-foreground">Closed</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)} disabled={isSaving}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : isEditing ? (
                  "Update Hours"
                ) : (
                  "Create Hours"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Hours Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Working Hours Details</DialogTitle>
            <DialogDescription>Viewing detailed working hours for {viewingRecord?.business_name}.</DialogDescription>
          </DialogHeader>
          {viewingRecord && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">{viewingRecord.business_name}</h3>
                <div className="text-sm text-muted-foreground">Business working hours schedule</div>
              </div>

              <div className="space-y-4">
                {dayCodes.map((dayCode) => {
                  const dayHours = workingHoursRecords.find(
                    (h) => h.business_id === viewingRecord.business_id && h.day === dayCode,
                  )

                  return (
                    <div key={dayCode} className="flex items-center justify-between border-b pb-2">
                      <div className="font-medium">{dayNames[dayCode]}</div>
                      <div>
                        {dayHours?.open_time && dayHours?.close_time ? (
                          <span>
                            {formatTimeForDisplay(dayHours.open_time)} - {formatTimeForDisplay(dayHours.close_time)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Closed</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
