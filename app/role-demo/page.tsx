"use client"

import { useState } from "react"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { RoleBasedSidebar } from "@/components/role-based-sidebar"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/app/context/auth-context"
import { AppHeader } from "@/components/app-header"

export default function RoleDemoPage() {
  const { user } = useAuth()
  const [demoRole, setDemoRole] = useState<string | undefined>(user?.role || "Front Desk")

  // Mock function to simulate changing roles
  const changeRole = (role: string) => {
    setDemoRole(role)
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen flex-col">
        <div className="bg-amber-50 text-amber-800 px-4 py-2 text-sm text-center">
          <strong>Role Demo Mode:</strong> Currently viewing sidebar for role: <strong>{demoRole}</strong>
        </div>

        <div className="flex flex-1">
          {/* Override the user role for demo purposes */}
          <RoleBasedSidebar key={demoRole} overrideRole={demoRole} />

          <SidebarInset>
            <AppHeader />
            <main className="flex-1 p-6">
              <div className="flex flex-col items-center justify-center space-y-8 max-w-3xl mx-auto py-12">
                <h1 className="text-3xl font-bold tracking-tight text-center">Role-Based Sidebar Demo</h1>
                <p className="text-muted-foreground text-center">
                  This page demonstrates how the sidebar navigation adapts based on user role. Select a role below to
                  see the corresponding sidebar navigation.
                </p>

                <div className="flex flex-wrap gap-4 justify-center mt-8">
                  <Button
                    variant={demoRole === "Manager" ? "default" : "outline"}
                    onClick={() => changeRole("Manager")}
                    className="min-w-[150px]"
                  >
                    Manager
                  </Button>
                  <Button
                    variant={demoRole === "Front Desk" ? "default" : "outline"}
                    onClick={() => changeRole("Front Desk")}
                    className="min-w-[150px]"
                  >
                    Front Desk
                  </Button>
                  <Button
                    variant={demoRole === "Technician" ? "default" : "outline"}
                    onClick={() => changeRole("Technician")}
                    className="min-w-[150px]"
                  >
                    Technician
                  </Button>
                </div>

                <div className="mt-8 p-6 border rounded-lg bg-card w-full">
                  <h2 className="text-xl font-semibold mb-4">Current Role: {demoRole}</h2>
                  <p className="mb-4">The sidebar on the left shows the navigation items for the {demoRole} role.</p>

                  <div className="space-y-2 text-sm">
                    <p>
                      <strong>Manager:</strong> Full access to all system features and settings.
                    </p>
                    <p>
                      <strong>Front Desk:</strong> Access to customer management, financial, service management,
                      inventory, and staff management features.
                    </p>
                    <p>
                      <strong>Technician:</strong> Limited access to garage operations, calendar, and inventory
                      tracking.
                    </p>
                  </div>
                </div>
              </div>
            </main>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  )
}
