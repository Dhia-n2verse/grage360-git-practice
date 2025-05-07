import type React from "react"
import "@/app/globals.css"
import { Inter } from "next/font/google"
import { validateEnv } from "@/lib/env"
import type { Metadata } from "next"
import ClientRootLayout from "./ClientRootLayout"

// Validate environment variables (now just logs warnings instead of throwing errors)
validateEnv()

const inter = Inter({ subsets: ["latin"] })

// Update the metadata title
export const metadata: Metadata = {
  title: "iGarage360 | Garage Management System",
  description: "Your modern solution for garage management",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className={inter.className}>
        <ClientRootLayout>{children}</ClientRootLayout>
      </body>
    </html>
  )
}

import "./globals.css"

import "./globals.css"

import "./globals.css"

import "./globals.css"

import "./globals.css"

import "./globals.css"

import "./globals.css"

import "./globals.css"

import "./globals.css"

import "./globals.css"

import "./globals.css"

import "./globals.css"

import "./globals.css"
