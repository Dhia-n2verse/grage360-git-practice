"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { format, addDays, isBefore, parse } from "date-fns"
import { CalendarIcon, Loader2, Plus, Pencil, Eye, Trash2, AlertTriangle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  getBusinessInformation,
  getHolidays,
  createHoliday,
  updateHoliday,
  deleteHoliday,
  type Holiday,
  type BusinessInformation,
} from "@/lib/api/business"

interface HolidayWithBusinessName extends Holiday {
  business_name?: string
}

export default function HolidaysPage() {
  const { toast } = useToast()

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [businesses, setBusinesses] = useState<BusinessInformation[]>([])
  const [holidays, setHolidays] = useState<HolidayWithBusinessName[]>([])

  const [formOpen, setFormOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedHoliday, setSelectedHoliday] = useState<string | null>(null)
  const [viewingHoliday, setViewingHoliday] = useState<HolidayWithBusinessName | null>(null)

  const [formState, setFormState] = useState<{
    id?: string
    businessId: string
    businessName: string
    startDate: Date | undefined
    endDate: Date | undefined
    label: string
  }>({
    businessId: "",
    businessName: "",
    startDate: undefined,
    endDate: undefined,
    label: "",
  })

  // Fetch businesses and holidays on component mount
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

          // Fetch holidays for this business
          if (businessInfo.id) {
            const holidaysData = await getHolidays(businessInfo.id)

            // Add business name
            const enhancedHolidays = holidaysData.map((holiday) => ({
              ...holiday,
              business_name: businessInfo.business_name,
            }))

            setHolidays(enhancedHolidays)
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

  const handleCreateNew = () => {
    // Reset form to defaults
    setFormState({
      businessId: businesses[0]?.id || "",
      businessName: businesses[0]?.business_name || "",
      startDate: undefined,
      endDate: undefined,
      label: "",
    })

    setIsEditing(false)
    setFormOpen(true)
  }

  const handleEdit = (holiday: HolidayWithBusinessName) => {
    // Set form state
    setFormState({
      id: holiday.id,
      businessId: holiday.business_id,
      businessName: holiday.business_name || "",
      startDate: parse(holiday.date, "yyyy-MM-dd", new Date()),
      endDate: parse(holiday.date, "yyyy-MM-dd", new Date()), // For single-day holidays, start and end are the same
      label: holiday.label,
    })

    setIsEditing(true)
    setFormOpen(true)
  }

  const handleView = (holiday: HolidayWithBusinessName) => {
    setViewingHoliday(holiday)
    setViewDialogOpen(true)
  }

  const handleDelete = (holidayId: string) => {
    setSelectedHoliday(holidayId)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!selectedHoliday) return

    setIsSaving(true)
    try {
      // Call API to delete the holiday
      const result = await deleteHoliday(selectedHoliday)

      if (!result.success) {
        throw new Error(result.error?.message || "Failed to delete holiday")
      }

      // Update local state
      setHolidays((prev) => prev.filter((h) => h.id !== selectedHoliday))

      toast({
        title: "Holiday deleted",
        description: "The holiday has been successfully deleted.",
      })
    } catch (error) {
      console.error("Error deleting holiday:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete holiday. Please try again.",
      })
    } finally {
      setIsSaving(false)
      setDeleteDialogOpen(false)
      setSelectedHoliday(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError(null)

    try {
      // Validate inputs
      if (!formState.businessId) {
        setError("Please select a business.")
        setIsSaving(false)
        return
      }

      if (!formState.startDate) {
        setError("Please select a start date.")
        setIsSaving(false)
        return
      }

      if (!formState.label.trim()) {
        setError("Please enter a label for the holiday.")
        setIsSaving(false)
        return
      }

      // For single-day holiday
      if (!formState.endDate || formState.endDate === formState.startDate) {
        const formattedDate = format(formState.startDate, "yyyy-MM-dd")

        if (isEditing && formState.id) {
          // Update existing holiday
          const result = await updateHoliday(formState.id, {
            date: formattedDate,
            label: formState.label,
          })

          if (!result.success) {
            throw new Error(result.error?.message || "Failed to update holiday")
          }

          // Update local state
          setHolidays((prev) =>
            prev.map((h) => (h.id === formState.id ? { ...h, date: formattedDate, label: formState.label } : h)),
          )

          toast({
            title: "Holiday updated",
            description: `${formState.label} has been updated.`,
          })
        } else {
          // Create new holiday
          const result = await createHoliday({
            business_id: formState.businessId,
            date: formattedDate,
            label: formState.label,
          })

          if (!result.success || !result.data) {
            throw new Error(result.error?.message || "Failed to create holiday")
          }

          // Update local state
          setHolidays((prev) => [
            ...prev,
            {
              ...result.data!,
              business_name: formState.businessName,
            },
          ])

          toast({
            title: "Holiday added",
            description: `${formState.label} has been added to your holiday calendar.`,
          })
        }
      } else {
        // For multi-day holiday
        // Validate end date is after start date
        if (isBefore(formState.endDate, formState.startDate)) {
          setError("End date must be after start date.")
          setIsSaving(false)
          return
        }

        // Create an array of dates between start and end (inclusive)
        const dates: Date[] = []
        let currentDate = formState.startDate

        while (isBefore(currentDate, formState.endDate) || currentDate.getTime() === formState.endDate.getTime()) {
          dates.push(currentDate)
          currentDate = addDays(currentDate, 1)
        }

        // Create or update a holiday for each date
        const savePromises = dates.map((date) => {
          const formattedDate = format(date, "yyyy-MM-dd")

          // For multi-day ranges, we always create new entries
          return createHoliday({
            business_id: formState.businessId,
            date: formattedDate,
            label: formState.label,
          })
        })

        // Wait for all saves to complete
        const results = await Promise.all(savePromises)

        // Check for any errors
        const failures = results.filter((result) => !result.success)
        if (failures.length > 0) {
          throw new Error(`Failed to save ${failures.length} holiday records.`)
        }

        // Update local state
        const newHolidays = results
          .filter((result) => result.success && result.data)
          .map((result) => ({
            ...result.data!,
            business_name: formState.businessName,
          }))

        setHolidays((prev) => {
          // Filter out any existing holidays in the date range if this is not an edit
          const filtered = isEditing
            ? prev
            : prev.filter((h) => {
                const holidayDate = parse(h.date, "yyyy-MM-dd", new Date())
                return !(holidayDate >= formState.startDate! && holidayDate <= formState.endDate!)
              })

          // Add new holidays
          return [...filtered, ...newHolidays]
        })

        toast({
          title: "Holidays added",
          description: `${dates.length} days have been added as "${formState.label}" to your holiday calendar.`,
        })
      }

      // Close dialog
      setFormOpen(false)
    } catch (err: any) {
      console.error("Error saving holiday:", err)
      setError(err.message || "An error occurred while saving. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = parse(dateString, "yyyy-MM-dd", new Date())
    return format(date, "MMMM d, yyyy")
  }

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading holidays...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Holidays</h2>
          <p className="text-muted-foreground">Manage business holidays and closure days.</p>
        </div>
        <Button onClick={handleCreateNew}>
          <Plus className="mr-2 h-4 w-4" />
          Create New Holiday
        </Button>
      </div>

      <Separator />

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {holidays.length === 0 ? (
        <div className="flex h-96 w-full items-center justify-center rounded-md border border-dashed">
          <div className="text-center">
            <h3 className="text-lg font-medium">No holidays found</h3>
            <p className="text-sm text-muted-foreground mt-1">Get started by adding holidays to your calendar.</p>
            <Button variant="outline" className="mt-4" onClick={handleCreateNew}>
              <Plus className="mr-2 h-4 w-4" />
              Add Holiday
            </Button>
          </div>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business Name</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Label</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {holidays
                .sort((a, b) => a.date.localeCompare(b.date))
                .map((holiday) => (
                  <TableRow key={holiday.id}>
                    <TableCell className="font-medium">{holiday.business_name}</TableCell>
                    <TableCell>{formatDate(holiday.date)}</TableCell>
                    <TableCell>{holiday.label}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleView(holiday)}>
                        <Eye className="h-4 w-4" />
                        <span className="sr-only md:not-sr-only md:ml-2">View</span>
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleEdit(holiday)}>
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only md:not-sr-only md:ml-2">Update</span>
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(holiday.id!)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                        <span className="sr-only md:not-sr-only md:ml-2">Delete</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Holiday Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Update Holiday" : "Create New Holiday"}</DialogTitle>
            <DialogDescription>
              {isEditing ? "Update the holiday details." : "Add a new holiday or closure day to your calendar."}
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

              <div className="space-y-2">
                <Label htmlFor="start-date">Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="start-date"
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                      disabled={isSaving}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formState.startDate ? format(formState.startDate, "PPP") : "Select start date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formState.startDate}
                      onSelect={(date) => setFormState((prev) => ({ ...prev, startDate: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="end-date">End Date (Optional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="end-date"
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                      disabled={isSaving || !formState.startDate}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formState.endDate ? format(formState.endDate, "PPP") : "Select end date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formState.endDate}
                      onSelect={(date) => setFormState((prev) => ({ ...prev, endDate: date }))}
                      disabled={(date) => !formState.startDate || isBefore(date, formState.startDate)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <p className="text-xs text-muted-foreground">Leave empty for a single day holiday.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="label">Holiday Name</Label>
                <Input
                  id="label"
                  value={formState.label}
                  onChange={(e) => setFormState((prev) => ({ ...prev, label: e.target.value }))}
                  placeholder="e.g., Christmas Day, Staff Training"
                  disabled={isSaving}
                />
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
                  "Update Holiday"
                ) : (
                  "Create Holiday"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Holiday Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Holiday Details</DialogTitle>
            <DialogDescription>Viewing detailed information for this holiday.</DialogDescription>
          </DialogHeader>
          {viewingHoliday && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-bold">{viewingHoliday.label}</h3>
                <div className="flex items-center text-muted-foreground">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  <span>{formatDate(viewingHoliday.date)}</span>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium">Business</p>
                <p>{viewingHoliday.business_name}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium">Created At</p>
                <p>{viewingHoliday.created_at ? format(new Date(viewingHoliday.created_at), "PPP p") : "N/A"}</p>
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Holiday</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this holiday? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>This will permanently remove the holiday from your calendar.</AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Holiday"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
