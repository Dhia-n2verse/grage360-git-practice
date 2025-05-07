"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2, ArrowLeft, Mail, Phone, MapPin, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/app/context/auth-context"
import type { UserProfile } from "@/lib/supabase"
import { getInitials, getRoleColor } from "@/lib/utils"
import { getTechnicianSpecialties } from "@/lib/api/specialties"
import type { Specialty } from "@/types/specialties"

export default function ViewProfilePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { user } = useAuth()

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [specialties, setSpecialties] = useState<Specialty[]>([])
  const [isLoadingSpecialties, setIsLoadingSpecialties] = useState(false)

  useEffect(() => {
    fetchProfile()
  }, [params.id])

  useEffect(() => {
    if (profile?.role === "Technician") {
      fetchTechnicianSpecialties()
    }
  }, [profile?.role, params.id])

  const fetchProfile = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", params.id).single()

      if (error) throw error

      setProfile(data)
    } catch (err: any) {
      console.error("Error fetching profile:", err)
      setError(err.message || "Failed to load profile")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchTechnicianSpecialties = async () => {
    setIsLoadingSpecialties(true)
    try {
      const { data, error } = await getTechnicianSpecialties(params.id)
      if (error) throw error
      setSpecialties(data || [])
    } catch (err) {
      console.error("Error fetching technician specialties:", err)
    } finally {
      setIsLoadingSpecialties(false)
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

  if (!profile) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Profile not found.</AlertDescription>
        </Alert>
        <Button variant="outline" onClick={() => router.push("/settings/profiles")}>
          Back to Profiles
        </Button>
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
            <h2 className="text-3xl font-bold tracking-tight">Profile Details</h2>
            <p className="text-muted-foreground">Viewing profile information for {profile.full_name}.</p>
          </div>
        </div>
        {(user?.id === profile.id || user?.role === "Manager") && (
          <Button onClick={() => router.push(`/settings/profiles/${profile.id}`)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit Profile
          </Button>
        )}
      </div>

      <Separator />

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>User profile details and contact information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:items-start sm:justify-start">
              <Avatar className="h-24 w-24 border-2 border-muted">
                {profile.image ? (
                  <AvatarImage src={profile.image || "/placeholder.svg"} alt={profile.full_name} />
                ) : (
                  <AvatarFallback className={getRoleColor(profile.full_name)}>
                    {getInitials(profile.full_name)}
                  </AvatarFallback>
                )}
              </Avatar>

              <div className="space-y-1 text-center sm:text-left">
                <h3 className="text-xl font-bold">{profile.full_name}</h3>
                <div className="flex items-center justify-center gap-1 sm:justify-start">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      profile.role === "Manager"
                        ? "bg-blue-100 text-blue-800"
                        : profile.role === "Technician"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {profile.role}
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-start gap-2">
                <Mail className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Email</p>
                  <p className="text-muted-foreground">{profile.email}</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Phone className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Phone</p>
                  <p className="text-muted-foreground">{profile.phone || "Not provided"}</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <MapPin className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Address</p>
                  <p className="text-muted-foreground whitespace-pre-line">{profile.address || "Not provided"}</p>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" onClick={() => router.push("/settings/profiles")}>
              Back to Profiles
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>System information about this user account.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">User ID</p>
              <p className="text-sm text-muted-foreground font-mono">{profile.id}</p>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium">Created At</p>
              <p className="text-sm text-muted-foreground">
                {profile.created_at ? new Date(profile.created_at).toLocaleString() : "Unknown"}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium">Last Updated</p>
              <p className="text-sm text-muted-foreground">
                {profile.updated_at ? new Date(profile.updated_at).toLocaleString() : "Unknown"}
              </p>
            </div>

            <Separator />

            <div className="space-y-1">
              <p className="text-sm font-medium">Permissions</p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                {profile.role === "Manager" && (
                  <>
                    <li>Full system access</li>
                    <li>User management</li>
                    <li>Business settings</li>
                    <li>Financial reports</li>
                  </>
                )}
                {profile.role === "Technician" && (
                  <>
                    <li>Garage operations</li>
                    <li>Service records</li>
                    <li>Inventory access</li>
                  </>
                )}
                {profile.role === "Front Desk" && (
                  <>
                    <li>Customer management</li>
                    <li>Appointment scheduling</li>
                    <li>Invoicing</li>
                  </>
                )}
              </ul>
            </div>
          </CardContent>
        </Card>
        {profile?.role === "Technician" && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Specialties</CardTitle>
              <CardDescription>Areas of expertise for this technician.</CardDescription>
            </CardHeader>
            <CardContent>
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
                      <span className="font-medium">{specialty.name}</span>
                      {specialty.description && (
                        <span className="text-sm text-muted-foreground"> - {specialty.description}</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No specialties assigned.</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
