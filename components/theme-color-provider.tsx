"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { useAuth } from "@/app/context/auth-context"

type ThemeColor = "black" | "orange" | "blue" | "green" | "purple" | "gray"

interface ThemeColorContextType {
  themeColor: ThemeColor
  setThemeColor: (color: ThemeColor) => Promise<void>
}

const ThemeColorContext = createContext<ThemeColorContextType | undefined>(undefined)

export function ThemeColorProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [themeColor, setThemeColorState] = useState<ThemeColor>("black")

  // Initialize theme color from user preferences
  useEffect(() => {
    if (user?.theme_color) {
      setThemeColorState(user.theme_color as ThemeColor)
    } else {
      setThemeColorState("black") // Default to black
    }
  }, [user?.theme_color])

  // Apply theme color class to document element
  useEffect(() => {
    const root = document.documentElement

    // Remove all theme color classes
    root.classList.remove("theme-black", "theme-orange", "theme-blue", "theme-green", "theme-purple", "theme-gray")

    // Add the current theme color class
    root.classList.add(`theme-${themeColor}`)
  }, [themeColor])

  // Function to update theme color in Supabase
  const setThemeColor = async (color: ThemeColor) => {
    setThemeColorState(color)
    // The actual update to Supabase will be handled in the theme settings page
  }

  return <ThemeColorContext.Provider value={{ themeColor, setThemeColor }}>{children}</ThemeColorContext.Provider>
}

export function useThemeColor() {
  const context = useContext(ThemeColorContext)
  if (!context) {
    throw new Error("useThemeColor must be used within a ThemeColorProvider")
  }
  return context
}
