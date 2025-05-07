"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Camera, Upload, ArrowLeft, UserCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/app/context/auth-context"
import type { UserProfile } from "@/lib/supabase"
// Update imports to use the utility functions
import { getInitials, getRoleColor } from "@/lib/utils"
// Add the import for the specialties API
import { getAllSpecialties, getTechnicianSpecialties, updateTechnicianSpecialties } from "@/lib/api/specialties"
import { Checkbox } from "@/components/ui/checkbox"
import type { Specialty } from "@/types/specialties"

export default function EditProfilePage({ params }: { params: { id: string } }) {
  const { toast } = useToast()
  const router = useRouter()
  const { user, fetchUserProfiles } = useAuth()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [cameraOpen, setCameraOpen] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [activeTab, setActiveTab] = useState<string>("details")
  // Add specialties state inside the component
  const [specialties, setSpecialties] = useState<Specialty[]>([])
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([])
  const [isLoadingSpecialties, setIsLoadingSpecialties] = useState(false)

  const isNewProfile = params.id === "new"
  const profileId = isNewProfile ? null : params.id

  useEffect(() => {
    if (!isNewProfile) {
      fetchProfile()
    } else {
      setIsLoading(false)
    }

    return () => {
      // Clean up camera stream if active
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [params.id])

  // Add this useEffect to fetch specialties
  useEffect(() => {
    if (!isNewProfile && profile?.role === "Technician") {
      fetchSpecialties()
      fetchTechnicianSpecialties()
    }
  }, [profile?.role])

  const fetchProfile = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", profileId).single()

      if (error) throw error

      if (data) {
        setProfile(data)

        // Split full name into first and last name
        const nameParts = data.full_name.split(" ")
        const first = nameParts[0] || ""
        const last = nameParts.slice(1).join(" ") || ""

        setFirstName(first)
        setLastName(last)
        setPhone(data.phone || "")
        setAddress(data.address || "")
        setAvatarUrl(data.avatar_url)
      }
    } catch (err: any) {
      console.error("Error fetching profile:", err)
      setError(err.message || "Failed to load profile")
    } finally {
      setIsLoading(false)
    }
  }

  // Add these functions to fetch specialties
  const fetchSpecialties = async () => {
    setIsLoadingSpecialties(true)
    try {
      const { data, error } = await getAllSpecialties()
      if (error) throw error
      setSpecialties(data || [])
    } catch (err) {
      console.error("Error fetching specialties:", err)
    } finally {
      setIsLoadingSpecialties(false)
    }
  }

  const fetchTechnicianSpecialties = async () => {
    if (!profileId) return

    try {
      const { data, error } = await getTechnicianSpecialties(profileId)
      if (error) throw error

      // Extract specialty IDs
      const specialtyIds = (data || []).map((specialty) => specialty.id)
      setSelectedSpecialties(specialtyIds)
    } catch (err) {
      console.error("Error fetching technician specialties:", err)
    }
  }

  // Update the handleSave function to include specialties
  const handleSave = async () => {
    setIsSaving(true)
    setError(null)

    try {
      // Validate required fields
      if (!firstName.trim()) {
        throw new Error("First name is required")
      }

      const fullName = `${firstName} ${lastName}`.trim()

      // Upload avatar if changed
      let newAvatarUrl = avatarUrl
      if (avatarFile) {
        const userId = profileId || "new"
        const fileExt = avatarFile.name.split(".").pop()
        const fileName = `${userId}/avatar.${fileExt}`
        const filePath = `avatars/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from("user-avatars")
          .upload(filePath, avatarFile, { upsert: true })

        if (uploadError) throw uploadError

        const { data } = supabase.storage.from("user-avatars").getPublicUrl(filePath)
        newAvatarUrl = data.publicUrl
      }

      if (isNewProfile) {
        // Create new profile
        const { data, error } = await supabase
          .from("profiles")
          .insert([
            {
              full_name: fullName,
              email: "", // This would typically come from auth
              role: "Front Desk", // Default role for new profiles
              phone,
              address,
              avatar_url: newAvatarUrl,
            },
          ])
          .select()

        if (error) throw error

        toast({
          title: "Profile created",
          description: "The user profile has been created successfully.",
        })
      } else {
        // Update existing profile
        const { error } = await supabase
          .from("profiles")
          .update({
            full_name: fullName,
            phone,
            address,
            avatar_url: newAvatarUrl,
          })
          .eq("id", profileId)

        if (error) throw error

        // If this is a technician, update their specialties
        if (profile?.role === "Technician") {
          const { error: specialtiesError } = await updateTechnicianSpecialties(profileId!, selectedSpecialties)
          if (specialtiesError) throw specialtiesError
        }

        toast({
          title: "Profile updated",
          description: "Your profile has been updated successfully.",
        })
      }

      // Refresh user profiles in auth context
      fetchUserProfiles()

      // Navigate back to profiles list
      router.push("/settings/profiles")
    } catch (err: any) {
      console.error("Error saving profile:", err)
      setError(err.message || "Failed to save profile")
    } finally {
      setIsSaving(false)
    }
  }

  // Add a function to handle specialty selection
  const handleSpecialtyChange = (specialtyId: string, checked: boolean) => {
    setSelectedSpecialties((prev) => {
      if (checked) {
        return [...prev, specialtyId]
      } else {
        return prev.filter((id) => id !== specialtyId)
      }
    })
  }

  const startCamera = async () => {
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } })
      setStream(newStream)
      if (videoRef.current) {
        videoRef.current.srcObject = newStream
      }
      setCameraOpen(true)
    } catch (err) {
      console.error("Error accessing camera:", err)
      toast({
        title: "Error",
        description: "Failed to access camera. Please check your permissions.",
        variant: "destructive",
      })
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }
    setCameraOpen(false)
  }

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        const dataUrl = canvas.toDataURL("image/png")
        setAvatarUrl(dataUrl)
        setAvatarFile(null) // Clear any previously selected file
      }
      stopCamera()
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      setAvatarUrl(URL.createObjectURL(file))
    }
  }

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading profile...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" className="mr-2" onClick={() => router.push("/settings/profiles")}>
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              {isNewProfile ? "Create New Profile" : "Edit Profile"}
            </h2>
            <p className="text-muted-foreground">
              {isNewProfile
                ? "Create a new user profile with all required information."
                : `Update profile information for ${profile?.full_name}.`}
            </p>
          </div>
        </div>
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
          {profile?.role === "Technician" && <TabsTrigger value="specialties">Specialties</TabsTrigger>}
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
                <Input id="role" value={profile?.role || "Front Desk"} disabled className="bg-muted" />
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
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => router.push("/settings/profiles")}>
                Cancel
              </Button>
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
          <Card>
            <CardHeader>
              <CardTitle>Profile Picture</CardTitle>
              <CardDescription>Update your profile picture. You can take a photo or upload an image.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center justify-center gap-6">
                <div className="relative">
                  <Avatar className="h-32 w-32 border-2 border-muted">
                    {avatarUrl ? (
                      <AvatarImage src={avatarUrl || "/placeholder.svg"} alt="Profile" />
                    ) : profile ? (
                      <AvatarFallback className={getRoleColor(profile.role)}>
                        {getInitials(profile.full_name)}
                      </AvatarFallback>
                    ) : (
                      <AvatarFallback>
                        <UserCircle className="h-20 w-20 text-muted-foreground" />
                      </AvatarFallback>
                    )}
                  </Avatar>
                </div>

                <div className="flex flex-wrap gap-4 justify-center">
                  <Button variant="outline" onClick={startCamera} className="flex items-center gap-2">
                    <Camera className="h-4 w-4" />
                    Take Photo
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Upload Image
                  </Button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </div>

                {avatarUrl && (
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setAvatarUrl(null)
                      setAvatarFile(null)
                    }}
                  >
                    Remove Photo
                  </Button>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => router.push("/settings/profiles")}>
                Cancel
              </Button>
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

        <TabsContent value="specialties" className="space-y-4 pt-4">
          {profile?.role === "Technician" && (
            <Card>
              <CardHeader>
                <CardTitle>Technician Specialties</CardTitle>
                <CardDescription>Select the areas of expertise for this technician.</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingSpecialties ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="ml-2">Loading specialties...</span>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {specialties.map((specialty) => (
                      <div key={specialty.id} className="flex items-start space-x-3 space-y-0">
                        <Checkbox
                          id={`specialty-${specialty.id}`}
                          checked={selectedSpecialties.includes(specialty.id)}
                          onCheckedChange={(checked) => handleSpecialtyChange(specialty.id, checked as boolean)}
                        />
                        <div className="grid gap-1.5 leading-none">
                          <label
                            htmlFor={`specialty-${specialty.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {specialty.name}
                          </label>
                          {specialty.description && (
                            <p className="text-sm text-muted-foreground">{specialty.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                    {specialties.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        No specialties found. Please contact an administrator.
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => router.push("/settings/profiles")}>
                  Cancel
                </Button>
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
          )}
        </TabsContent>
      </Tabs>

      {/* Camera Dialog */}
      <Dialog open={cameraOpen} onOpenChange={(open) => !open && stopCamera()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Take Profile Photo</DialogTitle>
            <DialogDescription>
              Position your face in the center of the frame and click the capture button.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="relative w-full overflow-hidden rounded-lg bg-black">
              <video ref={videoRef} autoPlay playsInline muted className="h-auto w-full" />
            </div>
            <canvas ref={canvasRef} className="hidden" />
          </div>
          <DialogFooter className="flex justify-between sm:justify-between">
            <Button variant="outline" onClick={stopCamera}>
              Cancel
            </Button>
            <Button onClick={capturePhoto}>Capture Photo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
