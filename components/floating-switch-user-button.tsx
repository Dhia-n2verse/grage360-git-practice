"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Users, Loader2, AlertCircle, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/app/context/auth-context"
import { motion } from "framer-motion"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { PinInput } from "@/app/auth/components/pin-input"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AuthErrorType } from "@/lib/supabase"
import { getInitials } from "@/lib/utils"
import type { UserProfile } from "@/lib/supabase"

export function FloatingSwitchUserButton() {
  const {
    user,
    isLocked,
    lockScreen,
    unlockWithPin,
    login,
    loginWithPin,
    loginAsManager,
    userProfiles,
    fetchUserProfiles,
  } = useAuth()

  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("quick-access")
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<{ type: AuthErrorType; message: string } | null>(null)
  const [pinAttempts, setPinAttempts] = useState(0)
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
  const [showPinInput, setShowPinInput] = useState(false)
  const [showManagerPassword, setShowManagerPassword] = useState(false)
  const [managerPassword, setManagerPassword] = useState("")

  const MAX_PIN_ATTEMPTS = 3

  // Only show for Front Desk and Technician roles
  const shouldShowButton = user?.role === "Front Desk" || user?.role === "Technician"

  // Handle locking the screen and opening the user selection
  const handleLockScreen = () => {
    lockScreen()
    setIsOpen(true)
    setActiveTab("quick-access")
    setError(null)
    setPinAttempts(0)
    setEmail(user?.email || "")
    setPassword("")
    fetchUserProfiles()
  }

  // Handle unlocking with PIN (for current user)
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
          message: `Maximum PIN attempts reached (${MAX_PIN_ATTEMPTS}). Please use standard login.`,
        })
        setIsLoading(false)
        setActiveTab("login")
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

  // Handle standard login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const result = await login(email, password)
      if (result.success) {
        setIsOpen(false)
        resetState()
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

  // Handle user selection
  const handleUserSelect = (profile: UserProfile) => {
    setSelectedUser(profile)
    setError(null)
    setPinAttempts(0)

    if (profile.role === "Manager") {
      setShowManagerPassword(true)
      setShowPinInput(false)
    } else {
      setShowPinInput(true)
      setShowManagerPassword(false)
    }
  }

  // Handle PIN submission for switching users
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

  // Reset all state
  const resetState = () => {
    setError(null)
    setEmail("")
    setPassword("")
    setPinAttempts(0)
    setShowPassword(false)
    setSelectedUser(null)
    setShowPinInput(false)
    setShowManagerPassword(false)
    setManagerPassword("")
  }

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  // Handle dialog close
  const handleDialogOpenChange = (open: boolean) => {
    // If the screen is locked, don't allow closing the dialog
    if (isLocked && !open) return

    setIsOpen(open)
    if (!open) {
      resetState()
    }
  }

  // Force open dialog when screen is locked
  useEffect(() => {
    if (isLocked) {
      setIsOpen(true)
    }
  }, [isLocked])

  // Group users by role for better organization
  const managerUsers = userProfiles.filter((profile) => profile.role === "Manager")
  const technicianUsers = userProfiles.filter((profile) => profile.role === "Technician")
  const frontDeskUsers = userProfiles.filter((profile) => profile.role === "Front Desk")

  // Get role-specific background color
  const getRoleColor = (role: string) => {
    switch (role) {
      case "Manager":
        return "bg-blue-500"
      case "Technician":
        return "bg-emerald-500"
      case "Front Desk":
        return "bg-amber-500"
      default:
        return "bg-gray-500"
    }
  }

  // Add responsive styles for the dialog content
  useEffect(() => {
    // Function to adjust dialog position based on screen size
    const adjustDialogPosition = () => {
      const dialogContent = document.querySelector('[data-dialog-content="true"]')
      if (dialogContent) {
        const viewportHeight = window.innerHeight
        const dialogHeight = dialogContent.getBoundingClientRect().height

        // If dialog is taller than viewport, adjust its position and max-height
        if (dialogHeight > viewportHeight * 0.9) {
          dialogContent.classList.add("dialog-overflow")
        } else {
          dialogContent.classList.remove("dialog-overflow")
        }
      }
    }

    // Add event listener for resize
    if (isOpen || isLocked) {
      window.addEventListener("resize", adjustDialogPosition)
      // Initial adjustment
      setTimeout(adjustDialogPosition, 100)
    }

    // Cleanup
    return () => {
      window.removeEventListener("resize", adjustDialogPosition)
    }
  }, [isOpen, isLocked])

  if (!shouldShowButton) {
    return null
  }

  return (
    <>
      <motion.div
        className="fixed bottom-6 right-6 z-50"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <Button onClick={handleLockScreen} className="rounded-full shadow-lg h-14 w-14 p-0" size="icon">
          <Users className="h-6 w-6" />
          <span className="sr-only">Switch User</span>
        </Button>
      </motion.div>

      <Dialog open={isOpen || isLocked} onOpenChange={handleDialogOpenChange}>
        <DialogContent
          className="sm:max-w-md p-0 max-h-[90vh] overflow-y-auto"
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
          data-dialog-content="true"
        >
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
            <TabsList className="grid w-full grid-cols-3 sticky top-0 z-10 bg-background">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="quick-access">Quick Access</TabsTrigger>
              <TabsTrigger value="reset">Reset Password</TabsTrigger>
            </TabsList>

            {/* Login Tab */}
            <TabsContent value="login" className="p-6">
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error.message}</AlertDescription>
                </Alert>
              )}

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
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error.message}</AlertDescription>
                </Alert>
              )}

              {isLoading && !selectedUser ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-muted-foreground">Loading user profiles...</p>
                </div>
              ) : !selectedUser ? (
                <div className="space-y-6">
                  {managerUsers.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Managers</h3>
                      <div className="grid grid-cols-2 gap-3 max-h-[30vh] overflow-y-auto pr-1">
                        {managerUsers.map((profile) => (
                          <div
                            key={profile.id}
                            className="border rounded-lg p-4 flex flex-col items-center cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => handleUserSelect(profile)}
                          >
                            <Avatar className="h-16 w-16 mb-2">
                              {profile.image || profile.avatar_url ? (
                                <AvatarImage
                                  src={profile.image || profile.avatar_url || "/placeholder.svg"}
                                  alt={profile.full_name}
                                />
                              ) : (
                                <AvatarFallback className={getRoleColor(profile.role)}>
                                  {getInitials(profile.full_name)}
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
                      <div className="grid grid-cols-2 gap-3 max-h-[30vh] overflow-y-auto pr-1">
                        {technicianUsers.map((profile) => (
                          <div
                            key={profile.id}
                            className="border rounded-lg p-4 flex flex-col items-center cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => handleUserSelect(profile)}
                          >
                            <Avatar className="h-16 w-16 mb-2">
                              {profile.image || profile.avatar_url ? (
                                <AvatarImage
                                  src={profile.image || profile.avatar_url || "/placeholder.svg"}
                                  alt={profile.full_name}
                                />
                              ) : (
                                <AvatarFallback className={getRoleColor(profile.role)}>
                                  {getInitials(profile.full_name)}
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
                      <div className="grid grid-cols-2 gap-3 max-h-[30vh] overflow-y-auto pr-1">
                        {frontDeskUsers.map((profile) => (
                          <div
                            key={profile.id}
                            className="border rounded-lg p-4 flex flex-col items-center cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => handleUserSelect(profile)}
                          >
                            <Avatar className="h-16 w-16 mb-2">
                              {profile.image || profile.avatar_url ? (
                                <AvatarImage
                                  src={profile.image || profile.avatar_url || "/placeholder.svg"}
                                  alt={profile.full_name}
                                />
                              ) : (
                                <AvatarFallback className={getRoleColor(profile.role)}>
                                  {getInitials(profile.full_name)}
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
                        {selectedUser.image || selectedUser.avatar_url ? (
                          <AvatarImage
                            src={selectedUser.image || selectedUser.avatar_url || "/placeholder.svg"}
                            alt={selectedUser.full_name}
                          />
                        ) : (
                          <AvatarFallback>{getInitials(selectedUser.full_name)}</AvatarFallback>
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
                        {selectedUser.image || selectedUser.avatar_url ? (
                          <AvatarImage
                            src={selectedUser.image || selectedUser.avatar_url || "/placeholder.svg"}
                            alt={selectedUser.full_name}
                          />
                        ) : (
                          <AvatarFallback>{getInitials(selectedUser.full_name)}</AvatarFallback>
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
              <div className="text-center py-4">
                <p>To reset your password, please contact your system administrator.</p>
              </div>
            </TabsContent>
          </Tabs>

          <div className="px-6 pb-6 pt-2 text-center text-xs text-muted-foreground">
            By signing in, you agree to our{" "}
            <a href="#" className="text-primary hover:underline">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="text-primary hover:underline">
              Privacy Policy
            </a>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add a backdrop blur when the dialog is open */}
      {(isOpen || isLocked) && <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40" />}
    </>
  )
}
