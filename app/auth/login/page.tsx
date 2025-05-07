"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Eye, EyeOff, AlertCircle, CheckCircle, Loader2, AlertTriangle, Info } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { UserAvatar } from "@/app/auth/components/user-avatar"
import { PinInput } from "@/app/auth/components/pin-input"
import { useAuth } from "@/app/context/auth-context"
import { useBusiness } from "@/app/context/business-context"
import { Logo } from "@/app/components/logo"
import type { UserProfile } from "@/lib/supabase"
import { AuthErrorType } from "@/lib/supabase"
import { isSupabaseConfigured } from "@/lib/env"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const {
    user,
    isLoading: authLoading,
    login,
    loginWithPin,
    loginAsManager,
    resetPassword,
    userProfiles,
    profilesLoading,
    fetchUserProfiles,
  } = useAuth()
  const { businessInfo, isLoading: businessLoading } = useBusiness()

  // Check if Supabase is configured
  const supabaseConfigured = isSupabaseConfigured()

  // Add state for Supabase configuration warning
  const [showConfigWarning, setShowConfigWarning] = useState(!supabaseConfigured)

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [resetEmail, setResetEmail] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<{ type: AuthErrorType; message: string } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
  const [showPinInput, setShowPinInput] = useState(false)
  const [showManagerPassword, setShowManagerPassword] = useState(false)
  const [managerPassword, setManagerPassword] = useState("")
  const [pinAttempts, setPinAttempts] = useState(0)
  const MAX_PIN_ATTEMPTS = 3

  // Get the tab from URL query params or default to "standard"
  const initialTab = searchParams.get("tab") || "standard"
  const [activeTab, setActiveTab] = useState(initialTab)

  // Get business name from context
  const businessName = businessInfo?.business_name || ""

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push("/")
    }
  }, [user, router])

  // Fetch user profiles when the component mounts
  useEffect(() => {
    fetchUserProfiles()
  }, [fetchUserProfiles])

  // Email validation function
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Password validation function
  const validatePassword = (password: string): boolean => {
    return password.length >= 6
  }

  // Standard email/password login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    // Email validation
    if (!validateEmail(email)) {
      setError({
        type: AuthErrorType.INVALID_CREDENTIALS,
        message: "Please enter a valid email address",
      })
      setIsLoading(false)
      return
    }

    // Password validation
    if (!validatePassword(password)) {
      setError({
        type: AuthErrorType.INVALID_CREDENTIALS,
        message: "Password must be at least 6 characters",
      })
      setIsLoading(false)
      return
    }

    try {
      const result = await login(email, password)
      if (result.success) {
        router.push("/")
      } else if (result.error) {
        setError({
          type: result.error.type,
          message: result.error.message,
        })
      }
    } catch (err) {
      setError({
        type: AuthErrorType.UNKNOWN_ERROR,
        message: "An unexpected error occurred. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Password reset request
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    // Email validation
    if (!validateEmail(resetEmail)) {
      setError({
        type: AuthErrorType.INVALID_CREDENTIALS,
        message: "Please enter a valid email address",
      })
      setIsLoading(false)
      return
    }

    try {
      const result = await resetPassword(resetEmail)
      if (result.success) {
        setResetSent(true)
      } else if (result.error) {
        setError({
          type: result.error.type,
          message: result.error.message,
        })
      }
    } catch (err) {
      setError({
        type: AuthErrorType.UNKNOWN_ERROR,
        message: "Something went wrong. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle user selection for quick access
  const handleUserSelect = (user: UserProfile) => {
    setSelectedUser(user)
    setError(null)
    setPinAttempts(0)

    if (user.role === "Manager") {
      setShowManagerPassword(true)
      setShowPinInput(false)
    } else {
      setShowPinInput(true)
      setShowManagerPassword(false)
    }
  }

  // Handle PIN submission for Technician and Front Desk roles
  const handlePinSubmit = async (pin: string) => {
    if (!selectedUser) return

    setError(null)
    setIsLoading(true)

    try {
      // Increment PIN attempts
      const newAttempts = pinAttempts + 1
      setPinAttempts(newAttempts)

      // Check if max attempts reached
      if (newAttempts >= MAX_PIN_ATTEMPTS) {
        setError({
          type: AuthErrorType.INVALID_PIN,
          message: `Maximum PIN attempts reached (${MAX_PIN_ATTEMPTS}). Please try again later or use standard login.`,
        })
        setIsLoading(false)
        // Reset the PIN input and go back to user selection after a delay
        setTimeout(() => {
          setSelectedUser(null)
          setShowPinInput(false)
          setPinAttempts(0)
        }, 3000)
        return
      }

      const result = await loginWithPin(selectedUser.id, pin)
      if (result.success) {
        // Successful login - redirect to the main application
        router.push("/")
      } else if (result.error) {
        setError({
          type: result.error.type,
          message:
            result.error.message +
            (newAttempts < MAX_PIN_ATTEMPTS ? ` (Attempt ${newAttempts}/${MAX_PIN_ATTEMPTS})` : ""),
        })
      }
    } catch (err) {
      setError({
        type: AuthErrorType.UNKNOWN_ERROR,
        message: "An unexpected error occurred. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle manager password submission
  const handleManagerPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return

    setError(null)
    setIsLoading(true)

    try {
      const result = await loginAsManager(selectedUser.id, managerPassword)
      if (result.success) {
        router.push("/")
      } else if (result.error) {
        setError({
          type: result.error.type,
          message: result.error.message,
        })
      }
    } catch (err) {
      setError({
        type: AuthErrorType.UNKNOWN_ERROR,
        message: "An unexpected error occurred. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  // If still checking auth state, show loading
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading authentication...</p>
        </div>
      </div>
    )
  }

  // Group users by role for better organization
  const managerUsers = userProfiles.filter((profile) => profile.role === "Manager")
  const technicianUsers = userProfiles.filter((profile) => profile.role === "Technician")
  const frontDeskUsers = userProfiles.filter((profile) => profile.role === "Front Desk")

  // Render error alert with appropriate styling based on error type
  const renderErrorAlert = () => {
    if (!error) return null

    let icon = <AlertCircle className="h-4 w-4" />
    let variant = "destructive"

    switch (error.type) {
      case AuthErrorType.INVALID_PIN:
      case AuthErrorType.INVALID_CREDENTIALS:
        icon = <AlertCircle className="h-4 w-4" />
        variant = "destructive"
        break
      case AuthErrorType.PIN_NOT_FOUND:
      case AuthErrorType.USER_NOT_FOUND:
        icon = <AlertTriangle className="h-4 w-4" />
        variant = "warning"
        break
      case AuthErrorType.NETWORK_ERROR:
        icon = <Info className="h-4 w-4" />
        variant = "default"
        break
      default:
        icon = <AlertCircle className="h-4 w-4" />
        variant = "destructive"
    }

    return (
      <Alert variant={variant as any}>
        {icon}
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    )
  }

  // Add this after the renderErrorAlert function to show a warning when Supabase is not configured
  const renderSupabaseConfigWarning = () => {
    if (!showConfigWarning) return null

    return (
      <Alert variant="warning" className="mb-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Supabase environment variables are not configured. Authentication features will not work. Please set
          NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.
          <Button variant="link" className="p-0 h-auto text-xs underline" onClick={() => setShowConfigWarning(false)}>
            Dismiss
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <div className="flex flex-col items-center justify-center">
            <div className="mb-2">
              <Logo size="lg" showText={false} linkEnabled={false} />
            </div>
            {businessLoading ? (
              <div className="h-6 w-48 animate-pulse bg-muted rounded-md"></div>
            ) : businessName ? (
              <h2 className="text-xl font-semibold">{businessName}</h2>
            ) : null}
          </div>
          <CardDescription className="text-base">Sign in to access your account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {renderSupabaseConfigWarning()}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="standard">Login</TabsTrigger>
              <TabsTrigger value="quick-access">Quick Access</TabsTrigger>
              <TabsTrigger value="reset">Reset Password</TabsTrigger>
            </TabsList>

            {/* Standard Login */}
            <TabsContent value="standard" className="space-y-4 pt-4">
              {renderErrorAlert()}

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={togglePasswordVisibility}
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
                    </Button>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>
            </TabsContent>

            {/* Quick Access */}
            <TabsContent value="quick-access" className="space-y-4 pt-4">
              {renderErrorAlert()}

              {profilesLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-muted-foreground">Loading user profiles...</p>
                </div>
              ) : !selectedUser ? (
                <div className="space-y-6">
                  {managerUsers.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Managers</h3>
                      <div className="grid grid-cols-2 gap-3">
                        {managerUsers.map((profile) => (
                          <UserAvatar
                            key={profile.id}
                            name={profile.full_name}
                            role={profile.role}
                            color="bg-blue-500"
                            onClick={() => handleUserSelect(profile)}
                            image={profile.image}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {technicianUsers.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Technicians</h3>
                      <div className="grid grid-cols-2 gap-3">
                        {technicianUsers.map((profile) => (
                          <UserAvatar
                            key={profile.id}
                            name={profile.full_name}
                            role={profile.role}
                            color="bg-emerald-500"
                            onClick={() => handleUserSelect(profile)}
                            image={profile.image}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {frontDeskUsers.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Front Desk</h3>
                      <div className="grid grid-cols-2 gap-3">
                        {frontDeskUsers.map((profile) => (
                          <UserAvatar
                            key={profile.id}
                            name={profile.full_name}
                            role={profile.role}
                            color="bg-amber-500"
                            onClick={() => handleUserSelect(profile)}
                            image={profile.image}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {userProfiles.length === 0 && (
                    <Alert>
                      <AlertDescription>
                        No user profiles found. Please create profiles in Supabase or use standard login.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ) : showPinInput ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedUser(null)
                        setShowPinInput(false)
                        setError(null)
                        setPinAttempts(0)
                      }}
                      disabled={isLoading}
                    >
                      Back
                    </Button>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        {selectedUser.avatar_url ? (
                          <AvatarImage
                            src={selectedUser.avatar_url || "/placeholder.svg"}
                            alt={selectedUser.full_name}
                          />
                        ) : (
                          <AvatarFallback>{selectedUser.full_name.charAt(0)}</AvatarFallback>
                        )}
                      </Avatar>
                      <div className="text-sm font-medium">{selectedUser.full_name}</div>
                    </div>
                  </div>
                  <div className="text-center">
                    <h3 className="text-lg font-medium">Enter your 4-digit PIN</h3>
                    <p className="text-sm text-muted-foreground">Please enter your PIN to continue</p>
                  </div>
                  <PinInput length={4} onComplete={handlePinSubmit} />
                  {isLoading && (
                    <div className="text-center mt-4">
                      <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
                      <p className="text-sm text-muted-foreground mt-2">Verifying...</p>
                    </div>
                  )}
                </div>
              ) : showManagerPassword ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedUser(null)
                        setShowManagerPassword(false)
                        setError(null)
                      }}
                      disabled={isLoading}
                    >
                      Back
                    </Button>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        {selectedUser.avatar_url ? (
                          <AvatarImage
                            src={selectedUser.avatar_url || "/placeholder.svg"}
                            alt={selectedUser.full_name}
                          />
                        ) : (
                          <AvatarFallback>{selectedUser.full_name.charAt(0)}</AvatarFallback>
                        )}
                      </Avatar>
                      <div className="text-sm font-medium">{selectedUser.full_name}</div>
                    </div>
                  </div>
                  <form onSubmit={handleManagerPasswordSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="manager-password">Manager Password</Label>
                      <div className="relative">
                        <Input
                          id="manager-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={managerPassword}
                          onChange={(e) => setManagerPassword(e.target.value)}
                          required
                          disabled={isLoading}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={togglePasswordVisibility}
                          disabled={isLoading}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
                        </Button>
                      </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        "Verify Password"
                      )}
                    </Button>
                  </form>
                </div>
              ) : null}
            </TabsContent>

            {/* Password Reset */}
            <TabsContent value="reset" className="space-y-4 pt-4">
              {renderErrorAlert()}

              {resetSent ? (
                <Alert className="border-green-500 bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-300 dark:border-green-800">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Password reset link sent! Please check your email inbox (and spam folder) for instructions to reset
                    your password.
                  </AlertDescription>
                </Alert>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-email">Email</Label>
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="name@example.com"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      "Send Reset Link"
                    )}
                  </Button>
                </form>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-xs text-muted-foreground">
            By signing in, you agree to our{" "}
            <Link href="#" className="text-primary hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="#" className="text-primary hover:underline">
              Privacy Policy
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
