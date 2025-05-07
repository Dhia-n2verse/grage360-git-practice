import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Extracts initials from a name string
 * @param name The full name to extract initials from
 * @param maxLength Maximum number of characters to return (default: 2)
 * @returns The initials (e.g., "John Doe" returns "JD")
 */
export function getInitials(name: string, maxLength = 2): string {
  if (!name) return ""

  return name
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, maxLength)
}

/**
 * Returns a Tailwind CSS class name for a given role
 * @param role The role to get the color for
 * @returns A Tailwind CSS class name (e.g., "bg-red-500")
 */
export function getRoleColor(role: string): string {
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

/**
 * Formats a first name and last name into a full name
 * @param firstName The first name
 * @param lastName The last name
 * @returns A formatted full name (e.g., "John Doe")
 */
export function formatFullName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`.trim()
}
