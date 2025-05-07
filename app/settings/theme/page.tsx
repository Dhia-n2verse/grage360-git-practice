"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Check, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useAuth } from "@/app/context/auth-context"
import { useToast } from "@/components/ui/use-toast"
import { useTheme } from "next-themes"
import { updateUserProfile } from "@/lib/api/profile"
import { supabase } from "@/lib/supabase"

// Theme options
const themeOptions = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "high-contrast", label: "High Contrast" },
]

// Color options
const colorOptions = [
  { value: "black", label: "Black", bgClass: "bg-black" },
  { value: "orange", label: "Orange", bgClass: "bg-orange-500" },
  { value: "blue", label: "Blue", bgClass: "bg-blue-500" },
  { value: "green", label: "Green", bgClass: "bg-green-500" },
  { value: "purple", label: "Purple", bgClass: "bg-purple-500" },
  { value: "gray", label: "Gray", bgClass: "bg-gray-500" },
]

export default function ThemePreferencesPage() {
  const { toast } = useToast()
  const { user, refreshUserProfile } = useAuth()
  const { setTheme } = useTheme()
  const router = useRouter()

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<string>("mode")

  // Theme state
  const [themeMode, setThemeMode] = useState<string>("light")
  const [themeColor, setThemeColor] = useState<string>("orange")
  const [userProfile, setUserProfile] = useState<any>(null)

  // Fetch user profile and theme preferences on component mount
  useEffect(() => {
    if (user?.id) {
      fetchUserThemePreferences()
    } else {
      setIsLoading(false)
    }
  }, [user?.id])

  const fetchUserThemePreferences = async () => {
    setIsLoading(true)
    try {
      const { data: profile, error } = await supabase.from("profiles").select("*").eq("id", user?.id).single()

      if (error) throw error

      if (profile) {
        setUserProfile(profile)
        // Set theme preferences from profile or defaults
        setThemeMode(profile.theme_mode || "light")
        setThemeColor(profile.theme_color || "black") // Default to black

        // Apply the theme
        setTheme(profile.theme_mode || "light")
      }
    } catch (err: any) {
      console.error("Error fetching theme preferences:", err)
      setError(err.message || "Failed to load theme preferences")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!user?.id) return

    setIsSaving(true)
    setError(null)

    try {
      // Update profile with theme preferences
      const { error } = await updateUserProfile(user.id, {
        theme_mode: themeMode,
        theme_color: themeColor,
        updated_at: new Date().toISOString(),
      })

      if (error) {
        throw error
      } else {
        // Apply the theme
        setTheme(themeMode)

        // Refresh the user profile in the auth context
        await refreshUserProfile()

        toast({
          title: "Theme preferences saved",
          description: "Your theme preferences have been updated successfully.",
        })
      }
    } catch (err: any) {
      console.error("Error saving theme preferences:", err)
      setError(err.message || "Failed to save theme preferences")
    } finally {
      setIsSaving(false)
    }
  }

  // Handle theme mode change
  const handleThemeModeChange = (value: string) => {
    setThemeMode(value)
    // Preview the theme
    setTheme(value)
  }

  // Handle theme color change
  const handleThemeColorChange = (value: string) => {
    setThemeColor(value)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading theme preferences...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Theme Preferences</h2>
        <p className="text-muted-foreground">Customize the appearance of your application.</p>
      </div>

      <Separator />

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="mode">Theme Mode</TabsTrigger>
          <TabsTrigger value="color">Color Theme</TabsTrigger>
        </TabsList>

        <TabsContent value="mode" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Theme Mode</CardTitle>
              <CardDescription>Choose between light, dark, or high contrast mode.</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={themeMode}
                onValueChange={handleThemeModeChange}
                className="grid grid-cols-1 md:grid-cols-3 gap-4"
              >
                {themeOptions.map((option) => (
                  <div key={option.value} className="relative">
                    <RadioGroupItem value={option.value} id={`theme-${option.value}`} className="peer sr-only" />
                    <Label
                      htmlFor={`theme-${option.value}`}
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                    >
                      <div className="mb-2 rounded-md border border-border p-1 w-full h-24 flex items-center justify-center">
                        <div
                          className={`w-full h-full rounded ${
                            option.value === "light"
                              ? "bg-white border border-gray-200"
                              : option.value === "dark"
                                ? "bg-gray-900"
                                : "bg-black"
                          }`}
                        >
                          <div
                            className={`h-4 w-16 mt-2 ml-2 rounded ${
                              option.value === "light"
                                ? "bg-gray-200"
                                : option.value === "dark"
                                  ? "bg-gray-700"
                                  : "bg-gray-600"
                            }`}
                          ></div>
                          <div
                            className={`h-4 w-24 mt-2 ml-2 rounded ${
                              option.value === "light"
                                ? "bg-gray-200"
                                : option.value === "dark"
                                  ? "bg-gray-700"
                                  : "bg-gray-600"
                            }`}
                          ></div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between w-full">
                        <span>{option.label}</span>
                        {themeMode === option.value && <Check className="h-4 w-4 text-primary" />}
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="color" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Color Theme</CardTitle>
              <CardDescription>Choose your preferred color theme.</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={themeColor}
                onValueChange={handleThemeColorChange}
                className="grid grid-cols-1 md:grid-cols-3 gap-4"
              >
                {colorOptions.map((option) => (
                  <div key={option.value} className="relative">
                    <RadioGroupItem value={option.value} id={`color-${option.value}`} className="peer sr-only" />
                    <Label
                      htmlFor={`color-${option.value}`}
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                    >
                      <div
                        className={`mb-2 w-full h-24 rounded-md ${option.bgClass} flex items-center justify-center text-white font-bold`}
                      >
                        {option.label}
                      </div>
                      <div className="flex items-center justify-between w-full">
                        <span>{option.label}</span>
                        {themeColor === option.value && <Check className="h-4 w-4 text-primary" />}
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Preferences"
          )}
        </Button>
      </div>
    </div>
  )
}
