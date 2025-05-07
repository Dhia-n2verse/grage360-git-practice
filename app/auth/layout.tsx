import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Authentication - iGarage360",
  description: "Authentication pages for iGarage360",
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className="min-h-screen bg-gradient-to-b from-muted/50 to-muted">{children}</div>
}
