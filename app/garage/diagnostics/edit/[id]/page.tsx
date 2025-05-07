"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { DiagnosticForm } from "@/components/diagnostics/diagnostic-form"
import { useAuth } from "@/app/context/auth-context"
import { getDiagnosticById, type Diagnostic } from "@/lib/api/diagnostics"
import { Loader2, ArrowLeft } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"

export default function EditDiagnosticPage() {
  const { user } = useAuth()
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [diagnostic, setDiagnostic] = useState<Diagnostic | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Check user permissions
  const canWrite = user?.role === "Manager" || user?.role === "Technician"

  useEffect(() => {
    if (!canWrite) {
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: "You don't have permission to edit diagnostics.",
      })
      router.push("/garage/diagnostics")
      return
    }

    const fetchDiagnostic = async () => {
      if (!params.id) return

      setIsLoading(true)
      try {
        const { data, error } = await getDiagnosticById(params.id as string)

        if (error) throw error
        if (!data) throw new Error("Diagnostic not found")

        setDiagnostic(data)
      } catch (err: any) {
        console.error("Error fetching diagnostic:", err)
        setError(err.message || "Failed to load diagnostic")
      } finally {
        setIsLoading(false)
      }
    }

    fetchDiagnostic()
  }, [params.id, canWrite])

  const handleSuccess = (updatedDiagnostic: Diagnostic) => {
    toast({
      title: "Diagnostic Updated",
      description: "The diagnostic has been updated successfully.",
    })
    router.push("/garage/diagnostics")
  }

  if (!canWrite) {
    return null // Prevent flash of content before redirect
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center mb-4">
        <Button variant="ghost" onClick={() => router.back()} className="mr-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Edit Diagnostic</h2>
          <p className="text-muted-foreground">Update diagnostic information.</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : diagnostic ? (
        <DiagnosticForm initialData={diagnostic} onSuccess={handleSuccess} canWrite={canWrite} />
      ) : (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Diagnostic not found or you don't have permission to edit it.</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
