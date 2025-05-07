"use client"

import { createContext, useContext } from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import type { ThemeProviderProps } from "next-themes"
import { useAuth } from "@/app/context/auth-context"

// Create a context for theme color
export const ThemeColorContext = createContext<string>("black")

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const { user } = useAuth()

  // Get the user's theme color preference or default to black
  const themeColor = user?.theme_color || "black"

  return (
    <ThemeColorContext.Provider value={themeColor}>
      <NextThemesProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        themes={["light", "dark", "high-contrast"]}
        {...props}
      >
        {children}
      </NextThemesProvider>
    </ThemeColorContext.Provider>
  )
}

// Custom hook to access the theme color
export function useThemeColor() {
  return useContext(ThemeColorContext)
}
