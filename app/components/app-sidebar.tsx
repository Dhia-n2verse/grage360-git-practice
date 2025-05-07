"use client"

import * as React from "react"
import Link from "next/link"
import {
  Bell,
  Briefcase,
  Building2,
  Calendar,
  Car,
  BarChartIcon as ChartBar,
  ChevronDown,
  ChevronRight,
  Clock,
  CreditCard,
  DollarSign,
  FileText,
  FileSpreadsheet,
  Globe,
  HelpCircle,
  LayoutDashboard,
  Link2,
  Mail,
  Palette,
  PenToolIcon,
  ScrollText,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Stethoscope,
  Store,
  Target,
  LayoutTemplateIcon as Template,
  Truck,
  User,
  Users,
  Wrench,
  PieChart,
  Percent,
  LogOut,
} from "lucide-react"

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { useAuth } from "@/app/context/auth-context"
import { Logo } from "@/app/components/logo"

interface SubMenuItem {
  title: string
  href: string
  icon: React.ElementType
  color: string
}

interface SidebarItemWithSubmenu {
  title: string
  icon: React.ElementType
  color: string
  href?: string
  submenu?: SubMenuItem[]
}

// Sidebar menu items for Hyper-GaraGe garage management system
const sidebarItems: SidebarItemWithSubmenu[] = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    color: "text-blue-500",
    href: "/dashboard",
  },
  {
    title: "Garage",
    icon: Truck,
    color: "text-indigo-500",
    submenu: [
      { title: "Customer Vehicles", href: "/garage/vehicles", icon: Car, color: "text-blue-400" },
      { title: "Diagnostics", href: "/garage/diagnostics", icon: Stethoscope, color: "text-blue-500" },
      { title: "Repairs", href: "/garage/repairs", icon: Wrench, color: "text-blue-600" },
      { title: "Services", href: "/garage/services", icon: PenToolIcon, color: "text-blue-700" },
      { title: "Work Order", href: "/garage/work-order", icon: ScrollText, color: "text-blue-800" },
    ],
  },
  {
    title: "Calendar",
    icon: Calendar,
    color: "text-cyan-500",
    href: "/calendar",
  },
  {
    title: "Financial",
    icon: DollarSign,
    color: "text-emerald-500",
    submenu: [
      { title: "Quotation", href: "/financial/quotation", icon: FileText, color: "text-emerald-400" },
      { title: "Invoices", href: "/financial/invoices", icon: FileSpreadsheet, color: "text-emerald-600" },
    ],
  },
  {
    title: "Service Management",
    icon: PenToolIcon,
    color: "text-violet-500",
    submenu: [
      { title: "Service Library", href: "/service-management/library", icon: Briefcase, color: "text-violet-500" },
    ],
  },
  {
    title: "Inventory & Spare Parts",
    icon: ShoppingBag,
    color: "text-amber-500",
    submenu: [
      { title: "Stock Tracking", href: "/inventory/stock", icon: ChartBar, color: "text-amber-400" },
      { title: "Supplier", href: "/inventory/supplier", icon: Store, color: "text-amber-600" },
    ],
  },
  {
    title: "Staff Management",
    icon: Users,
    color: "text-purple-500",
    submenu: [
      { title: "Staff Profiles", href: "/staff/profiles", icon: User, color: "text-purple-400" },
      { title: "Vacation and Leave", href: "/staff/leave", icon: Calendar, color: "text-purple-600" },
    ],
  },
  {
    title: "Reports",
    icon: FileText,
    color: "text-orange-500",
    submenu: [
      { title: "Financial Reports", href: "/reports/financial", icon: DollarSign, color: "text-orange-400" },
      { title: "Operational Report", href: "/reports/operational", icon: PieChart, color: "text-orange-500" },
      { title: "Inventory Report", href: "/reports/inventory", icon: ShoppingBag, color: "text-orange-600" },
    ],
  },
  {
    title: "Help & Support",
    icon: HelpCircle,
    color: "text-slate-500",
    submenu: [
      { title: "Profile", href: "/settings/profile", icon: User, color: "text-slate-500" },
      { title: "Theme", href: "/settings/theme", icon: Palette, color: "text-pink-500" },
      { title: "Language and Region", href: "/settings/language", icon: Globe, color: "text-teal-500" },
      { title: "Notifications", href: "/settings/notifications", icon: Bell, color: "text-yellow-500" },
      { title: "Business Information", href: "/settings/business", icon: Building2, color: "text-slate-600" },
      { title: "Labor Rates", href: "/settings/labor-rates", icon: Percent, color: "text-emerald-500" },
      { title: "Templates", href: "/settings/templates", icon: Template, color: "text-indigo-400" },
      { title: "Working Hours & Holidays", href: "/settings/working-hours", icon: Clock, color: "text-cyan-500" },
      { title: "KPI Management", href: "/settings/kpi", icon: Target, color: "text-red-500" },
      { title: "Makes and Models Management", href: "/settings/makes-models", icon: Car, color: "text-blue-500" },
      { title: "Users Management", href: "/settings/users", icon: Users, color: "text-purple-500" },
      { title: "Billing & Subscription", href: "/settings/billing", icon: CreditCard, color: "text-emerald-600" },
      { title: "Specification Management", href: "/settings/specifications", icon: Settings, color: "text-slate-500" },
      { title: "Security", href: "/settings/security", icon: ShieldCheck, color: "text-red-600" },
      { title: "Email and Integration", href: "/settings/email", icon: Mail, color: "text-blue-400" },
      { title: "Channels Integration", href: "/settings/channels", icon: Link2, color: "text-violet-500" },
    ],
  },
]

export function AppSidebar() {
  const { user, logout } = useAuth()
  const [openSubmenus, setOpenSubmenus] = React.useState<Record<string, boolean>>({})

  const toggleSubmenu = (title: string) => {
    setOpenSubmenus((prev) => ({
      ...prev,
      [title]: !prev[title],
    }))
  }

  return (
    <Sidebar>
      <SidebarHeader className="border-b">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/" className="flex items-center gap-3">
                <Logo size="sm" />
                <span className="font-semibold">iGarage360</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu>
          {sidebarItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              {item.submenu ? (
                <Collapsible open={openSubmenus[item.title]} onOpenChange={() => toggleSubmenu(item.title)}>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton>
                      <item.icon className={cn("h-5 w-5", item.color)} />
                      <span>{item.title}</span>
                      {openSubmenus[item.title] ? (
                        <ChevronDown className="ml-auto h-4 w-4" />
                      ) : (
                        <ChevronRight className="ml-auto h-4 w-4" />
                      )}
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="ml-6 mt-1 space-y-1 border-l pl-2">
                      {item.submenu.map((subItem) => (
                        <SidebarMenuButton
                          key={subItem.title}
                          asChild
                          size="sm"
                          variant="ghost"
                          className="justify-start"
                        >
                          <Link href={subItem.href} className="flex items-center gap-3">
                            <subItem.icon className={cn("h-4 w-4", subItem.color)} />
                            <span>{subItem.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ) : (
                <SidebarMenuButton asChild>
                  <Link href={item.href || "#"}>
                    <item.icon className={cn("h-5 w-5", item.color)} />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              )}
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="border-t">
        <div className="p-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarFallback>{user?.name?.charAt(0) || "U"}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-medium">{user?.name || "Guest"}</span>
              <span className="text-xs text-muted-foreground">{user?.role || "Not authenticated"}</span>
            </div>
            <button
              onClick={logout}
              className="ml-auto rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
