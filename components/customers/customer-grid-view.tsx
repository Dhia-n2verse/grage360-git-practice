"use client"
import { ArrowDown, ArrowUp, Briefcase, Mail, MapPin, Phone, UserCircle } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { getInitials, getRoleColor } from "@/lib/utils"
import { AlphabeticPagination } from "@/components/alphabetic-pagination"

interface CustomerGridViewProps {
  customers: any[]
  onSelectCustomer: (customer: any) => void
  selectedCustomer: any | null
  onPageChange: (page: number) => void
  onSortChange: (field: string, order: "asc" | "desc") => void
  onLetterChange: (letter: string | null) => void
  currentPage: number
  totalPages: number
  activeLetter: string | null
  sortField: string
  sortOrder: "asc" | "desc"
}

export function CustomerGridView({
  customers,
  onSelectCustomer,
  selectedCustomer,
  onPageChange,
  onSortChange,
  onLetterChange,
  currentPage,
  totalPages,
  activeLetter,
  sortField,
  sortOrder,
}: CustomerGridViewProps) {
  // Function to handle column header click for sorting
  const handleSortClick = (field: string) => {
    const newOrder = sortField === field && sortOrder === "asc" ? "desc" : "asc"
    onSortChange(field, newOrder)
  }

  // Function to render sort indicator
  const renderSortIndicator = (field: string) => {
    if (sortField !== field) return null
    return sortOrder === "asc" ? <ArrowUp className="ml-1 h-4 w-4" /> : <ArrowDown className="ml-1 h-4 w-4" />
  }

  return (
    <div className="space-y-4">
      {/* Alphabetic Pagination */}
      <AlphabeticPagination activeLetter={activeLetter} onLetterChange={onLetterChange} />

      {/* Grid View */}
      <div className="rounded-md border">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-2 bg-muted/50 p-4 text-sm font-medium">
          <div className="col-span-5 flex cursor-pointer items-center" onClick={() => handleSortClick("first_name")}>
            Customer Name
            {renderSortIndicator("first_name")}
          </div>
          <div className="col-span-5 flex cursor-pointer items-center" onClick={() => handleSortClick("address")}>
            Contact Address
            {renderSortIndicator("address")}
          </div>
          <div
            className="col-span-2 flex cursor-pointer items-center justify-end"
            onClick={() => handleSortClick("type")}
          >
            Type
            {renderSortIndicator("type")}
          </div>
        </div>

        {/* Table Body */}
        <div className="divide-y">
          {customers.length === 0 ? (
            <div className="flex h-32 items-center justify-center p-4 text-muted-foreground">No customers found</div>
          ) : (
            customers.map((customer) => (
              <div
                key={customer.id}
                className={`grid cursor-pointer grid-cols-12 gap-2 p-4 transition-colors hover:bg-muted/50 ${
                  selectedCustomer?.id === customer.id ? "bg-muted/50" : ""
                }`}
                onClick={() => onSelectCustomer(customer)}
              >
                <div className="col-span-5 flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    {customer.image ? (
                      <AvatarImage
                        src={customer.image || "/placeholder.svg"}
                        alt={`${customer.first_name} ${customer.last_name}`}
                      />
                    ) : (
                      <AvatarFallback className={getRoleColor(customer.role)}>
                        {getInitials(`${customer.first_name} ${customer.last_name}`)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <div className="font-medium">
                      {customer.first_name} {customer.last_name}
                    </div>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Mail className="mr-1 h-3 w-3" />
                      {customer.email}
                    </div>
                  </div>
                </div>
                <div className="col-span-5">
                  <div className="flex items-start">
                    <MapPin className="mr-1 mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                    <div>
                      <div className="text-sm">{customer.address}</div>
                      <div className="text-xs text-muted-foreground">
                        {customer.city}
                        {customer.state ? `, ${customer.state}` : ""}
                        {customer.postal_code ? ` ${customer.postal_code}` : ""}
                      </div>
                    </div>
                  </div>
                  <div className="mt-1 flex items-center text-xs text-muted-foreground">
                    <Phone className="mr-1 h-3 w-3" />
                    {customer.phone}
                  </div>
                </div>
                <div className="col-span-2 flex items-center justify-end">
                  <Badge
                    variant={customer.type === "business" ? "default" : "secondary"}
                    className={
                      customer.type === "business"
                        ? "bg-emerald-500 hover:bg-emerald-600"
                        : "bg-blue-500 hover:bg-blue-600"
                    }
                  >
                    {customer.type === "business" ? (
                      <Briefcase className="mr-1 h-3 w-3" />
                    ) : (
                      <UserCircle className="mr-1 h-3 w-3" />
                    )}
                    {customer.type.charAt(0).toUpperCase() + customer.type.slice(1)}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing page {currentPage} of {totalPages}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage <= 1}>
            Previous
          </Button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            // Show 5 pages max, centered around current page
            let pageNum = currentPage
            if (currentPage <= 3) {
              pageNum = i + 1
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i
            } else {
              pageNum = currentPage - 2 + i
            }

            // Only show valid page numbers
            if (pageNum > 0 && pageNum <= totalPages) {
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => onPageChange(pageNum)}
                  className="w-9"
                >
                  {pageNum}
                </Button>
              )
            }
            return null
          })}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
          >
            Next
          </Button>
        </div>
      </div>

      {/* Quick View Panel for Mobile */}
      {selectedCustomer && (
        <Card className="lg:hidden mt-4">
          <CardContent className="p-4">
            <div className="flex flex-col items-center mb-4">
              <Avatar className="h-16 w-16 mb-2">
                <AvatarFallback className={getRoleColor(selectedCustomer.role)}>
                  {getInitials(`${selectedCustomer.first_name} ${selectedCustomer.last_name}`)}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-lg font-bold">
                {selectedCustomer.first_name} {selectedCustomer.last_name}
              </h2>
              <Badge
                variant={selectedCustomer.type === "business" ? "default" : "secondary"}
                className={`mt-1 ${
                  selectedCustomer.type === "business"
                    ? "bg-emerald-500 hover:bg-emerald-600"
                    : "bg-blue-500 hover:bg-blue-600"
                }`}
              >
                {selectedCustomer.type === "business" ? (
                  <Briefcase className="mr-1 h-3 w-3" />
                ) : (
                  <UserCircle className="mr-1 h-3 w-3" />
                )}
                {selectedCustomer.type.charAt(0).toUpperCase() + selectedCustomer.type.slice(1)}
              </Badge>
            </div>

            <Separator className="my-3" />

            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Contact Information</h3>
                <div className="space-y-1">
                  <div className="flex items-center text-sm">
                    <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{selectedCustomer.email}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{selectedCustomer.phone}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Address</h3>
                <div className="flex items-start text-sm">
                  <MapPin className="h-4 w-4 mr-2 text-muted-foreground mt-0.5" />
                  <div>
                    <p>{selectedCustomer.address}</p>
                    <p className="text-muted-foreground">
                      {selectedCustomer.city}
                      {selectedCustomer.state ? `, ${selectedCustomer.state}` : ""}
                      {selectedCustomer.postal_code ? ` ${selectedCustomer.postal_code}` : ""}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
