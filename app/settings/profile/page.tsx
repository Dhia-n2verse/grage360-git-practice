"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/app/context/auth-context"
import { ProfileImageManager } from "@/components/profile/profile-image-manager"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"

// Add the import for the specialties API
import { getTechnicianSpecialties } from "@/lib/api/specialties"
import type { Specialty } from "@/types/specialties"

export default function ProfilePage() {
  const { toast } = useToast()
  const { user, refreshUserProfile } = useAuth()
  const router = useRouter()

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<string>("details")

  // Profile state
  const [profile, setProfile] = useState<any>(null)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [image, setImage] = useState<string | null>(null)

  // Add specialties state inside the component
  const [specialties, setSpecialties] = useState<Specialty[]>([])
  const [isLoadingSpecialties, setIsLoadingSpecialties] = useState(false)

  // Fetch user profile on component mount
  useEffect(() => {
    if (user?.id) {
      fetchProfile(user.id)
    } else {
      setIsLoading(false)
    }
  }, [user?.id])

  // Add this useEffect to fetch specialties
  useEffect(() => {
    if (user?.id && profile?.role === "Technician") {
      fetchTechnicianSpecialties()
    }
  }, [user?.id, profile?.role])

  const fetchProfile = async (userId: string) => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

      if (error) throw error

      if (data) {
        setProfile(data)
        setFirstName(data.first_name || "")
        setLastName(data.last_name || "")
        setPhone(data.phone || "")
        setAddress(data.address || "")
        setImage(data.image || null)
      }
    } catch (err: any) {
      console.error("Error fetching profile:", err)
      setError(err.message || "Failed to load profile")
    } finally {
      setIsLoading(false)
    }
  }

  // Add this function to fetch technician specialties
  const fetchTechnicianSpecialties = async () => {
    if (!user?.id) return

    setIsLoadingSpecialties(true)
    try {
      const { data, error } = await getTechnicianSpecialties(user.id)
      if (error) throw error
      setSpecialties(data || [])
    } catch (err) {
      console.error("Error fetching technician specialties:", err)
    } finally {
      setIsLoadingSpecialties(false)
    }
  }

  const handleSave = async () => {
    if (!user?.id) return

    setIsSaving(true)
    setError(null)

    try {
      // Validate required fields
      if (!firstName.trim()) {
        throw new Error("First name is required")
      }

      // Update profile
      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: firstName,
          last_name: lastName,
          full_name: `${firstName} ${lastName}`.trim(),
          phone,
          address,
          image,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (error) {
        throw error
      } else {
        // Refresh the user profile in the auth context
        await refreshUserProfile()

        toast({
          title: "Profile updated",
          description: "Your profile has been updated successfully.",
        })
      }
    } catch (err: any) {
      console.error("Error saving profile:", err)
      setError(err.message || "Failed to save profile")
    } finally {
      setIsSaving(false)
    }
  }

  // Handle image change
  const handleImageChange = (imageUrl: string | null) => {
    setImage(imageUrl)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading profile...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Profile Settings</h2>
        <p className="text-muted-foreground">Manage your personal information and preferences.</p>
      </div>

      <Separator />

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="details">Profile Details</TabsTrigger>
          <TabsTrigger value="avatar">Profile Picture</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your personal details and contact information.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="first-name">
                    First Name <span className="text-red-500">*</span>
                  </Label>
                  <Input id="first-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="last-name">Last Name</Label>
                  <Input id="last-name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" value={profile?.email || ""} disabled className="bg-muted" />
                <p className="text-xs text-muted-foreground">Email address cannot be changed.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Input id="role" value={profile?.role || ""} disabled className="bg-muted" />
                <p className="text-xs text-muted-foreground">Role can only be changed by an administrator.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter phone number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter address"
                  rows={3}
                />
              </div>

              {profile?.role === "Technician" && (
                <div className="space-y-2 mt-4">
                  <Label>Specialties</Label>
                  {isLoadingSpecialties ? (
                    <div className="flex items-center">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span>Loading specialties...</span>
                    </div>
                  ) : specialties.length > 0 ? (
                    <div className="grid gap-2">
                      {specialties.map((specialty) => (
                        <div key={specialty.id} className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-primary" />
                          <span>{specialty.name}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No specialties assigned. Please contact your manager to update your specialties.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={handleSave} disabled={isSaving}>
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
        </TabsContent>

        <TabsContent value="avatar" className="space-y-4 pt-4">
          {user && (
            <>
              <ProfileImageManager
                userId={user.id}
                userName={`${firstName} ${lastName}`.trim() || user.name}
                currentImage={image}
                onImageChange={handleImageChange}
              />

              <div className="flex justify-end mt-4">
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
