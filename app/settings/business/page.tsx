"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Upload, Pencil } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  getBusinessInformation,
  createBusinessInformation,
  updateBusinessInformation,
  initializeDefaultWorkingHours,
  type BusinessInformation,
} from "@/lib/api/business"
import { supabase } from "@/lib/supabase"

export default function BusinessInformationPage() {
  const { toast } = useToast()
  const router = useRouter()

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
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
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

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

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setBusinessInfo((prev) => ({ ...prev, [name]: value }))
  }

  // Handle logo file selection
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setLogoFile(file)

      // Create preview
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          setLogoPreview(event.target.result as string)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  // Upload logo to storage
  const uploadLogo = async (businessId: string): Promise<string | null> => {
    if (!logoFile) return businessInfo.logo || null

    try {
      const fileExt = logoFile.name.split(".").pop()
      const fileName = `${businessId}/logo.${fileExt}`
      const filePath = `business/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from("business-assets")
        .upload(filePath, logoFile, { upsert: true })

      if (uploadError) {
        console.error("Error uploading logo:", uploadError)
        throw uploadError
      }

      const { data } = supabase.storage.from("business-assets").getPublicUrl(filePath)

      return data.publicUrl
    } catch (error) {
      console.error("Exception uploading logo:", error)
      return null
    }
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

      let logoUrl = businessInfo.logo

      // If we have an existing business record
      if (businessInfo.id) {
        // Upload logo if changed
        if (logoFile) {
          logoUrl = await uploadLogo(businessInfo.id)
        }

        // Update business information
        const result = await updateBusinessInformation(businessInfo.id, {
          ...businessInfo,
          logo: logoUrl,
        })

        if (!result.success) {
          throw new Error(result.error?.message || "Failed to update business information")
        }

        toast({
          title: "Business information updated",
          description: "Your business information has been updated successfully.",
        })
      } else {
        // Create new business record
        const result = await createBusinessInformation({
          ...businessInfo,
          logo: null, // We'll update this after we have the ID
        })

        if (!result.success || !result.data) {
          throw new Error(result.error?.message || "Failed to create business information")
        }

        // Upload logo if provided
        if (logoFile) {
          logoUrl = await uploadLogo(result.data.id!)

          // Update the record with the logo URL
          if (logoUrl) {
            await updateBusinessInformation(result.data.id!, { logo: logoUrl })
          }
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
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit Information
            </Button>
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2 md:col-span-1">
                  <Label htmlFor="logo">Company Logo</Label>
                  <div className="flex flex-col items-center gap-4">
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
                    <div className="space-y-2 w-full">
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => document.getElementById("logo-upload")?.click()}
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          Upload Logo
                        </Button>
                        {logoPreview && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => {
                              setLogoPreview(null)
                              setLogoFile(null)
                              setBusinessInfo((prev) => ({ ...prev, logo: null }))
                            }}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                      <input
                        id="logo-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleLogoChange}
                      />
                      <p className="text-xs text-muted-foreground">
                        Recommended: Square image, at least 200x200px. Max 2MB.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6 md:col-span-2">
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
                </div>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1 flex flex-col items-center">
                {businessInfo.logo ? (
                  <div className="relative h-40 w-40 overflow-hidden rounded-md border mb-4">
                    <img
                      src={businessInfo.logo || "/placeholder.svg"}
                      alt="Business Logo"
                      className="h-full w-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="flex h-40 w-40 items-center justify-center rounded-md border border-dashed mb-4">
                    <span className="text-sm text-muted-foreground">No logo</span>
                  </div>
                )}
                <h3 className="text-xl font-bold text-center">{businessInfo.business_name}</h3>
              </div>

              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
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
                <div className="md:col-span-2">
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Business Description</h4>
                  <p className="whitespace-pre-line">{businessInfo.description || "No description provided."}</p>
                </div>
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 text-sm text-muted-foreground">
                  {businessInfo.created_at && (
                    <div>
                      <span className="font-medium">Created:</span>{" "}
                      {new Date(businessInfo.created_at).toLocaleDateString()}
                    </div>
                  )}
                  {businessInfo.updated_at && (
                    <div>
                      <span className="font-medium">Last Updated:</span>{" "}
                      {new Date(businessInfo.updated_at).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit Information
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  )
}
