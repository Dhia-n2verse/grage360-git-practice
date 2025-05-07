"use client"

import { useBusiness } from "@/app/context/business-context"
import Image from "next/image"
import Link from "next/link"

interface LogoProps {
  className?: string
  showText?: boolean
  size?: "sm" | "md" | "lg" | "xl"
  linkEnabled?: boolean
}

export function Logo({ className = "", showText = true, size = "md", linkEnabled = true }: LogoProps) {
  const { businessInfo, isLoading } = useBusiness()

  // Default logo if not loaded yet
  const defaultLogo = "/placeholder.svg"

  // Get the business name and logo from context
  const businessName = businessInfo?.business_name || ""
  const logoUrl = businessInfo?.logo || defaultLogo

  // Size configurations with improved proportions
  const sizes = {
    sm: { width: 48, height: 48, fontSize: "text-sm", padding: "p-1" },
    md: { width: 64, height: 64, fontSize: "text-base", padding: "p-1.5" },
    lg: { width: 88, height: 88, fontSize: "text-xl", padding: "p-2" },
    xl: { width: 120, height: 120, fontSize: "text-2xl", padding: "p-3" },
  }

  const { width, height, fontSize, padding } = sizes[size]

  // If no business name is available yet, show nothing or a loading state
  if (!businessName && isLoading) {
    return (
      <div className={`flex flex-col sm:flex-row items-center gap-3 ${className}`}>
        <div className="animate-pulse bg-muted rounded-full" style={{ width, height }}></div>
        {showText && <div className="animate-pulse bg-muted h-5 w-24 rounded"></div>}
      </div>
    )
  }

  // If no business name is available and not loading, return null
  if (!businessName && !isLoading) {
    return null
  }

  const logoContent = (
    <>
      <div
        className={`relative overflow-hidden rounded-full flex items-center justify-center bg-background ${padding}`}
        style={{ width, height }}
      >
        <Image
          src={logoUrl || "/placeholder.svg"}
          alt={businessName}
          width={width - 16}
          height={height - 16}
          className="object-contain"
          onError={(e) => {
            // Fallback to default logo if the image fails to load
            e.currentTarget.src = defaultLogo
          }}
        />
      </div>
      {showText && <span className={`font-semibold ${fontSize} text-center sm:text-left`}>{businessName}</span>}
    </>
  )

  // Conditionally wrap in Link component
  if (linkEnabled) {
    return (
      <Link href="/" className={`flex flex-col sm:flex-row items-center gap-3 ${className}`}>
        {logoContent}
      </Link>
    )
  }

  return <div className={`flex flex-col sm:flex-row items-center gap-3 ${className}`}>{logoContent}</div>
}
