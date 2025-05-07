"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { Users, Loader2, AlertCircle, AlertTriangle, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle } from "lucide-react"
import { useAuth } from "@/app/context/auth-context"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { PinInput } from "@/app/auth/components/pin-input"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff } from "lucide-react"
import type { UserProfile } from "@/lib/supabase"
import { AuthErrorType } from "@/lib/supabase"

export function SwitchUserButton() {
  const {
    user,
    isLocked,
    lockScreen,
    unlockWithPin,
    loginWithPin,
    loginAsManager,
    resetPassword,
    userProfiles,
    profilesLoading,
    fetchUserProfiles,
  } = useAuth()
  const router = useRouter()

  // State variables
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("quick-access")
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
  const [showPinInput, setShowPinInput] = useState(false)
  const [showManagerPassword, setShowManagerPassword] = useState(false)
  const [managerPassword, setManagerPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<{ type: AuthErrorType; message: string } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [resetEmail, setResetEmail] = useState("")
  const [resetSent, setResetSent] = useState(false)
  const [pinAttempts, setPinAttempts] = useState(0)
  const [shouldShowButton, setShouldShowButton] = useState(false)
  const [shouldFetchProfiles, setShouldFetchProfiles] = useState(false)

  const MAX_PIN_ATTEMPTS = 3

  // Determine if the button should be shown based on user role
  useEffect(() => {
    if (user && user.role !== "Manager") {
      setShouldShowButton(true)
    } else {
      setShouldShowButton(false)
    }
  }, [user])

  // Determine if profiles should be fetched
  useEffect(() => {
    if (isOpen || isLocked) {
      setShouldFetchProfiles(true)
    } else {
      setShouldFetchProfiles(false)
    }
  }, [isOpen, isLocked])

  // Fetch user profiles when needed
  const memoizedFetchUserProfiles = useCallback(() => {
    if (shouldFetchProfiles) {
      fetchUserProfiles()
    }
  }, [fetchUserProfiles, shouldFetchProfiles])

  useEffect(() => {
    memoizedFetchUserProfiles()
  }, [memoizedFetchUserProfiles])

  // Handle locking the screen
  const handleLockScreen = () => {
    lockScreen()
    setIsOpen(true)
    setActiveTab("quick-access")
  }

  // Handle unlocking with PIN
  const handleUnlockWithPin = async (pin: string) => {
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

      const result = await unlockWithPin(pin)
      if (result.success) {
        setIsOpen(false)
        resetState()
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

  // Handle user selection
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

  // Handle PIN submission
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
        setIsOpen(false)
        resetState()
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
        setIsOpen(false)
        resetState()
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

  // Handle standard login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    // Email validation
    if (!email.includes("@") || !email.includes(".")) {
      setError({
        type: AuthErrorType.INVALID_CREDENTIALS,
        message: "Please enter a valid email address",
      })
      setIsLoading(false)
      return
    }

    // Password validation
    if (password.length < 6) {
      setError({
        type: AuthErrorType.INVALID_CREDENTIALS,
        message: "Password must be at least 6 characters",
      })
      setIsLoading(false)
      return
    }

    try {
      // Mock login - in a real app, you would call your auth service
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setIsOpen(false)
      resetState()
    } catch (err) {
      setError({
        type: AuthErrorType.UNKNOWN_ERROR,
        message: "An unexpected error occurred. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle password reset
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    // Email validation
    if (!resetEmail.includes("@") || !resetEmail.includes(".")) {
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

  // Reset all state
  const resetState = () => {
    setSelectedUser(null)
    setShowPinInput(false)
    setShowManagerPassword(false)
    setError(null)
    setManagerPassword("")
    setEmail("")
    setPassword("")
    setResetEmail("")
    setResetSent(false)
    setPinAttempts(0)
  }

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

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
      <Alert variant={variant as any} className="mb-4">
        {icon}
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    )
  }

  // Group users by role for better organization
  const managerUsers = userProfiles.filter((profile) => profile.role === "Manager")
  const technicianUsers = userProfiles.filter((profile) => profile.role === "Technician")
  const frontDeskUsers = userProfiles.filter((profile) => profile.role === "Front Desk")

  // If the button shouldn't be shown, return null
  if (!shouldShowButton) {
    return null
  }

  return (
    <>
      <Button
        onClick={handleLockScreen}
        className="fixed bottom-6 right-6 rounded-full shadow-lg z-50 h-14 w-14 p-0"
        size="icon"
      >
        <Users className="h-6 w-6" />
        <span className="sr-only">Switch User</span>
      </Button>

      <Dialog
        open={isOpen || isLocked}
        onOpenChange={(open) => {
          // Prevent closing the dialog when locked
          if (isLocked) return
          setIsOpen(open)
          if (!open) resetState()
        }}
      >
        <DialogContent className="sm:max-w-md p-0 overflow-hidden">
          <div className="flex flex-col items-center justify-center pt-8 pb-4">
            <div className="mb-4">
              <div className="h-16 w-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-bold">
                iGarage
                <br />
                360
              </div>
            </div>
            <h1 className="text-2xl font-bold">iGarage360</h1>
            <p className="text-sm text-muted-foreground mt-1">Sign in to access your account</p>
          </div>

          <Tabs defaultValue="quick-access" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="quick-access">Quick Access</TabsTrigger>
              <TabsTrigger value="reset">Reset Password</TabsTrigger>
            </TabsList>

            {/* Login Tab */}
            <TabsContent value="login" className="p-6">
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

            {/* Quick Access Tab */}
            <TabsContent value="quick-access" className="p-6">
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
                          <div
                            key={profile.id}
                            className="border rounded-lg p-4 flex flex-col items-center cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => handleUserSelect(profile)}
                          >
                            <Avatar className="h-16 w-16 mb-2">
                              {profile.avatar_url ? (
                                <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
                              ) : (
                                <AvatarFallback className="bg-blue-500 text-white">
                                  {profile.full_name.charAt(0)}
                                </AvatarFallback>
                              )}
                            </Avatar>
                            <div className="text-center">
                              <div className="font-medium">{profile.full_name}</div>
                              <div className="text-xs text-muted-foreground">{profile.role}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {technicianUsers.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Technicians</h3>
                      <div className="grid grid-cols-2 gap-3">
                        {technicianUsers.map((profile) => (
                          <div
                            key={profile.id}
                            className="border rounded-lg p-4 flex flex-col items-center cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => handleUserSelect(profile)}
                          >
                            <Avatar className="h-16 w-16 mb-2">
                              {profile.avatar_url ? (
                                <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
                              ) : (
                                <AvatarFallback className="bg-emerald-500 text-white">
                                  {profile.full_name.charAt(0)}
                                </AvatarFallback>
                              )}
                            </Avatar>
                            <div className="text-center">
                              <div className="font-medium">{profile.full_name}</div>
                              <div className="text-xs text-muted-foreground">{profile.role}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {frontDeskUsers.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Front Desk</h3>
                      <div className="grid grid-cols-2 gap-3">
                        {frontDeskUsers.map((profile) => (
                          <div
                            key={profile.id}
                            className="border rounded-lg p-4 flex flex-col items-center cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => handleUserSelect(profile)}
                          >
                            <Avatar className="h-16 w-16 mb-2">
                              {profile.avatar_url ? (
                                <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
                              ) : (
                                <AvatarFallback className="bg-amber-500 text-white">
                                  {profile.full_name.charAt(0)}
                                </AvatarFallback>
                              )}
                            </Avatar>
                            <div className="text-center">
                              <div className="font-medium">{profile.full_name}</div>
                              <div className="text-xs text-muted-foreground">{profile.role}</div>
                            </div>
                          </div>
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
                          <AvatarImage src={selectedUser.avatar_url} alt={selectedUser.full_name} />
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
                          <AvatarImage src={selectedUser.avatar_url} alt={selectedUser.full_name} />
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

            {/* Reset Password Tab */}
            <TabsContent value="reset" className="p-6">
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

          <div className="px-6 pb-6 pt-2 text-center text-xs text-muted-foreground">
            By signing in, you agree to our{" "}
            <Link href="#" className="text-primary hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="#" className="text-primary hover:underline">
              Privacy Policy
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
