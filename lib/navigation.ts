import {
  BarChartIcon,
  Bell,
  Briefcase,
  Building2,
  Calendar,
  Car,
  CreditCard,
  DollarSign,
  FileSpreadsheet,
  FileText,
  Globe,
  HelpCircle,
  LayoutDashboard,
  Link2,
  Mail,
  Palette,
  PenToolIcon,
  Percent,
  ScrollText,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Stethoscope,
  Store,
  Target,
  LayoutTemplateIcon,
  Clock,
  Truck,
  User,
  Users,
  Wrench,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

export interface NavItem {
  title: string
  href: string
  icon: LucideIcon
  color: string
  submenu?: NavItem[]
}

// Define navigation items for Manager role
export const managerNavigation: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    color: "text-blue-500",
  },
  {
    title: "Garage",
    href: "/garage",
    icon: Truck,
    color: "text-indigo-500",
    submenu: [
      { title: "Customers", href: "/garage/customers", icon: Users, color: "text-indigo-300" },
      { title: "Vehicles", href: "/garage/vehicles", icon: Car, color: "text-blue-400" },
      { title: "Diagnostics", href: "/garage/diagnostics", icon: Stethoscope, color: "text-blue-500" },
      { title: "Repairs", href: "/garage/repairs", icon: Wrench, color: "text-blue-600" },
      { title: "Services", href: "/garage/services", icon: PenToolIcon, color: "text-blue-700" },
      { title: "Work Orders", href: "/garage/work-orders", icon: ScrollText, color: "text-blue-800" },
    ],
  },
  {
    title: "Calendar",
    href: "/calendar",
    icon: Calendar,
    color: "text-cyan-500",
  },
  {
    title: "Financial",
    href: "/financial",
    icon: DollarSign,
    color: "text-emerald-500",
    submenu: [
      { title: "Quotation", href: "/financial/quotation", icon: FileText, color: "text-emerald-400" },
      { title: "Invoices", href: "/financial/invoices", icon: FileSpreadsheet, color: "text-emerald-600" },
    ],
  },
  {
    title: "Service Management",
    href: "/service-management",
    icon: PenToolIcon,
    color: "text-violet-500",
    submenu: [
      { title: "Service Library", href: "/service-management/library", icon: Briefcase, color: "text-violet-500" },
    ],
  },
  {
    title: "Inventory & Spare Parts",
    href: "/inventory",
    icon: ShoppingBag,
    color: "text-amber-500",
    submenu: [
      { title: "Stock Tracking", href: "/inventory/stock", icon: BarChartIcon, color: "text-amber-400" },
      { title: "Suppliers", href: "/inventory/suppliers", icon: Store, color: "text-amber-600" },
      { title: "Orders", href: "/inventory/orders", icon: ShoppingBag, color: "text-amber-500" },
    ],
  },
  {
    title: "Staff Management",
    href: "/staff",
    icon: Users,
    color: "text-purple-500",
    submenu: [
      { title: "Staff Profiles", href: "/staff/profiles", icon: User, color: "text-purple-400" },
      { title: "Vacation and Leave", href: "/staff/leave", icon: Calendar, color: "text-purple-600" },
    ],
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
    color: "text-slate-500",
    submenu: [
      { title: "Profile", href: "/settings/profile", icon: User, color: "text-slate-500" },
      // Removed "User Profiles" as requested
      { title: "Theme", href: "/settings/theme", icon: Palette, color: "text-pink-500" },
      { title: "Language and Region", href: "/settings/language", icon: Globe, color: "text-teal-500" },
      { title: "Notifications", href: "/settings/notifications", icon: Bell, color: "text-yellow-500" },
      {
        title: "Business Information",
        href: "/settings/business-information",
        icon: Building2,
        color: "text-slate-600",
      },
      { title: "Labor Rates", href: "/settings/labor-rates", icon: Percent, color: "text-emerald-500" },
      { title: "Templates", href: "/settings/templates", icon: LayoutTemplateIcon, color: "text-indigo-400" },
      { title: "Working Hours", href: "/settings/working-hours", icon: Clock, color: "text-cyan-500" },
      { title: "Holidays", href: "/settings/holidays", icon: Calendar, color: "text-purple-400" },
      { title: "KPI Management", href: "/settings/kpi", icon: Target, color: "text-red-500" },
      { title: "Makes and Models Management", href: "/settings/makes-models", icon: Car, color: "text-blue-500" },
      { title: "Billing & Subscription", href: "/settings/billing", icon: CreditCard, color: "text-emerald-600" },
      { title: "Specification Management", href: "/settings/specifications", icon: Settings, color: "text-slate-500" },
      { title: "Security", href: "/settings/security", icon: ShieldCheck, color: "text-red-600" },
      { title: "Email Integration", href: "/settings/email", icon: Mail, color: "text-blue-400" },
      { title: "Channels Integration", href: "/settings/channels", icon: Link2, color: "text-violet-500" },
    ],
  },
  {
    title: "Help & Support",
    href: "/help",
    icon: HelpCircle,
    color: "text-slate-500",
  },
]

// Updated technicianNavigation with Dashboard
export const technicianNavigation: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    color: "text-blue-500",
  },
  {
    title: "Garage",
    href: "/garage",
    icon: Truck,
    color: "text-indigo-500",
    submenu: [
      { title: "Customers", href: "/garage/customers", icon: Users, color: "text-indigo-300" },
      { title: "Vehicles", href: "/garage/vehicles", icon: Car, color: "text-blue-400" },
      { title: "Diagnostics", href: "/garage/diagnostics", icon: Stethoscope, color: "text-blue-500" },
      { title: "Repairs", href: "/garage/repairs", icon: Wrench, color: "text-blue-600" },
      { title: "Services", href: "/garage/services", icon: PenToolIcon, color: "text-blue-700" },
      { title: "Work Orders", href: "/garage/work-orders", icon: ScrollText, color: "text-blue-800" },
    ],
  },
  {
    title: "Calendar",
    href: "/calendar",
    icon: Calendar,
    color: "text-cyan-500",
  },
  {
    title: "Inventory & Spare Parts",
    href: "/inventory",
    icon: ShoppingBag,
    color: "text-amber-500",
    submenu: [
      { title: "Stock Tracking", href: "/inventory/stock", icon: BarChartIcon, color: "text-amber-400" },
      { title: "Orders", href: "/inventory/orders", icon: ShoppingBag, color: "text-amber-500" },
    ],
  },
  {
    title: "Help & Support",
    href: "/help",
    icon: HelpCircle,
    color: "text-slate-500",
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
    color: "text-slate-500",
    submenu: [
      { title: "Profile", href: "/settings/profile", icon: User, color: "text-slate-500" },
      { title: "Theme", href: "/settings/theme", icon: Palette, color: "text-pink-500" },
      { title: "Language and Region", href: "/settings/language", icon: Globe, color: "text-teal-500" },
      { title: "Notifications", href: "/settings/notifications", icon: Bell, color: "text-yellow-500" },
    ],
  },
]

// Updated frontDeskNavigation with Dashboard
export const frontDeskNavigation: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    color: "text-blue-500",
  },
  {
    title: "Garage",
    href: "/garage",
    icon: Truck,
    color: "text-indigo-500",
    submenu: [
      { title: "Customers", href: "/garage/customers", icon: Users, color: "text-indigo-300" },
      { title: "Vehicles", href: "/garage/vehicles", icon: Car, color: "text-blue-400" },
      { title: "Diagnostics", href: "/garage/diagnostics", icon: Stethoscope, color: "text-blue-500" },
      { title: "Repairs", href: "/garage/repairs", icon: Wrench, color: "text-blue-600" },
      { title: "Services", href: "/garage/services", icon: PenToolIcon, color: "text-blue-700" },
      { title: "Work Orders", href: "/garage/work-orders", icon: ScrollText, color: "text-blue-800" },
    ],
  },
  {
    title: "Calendar",
    href: "/calendar",
    icon: Calendar,
    color: "text-cyan-500",
  },
  {
    title: "Financial",
    href: "/financial",
    icon: DollarSign,
    color: "text-emerald-500",
    submenu: [
      { title: "Quotation", href: "/financial/quotation", icon: FileText, color: "text-emerald-400" },
      { title: "Invoices", href: "/financial/invoices", icon: FileSpreadsheet, color: "text-emerald-600" },
    ],
  },
  {
    title: "Service Management",
    href: "/service-management",
    icon: PenToolIcon,
    color: "text-violet-500",
    submenu: [
      { title: "Service Library", href: "/service-management/library", icon: Briefcase, color: "text-violet-500" },
    ],
  },
  {
    title: "Inventory & Spare Parts",
    href: "/inventory",
    icon: ShoppingBag,
    color: "text-amber-500",
    submenu: [
      { title: "Stock Tracking", href: "/inventory/stock", icon: BarChartIcon, color: "text-amber-400" },
      { title: "Suppliers", href: "/inventory/suppliers", icon: Store, color: "text-amber-600" },
      { title: "Orders", href: "/inventory/orders", icon: ShoppingBag, color: "text-amber-500" },
    ],
  },
  {
    title: "Staff Management",
    href: "/staff",
    icon: Users,
    color: "text-purple-500",
    submenu: [
      { title: "Staff Profiles", href: "/staff/profiles", icon: User, color: "text-purple-400" },
      { title: "Vacation and Leave", href: "/staff/leave", icon: Calendar, color: "text-purple-600" },
    ],
  },
  {
    title: "Help & Support",
    href: "/help",
    icon: HelpCircle,
    color: "text-slate-500",
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
    color: "text-slate-500",
    submenu: [
      { title: "Profile", href: "/settings/profile", icon: User, color: "text-slate-500" },
      { title: "Theme", href: "/settings/theme", icon: Palette, color: "text-pink-500" },
      { title: "Language and Region", href: "/settings/language", icon: Globe, color: "text-teal-500" },
      { title: "Notifications", href: "/settings/notifications", icon: Bell, color: "text-yellow-500" },
      { title: "Labor Rates", href: "/settings/labor-rates", icon: Percent, color: "text-emerald-500" },
      { title: "Working Hours", href: "/settings/working-hours", icon: Clock, color: "text-cyan-500" },
      { title: "Holidays", href: "/settings/holidays", icon: Calendar, color: "text-purple-400" },
    ],
  },
]

// Function to get navigation items based on user role
export function getNavigationByRole(role: string | undefined): NavItem[] {
  switch (role) {
    case "Manager":
      return managerNavigation
    case "Front Desk":
      return frontDeskNavigation
    case "Technician":
      return technicianNavigation
    default:
      // Default to front desk navigation if role is unknown
      return frontDeskNavigation
  }
}
