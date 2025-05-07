"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Plus, Pencil, Eye } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/app/context/auth-context"
import type { UserProfile } from "@/lib/supabase"
// Update imports to use the utility functions
import { getInitials, getRoleColor } from "@/lib/utils"

export default function ProfilesPage() {
  const { toast } = useToast()
  const router = useRouter()
  const { user } = useAuth()

  const [profiles, setProfiles] = useState<UserProfile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchProfiles()
  }, [])

  const fetchProfiles = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.from("profiles").select("*").order("full_name")

      if (error) throw error

      setProfiles(data || [])
    } catch (err: any) {
      console.error("Error fetching profiles:", err)
      setError(err.message || "Failed to load profiles")
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditProfile = (profileId: string) => {
    router.push(`/settings/profiles/${profileId}`)
  }

  const handleViewProfile = (profileId: string) => {
    router.push(`/settings/profiles/${profileId}/view`)
  }

  const handleCreateProfile = () => {
    router.push("/settings/profiles/new")
  }

  // Remove the local implementations of these functions
  // Delete these functions:
  // Function to get initials from full name
  // const getInitials = (name: string) => {
  //   return name
  //     .split(" ")
  //     .map((n) => n[0])
  //     .join("")
  //     .toUpperCase()
  // }

  // Function to get color based on role
  // const getRoleColor = (role: string) => {
  //   switch (role) {
  //     case "Manager":
  //       return "bg-blue-500"
  //     case "Technician":
  //       return "bg-emerald-500"
  //     case "Front Desk":
  //       return "bg-amber-500"
  //     default:
  //       return "bg-gray-500"
  //   }
  // }

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading profiles...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">User Profiles</h2>
          <p className="text-muted-foreground">Manage user profiles and permissions.</p>
        </div>
        <Button onClick={handleCreateProfile}>
          <Plus className="mr-2 h-4 w-4" />
          Create New Profile
        </Button>
      </div>

      <Separator />

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {profiles.length === 0 ? (
        <div className="flex h-96 w-full items-center justify-center rounded-md border border-dashed">
          <div className="text-center">
            <h3 className="text-lg font-medium">No profiles found</h3>
            <p className="text-sm text-muted-foreground mt-1">Get started by creating a new user profile.</p>
            <Button variant="outline" className="mt-4" onClick={handleCreateProfile}>
              <Plus className="mr-2 h-4 w-4" />
              Create Profile
            </Button>
          </div>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]"></TableHead>
                <TableHead>Full Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead className="hidden md:table-cell">Address</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.map((profile) => (
                <TableRow key={profile.id}>
                  <TableCell>
                    <Avatar className="h-10 w-10">
                      {profile.image ? (
                        <AvatarImage src={profile.image || "/placeholder.svg"} alt={profile.full_name} />
                      ) : (
                        <AvatarFallback className={getRoleColor(profile.role)}>
                          {getInitials(profile.full_name)}
                        </AvatarFallback>
                      )}
                    </Avatar>
                  </TableCell>
                  <TableCell className="font-medium">{profile.full_name}</TableCell>
                  <TableCell>{profile.email}</TableCell>
                  <TableCell>
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
                  </TableCell>
                  <TableCell>{profile.phone || "—"}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {profile.address
                      ? profile.address.length > 30
                        ? `${profile.address.substring(0, 30)}...`
                        : profile.address
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleViewProfile(profile.id)}>
                      <Eye className="h-4 w-4" />
                      <span className="sr-only md:not-sr-only md:ml-2">View</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditProfile(profile.id)}
                      disabled={user?.id !== profile.id && user?.role !== "Manager"}
                    >
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only md:not-sr-only md:ml-2">Edit</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
