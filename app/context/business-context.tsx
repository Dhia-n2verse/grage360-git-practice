"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { getBusinessInformation, type BusinessInformation } from "@/lib/api/business"

interface BusinessContextType {
  businessInfo: BusinessInformation | null
  isLoading: boolean
  error: string | null
  refreshBusinessInfo: () => Promise<void>
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined)

export function BusinessProvider({ children }: { children: ReactNode }) {
  const [businessInfo, setBusinessInfo] = useState<BusinessInformation | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBusinessInfo = async () => {
    setIsLoading(true)
    try {
      const data = await getBusinessInformation()
      setBusinessInfo(data)
    } catch (err) {
      console.error("Error fetching business information:", err)
      setError("Failed to load business information")
    } finally {
      setIsLoading(false)
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchBusinessInfo()
  }, [])

  // Function to refresh business info
  const refreshBusinessInfo = async () => {
    await fetchBusinessInfo()
  }

  return (
    <BusinessContext.Provider value={{ businessInfo, isLoading, error, refreshBusinessInfo }}>
      {children}
    </BusinessContext.Provider>
  )
}

export function useBusiness() {
  const context = useContext(BusinessContext)
  if (context === undefined) {
    throw new Error("useBusiness must be used within a BusinessProvider")
  }
  return context
}
