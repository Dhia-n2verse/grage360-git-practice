"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Pencil, AlertTriangle, Check, ImageIcon } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  getBusinessInformation,
  createBusinessInformation,
  updateBusinessInformation,
  initializeDefaultWorkingHours,
  type BusinessInformation,
} from "@/lib/api/business"
import { useBusiness } from "@/app/context/business-context"

interface LogoItem {
  name: string
  url: string
}

export default function BusinessInformationPage() {
  const { toast } = useToast()
  const router = useRouter()
  const { refreshBusinessInfo } = useBusiness()

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isDisableDialogOpen, setIsDisableDialogOpen] = useState(false)
  const [isLogoGalleryOpen, setIsLogoGalleryOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [businessInfo, setBusinessInfo] = useState<BusinessInformation>({
    business_name: "",
    address: "",
    email: "",
    phone: "",
    website: "",
    description: "",
    logo: null,
  })
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [availableLogos, setAvailableLogos] = useState<LogoItem[]>([])
  const [isLoadingLogos, setIsLoadingLogos] = useState(false)

  // Supabase storage URL
  const storageUrl = "https://pewxqoekelazouabsehv.supabase.co/storage/v1/object/public/logos/"

  // Fetch business information on component mount
  useEffect(() => {
    async function fetchBusinessInfo() {
      setIsLoading(true)
      try {
        const data = await getBusinessInformation()
        if (data) {
          setBusinessInfo(data)
          if (data.logo) {
            setLogoPreview(data.logo)
          }
        }
      } catch (err) {
        console.error("Error fetching business information:", err)
        setError("Failed to load business information. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchBusinessInfo()
  }, [])

  // Fetch available logos from Supabase bucket
  const fetchLogos = async () => {
    setIsLoadingLogos(true)
    try {
      const logoItems: LogoItem[] = []
      let i = 1
      while (true) {
        const logoName = `igarage-logo-${i}.PNG`
        const logoUrl = `${storageUrl}${logoName}`

        // Check if the logo exists by making a HEAD request
        try {
          const response = await fetch(logoUrl, { method: "HEAD" })
          if (response.ok) {
            logoItems.push({ name: logoName, url: logoUrl })
            i++
          } else {
            // If the logo doesn't exist, break the loop
            break
          }
        } catch (err) {
          console.error("Error verifying logo existence:", err)
          break // Stop fetching if there's an error
        }
      }

      setAvailableLogos(logoItems)
    } catch (error) {
      console.error("Error fetching logos:", error)
      toast({
        title: "Error",
        description: "Failed to load logos from gallery. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingLogos(false)
    }
  }

  // Open logo gallery and fetch logos
  const handleOpenLogoGallery = () => {
    fetchLogos()
    setIsLogoGalleryOpen(true)
  }

  // Select logo from gallery
  const handleSelectLogo = (logo: LogoItem) => {
    setLogoPreview(logo.url)
    setBusinessInfo((prev) => ({ ...prev, logo: logo.url }))
    setIsLogoGalleryOpen(false)
  }

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setBusinessInfo((prev) => ({ ...prev, [name]: value }))
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError(null)

    try {
      // Validate required fields
      if (!businessInfo.business_name || !businessInfo.address || !businessInfo.email || !businessInfo.phone) {
        setError("Please fill in all required fields.")
        setIsSaving(false)
        return
      }

      // If we have an existing business record
      if (businessInfo.id) {
        // Update business information
        const result = await updateBusinessInformation(businessInfo.id, businessInfo)

        if (!result.success) {
          throw new Error(result.error?.message || "Failed to update business information")
        }

        toast({
          title: "Business information updated",
          description: "Your business information has been updated successfully.",
        })
      } else {
        // Create new business record
        const result = await createBusinessInformation(businessInfo)

        if (!result.success || !result.data) {
          throw new Error(result.error?.message || "Failed to create business information")
        }

        // Initialize default working hours
        await initializeDefaultWorkingHours(result.data.id!)

        toast({
          title: "Business information created",
          description: "Your business information has been created successfully.",
        })

        // Update state with the new data including ID
        setBusinessInfo(result.data)
      }

      // Refresh the business info in the context
      await refreshBusinessInfo()

      // Exit edit mode
      setIsEditing(false)

      // Refresh the page to show updated data
      router.refresh()
    } catch (err: any) {
      console.error("Error saving business information:", err)
      setError(err.message || "An error occurred while saving. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  // Handle business disable/deactivate
  const handleDisableBusiness = async () => {
    setIsSaving(true)
    try {
      // In a real application, you would call an API to disable the business
      // For this example, we'll just show a success message

      toast({
        title: "Business disabled",
        description: "The business has been successfully disabled.",
      })

      setIsDisableDialogOpen(false)
    } catch (err: any) {
      console.error("Error disabling business:", err)
      setError(err.message || "An error occurred while disabling the business. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading business information...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Business Information</h2>
          <p className="text-muted-foreground">
            Manage your company details, contact information, and business address.
          </p>
        </div>
        <div className="flex gap-2">
          {!isEditing && (
            <>
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit Information
              </Button>
              <Button variant="destructive" onClick={() => setIsDisableDialogOpen(true)}>
                Disable Business
              </Button>
            </>
          )}
        </div>
      </div>

      <Separator />

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isEditing ? (
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Company Details</CardTitle>
              <CardDescription>
                This information will be displayed on invoices, work orders, and customer-facing documents.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="logo">Company Logo</Label>
                <div className="flex items-start gap-4">
                  {logoPreview ? (
                    <div className="relative h-32 w-32 overflow-hidden rounded-md border">
                      <img
                        src={logoPreview || "/placeholder.svg"}
                        alt="Business Logo"
                        className="h-full w-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="flex h-32 w-32 items-center justify-center rounded-md border border-dashed">
                      <span className="text-sm text-muted-foreground">No logo</span>
                    </div>
                  )}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={handleOpenLogoGallery}>
                        <ImageIcon className="mr-2 h-4 w-4" />
                        Choose Logo from Gallery
                      </Button>
                      {logoPreview && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setLogoPreview(null)
                            setBusinessInfo((prev) => ({ ...prev, logo: null }))
                          }}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Select a logo from the gallery to represent your business.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="business_name">
                    Business Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="business_name"
                    name="business_name"
                    value={businessInfo.business_name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email Address <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={businessInfo.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">
                    Phone Number <span className="text-red-500">*</span>
                  </Label>
                  <Input id="phone" name="phone" value={businessInfo.phone} onChange={handleChange} required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    name="website"
                    value={businessInfo.website || ""}
                    onChange={handleChange}
                    placeholder="https://example.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">
                  Business Address <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="address"
                  name="address"
                  value={businessInfo.address}
                  onChange={handleChange}
                  rows={3}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Business Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={businessInfo.description || ""}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Describe your business services and specialties..."
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" type="button" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </CardFooter>
          </Card>
        </form>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Company Details</CardTitle>
            <CardDescription>
              This information is displayed on invoices, work orders, and customer-facing documents.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-start gap-6">
              {businessInfo.logo ? (
                <div className="relative h-40 w-40 overflow-hidden rounded-md border">
                  <img
                    src={businessInfo.logo || "/placeholder.svg"}
                    alt="Business Logo"
                    className="h-full w-full object-contain"
                  />
                </div>
              ) : (
                <div className="flex h-40 w-40 items-center justify-center rounded-md border border-dashed">
                  <span className="text-sm text-muted-foreground">No logo</span>
                </div>
              )}
              <div className="flex-1">
                <h3 className="text-2xl font-bold">{businessInfo.business_name}</h3>
                <p className="text-muted-foreground mt-2">{businessInfo.description || "No description provided."}</p>
              </div>
            </div>

            <Separator />

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Contact Information</h4>
                <div className="space-y-2">
                  <div className="flex items-start">
                    <span className="font-medium w-20">Email:</span>
                    <span>{businessInfo.email}</span>
                  </div>
                  <div className="flex items-start">
                    <span className="font-medium w-20">Phone:</span>
                    <span>{businessInfo.phone}</span>
                  </div>
                  <div className="flex items-start">
                    <span className="font-medium w-20">Website:</span>
                    <span>{businessInfo.website || "Not provided"}</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Business Address</h4>
                <p className="whitespace-pre-line">{businessInfo.address}</p>
              </div>
            </div>

            {businessInfo.created_at && (
              <div className="grid gap-4 md:grid-cols-2 text-sm text-muted-foreground">
                <div>
                  <span className="font-medium">Created:</span> {new Date(businessInfo.created_at).toLocaleDateString()}
                </div>
                {businessInfo.updated_at && (
                  <div>
                    <span className="font-medium">Last Updated:</span>{" "}
                    {new Date(businessInfo.updated_at).toLocaleDateString()}
                  </div>
                )}
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit Information
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Logo Gallery Dialog */}
      <Dialog open={isLogoGalleryOpen} onOpenChange={setIsLogoGalleryOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Choose Logo from Gallery</DialogTitle>
            <DialogDescription>Select a logo from the gallery to use for your business.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {isLoadingLogos ? (
              <div className="flex items-center justify-center h-[300px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Loading logos...</span>
              </div>
            ) : availableLogos.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[300px] text-center">
                <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No logos found in the gallery.</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4 max-h-[400px] overflow-y-auto p-2">
                {availableLogos.map((logo) => (
                  <div
                    key={logo.name}
                    className={`relative border rounded-md overflow-hidden cursor-pointer transition-all hover:ring-2 hover:ring-primary ${
                      logoPreview === logo.url ? "ring-2 ring-primary" : ""
                    }`}
                    onClick={() => handleSelectLogo(logo)}
                  >
                    <div className="aspect-square flex items-center justify-center p-2 bg-white">
                      <img
                        src={logo.url || "/placeholder.svg"}
                        alt={logo.name}
                        className="max-h-full max-w-full object-contain"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder.svg"
                        }}
                      />
                    </div>
                    <div className="p-2 bg-muted/50 text-xs truncate">{logo.name}</div>
                    {logoPreview === logo.url && (
                      <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                        <Check className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLogoGalleryOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disable Business Dialog */}
      <Dialog open={isDisableDialogOpen} onOpenChange={setIsDisableDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disable Business</DialogTitle>
            <DialogDescription>
              Are you sure you want to disable this business? This action can be reversed by an administrator.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Alert variant="warning">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Disabling this business will remove it from active view but not delete it permanently from the database.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDisableDialogOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDisableBusiness} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Disabling...
                </>
              ) : (
                "Disable Business"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
