"use client"

import * as React from "react"
import Link from "next/link"
import { ChevronDown, ChevronRight } from "lucide-react"

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

interface NavItem {
  title: string
  url: string
  items?: NavItem[]
  isActive?: boolean
}

interface NavMainProps {
  items: NavItem[]
}

export function NavMain({ items }: NavMainProps) {
  const [openItems, setOpenItems] = React.useState<Record<string, boolean>>({})

  const toggleItem = (title: string) => {
    setOpenItems((prev) => ({
      ...prev,
      [title]: !prev[title],
    }))
  }

  return (
    <>
      {items.map((item) => (
        <SidebarGroup key={item.title}>
          {item.items?.length ? (
            <Collapsible open={openItems[item.title]} onOpenChange={() => toggleItem(item.title)}>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton className="w-full justify-between">
                  {item.title}
                  {openItems[item.title] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {item.items.map((subItem) => (
                      <SidebarMenuItem key={subItem.title}>
                        <SidebarMenuButton asChild isActive={subItem.isActive}>
                          <Link href={subItem.url}>{subItem.title}</Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </Collapsible>
          ) : (
            <SidebarMenuButton asChild isActive={item.isActive}>
              <Link href={item.url}>{item.title}</Link>
            </SidebarMenuButton>
          )}
        </SidebarGroup>
      ))}
    </>
  )
}
