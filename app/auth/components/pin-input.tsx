"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"

interface PinInputProps {
  length: number
  onComplete: (pin: string) => void
}

export function PinInput({ length, onComplete }: PinInputProps) {
  const [pin, setPin] = useState<string[]>(Array(length).fill(""))
  const [error, setError] = useState<boolean>(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Initialize refs array
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, length)
  }, [length])

  // Reset error state when pin changes
  useEffect(() => {
    if (error && pin.some((digit) => digit !== "")) {
      setError(false)
    }
  }, [pin, error])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value

    // Only allow numbers
    if (!/^\d*$/.test(value)) return

    // Take only the last character if multiple are pasted
    const digit = value.slice(-1)

    // Update the pin array
    const newPin = [...pin]
    newPin[index] = digit
    setPin(newPin)

    // If a digit was entered and we're not at the last input, focus the next one
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }

    // Check if the PIN is complete
    const completedPin = newPin.every((d) => d !== "") && newPin.join("").length === length
    if (completedPin) {
      // Format the PIN as a string and call onComplete
      const pinString = newPin.join("")
      console.log(`PIN completed: ${pinString.length} digits`)
      onComplete(pinString)

      // Clear the PIN after submission for security
      setTimeout(() => {
        setPin(Array(length).fill(""))
        inputRefs.current[0]?.focus()
      }, 500)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    // If backspace is pressed and the current input is empty, focus the previous input
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }

    // If left arrow is pressed, focus the previous input
    if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }

    // If right arrow is pressed, focus the next input
    if (e.key === "ArrowRight" && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>, index: number) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData("text/plain").trim()

    // Only allow numbers
    if (!/^\d*$/.test(pastedData)) return

    // Fill the pin array with the pasted digits
    const digits = pastedData.split("").slice(0, length - index)
    const newPin = [...pin]

    digits.forEach((digit, i) => {
      if (index + i < length) {
        newPin[index + i] = digit
      }
    })

    setPin(newPin)

    // Focus the appropriate input after pasting
    const nextIndex = Math.min(index + digits.length, length - 1)
    inputRefs.current[nextIndex]?.focus()

    // Check if the PIN is complete
    const completedPin = newPin.every((d) => d !== "") && newPin.join("").length === length
    if (completedPin) {
      // Format the PIN as a string and call onComplete
      const pinString = newPin.join("")
      console.log(`PIN completed after paste: ${pinString.length} digits`)
      onComplete(pinString)

      // Clear the PIN after submission for security
      setTimeout(() => {
        setPin(Array(length).fill(""))
        inputRefs.current[0]?.focus()
      }, 500)
    }
  }

  // Set error state (can be called from parent)
  const setErrorState = (hasError: boolean) => {
    setError(hasError)
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="flex justify-center gap-2">
        {Array.from({ length }).map((_, index) => (
          <Input
            key={index}
            ref={(el) => (inputRefs.current[index] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={pin[index]}
            onChange={(e) => handleChange(e, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            onPaste={(e) => handlePaste(e, index)}
            className={`h-14 w-14 text-center text-xl ${error ? "border-red-500 focus:border-red-500 animate-shake" : ""}`}
            autoFocus={index === 0}
          />
        ))}
      </div>
      {error && <p className="text-sm text-red-500">Invalid PIN. Please try again.</p>}
    </div>
  )
}
