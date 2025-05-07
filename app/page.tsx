"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/app/context/auth-context"
import { useBusiness } from "@/app/context/business-context"
import { isSupabaseConfigured } from "@/lib/env"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, FileText, Truck } from "lucide-react"
import { Logo } from "@/app/components/logo"

export default function HomePage() {
  const { user, isLoading } = useAuth()
  const { businessInfo } = useBusiness()
  const router = useRouter()

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading) {
      if (!isSupabaseConfigured()) {
        // If Supabase is not configured, we can still show the page without redirecting
        console.warn("Supabase environment variables are not configured. Authentication features will not work.")
      } else if (!user) {
        router.push("/auth/login")
      }
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>
  }

  return (
    <div>
      <div className="flex flex-col items-center justify-center space-y-6 text-center max-w-3xl mx-auto py-12">
        <Logo size="xl" showText={false} linkEnabled={false} />
        <h1 className="text-3xl font-bold tracking-tight">Welcome to Dashboard</h1>
        <p className="text-muted-foreground">Your modern solution for garage management</p>
        <p className="text-lg font-medium">
          Logged in as: {user?.name || "Guest"} ({user?.role || "Visitor"})
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Frequently used operations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start">
              <Truck className="mr-2 h-4 w-4" />
              New Vehicle
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <FileText className="mr-2 h-4 w-4" />
              Create Work Order
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <DollarSign className="mr-2 h-4 w-4" />
              New Invoice
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="w-2 h-2 mt-2 rounded-full bg-primary" />
                  <div>
                    <p className="text-sm font-medium">Work order #{1000 + i} completed</p>
                    <p className="text-xs text-muted-foreground">2 hours ago</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Today's Schedule</CardTitle>
            <CardDescription>Upcoming appointments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="text-xs font-medium text-muted-foreground w-16">{9 + i * 2}:00 AM</div>
                  <div>
                    <p className="text-sm font-medium">Vehicle Service</p>
                    <p className="text-xs text-muted-foreground">Toyota Camry • {i === 2 ? "S.Sarah" : "John Doe"}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
