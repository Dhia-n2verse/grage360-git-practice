"use client"

import { useState } from "react"
import { format } from "date-fns"
import {
  Pencil,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  XCircle,
  Send,
  Printer,
  Download,
  Mail,
  MessageSquare,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { updateDiagnosticStatus, type Diagnostic, type ErrorCode } from "@/lib/api/diagnostics"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface DiagnosticDetailProps {
  diagnostic: Diagnostic
  canWrite: boolean
  canApprove: boolean
  onDiagnosticUpdated: () => void
}

export function DiagnosticDetail({ diagnostic, canWrite, canApprove, onDiagnosticUpdated }: DiagnosticDetailProps) {
  const { toast } = useToast()
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [isSharingDialogOpen, setIsSharingDialogOpen] = useState(false)
  const [recipientEmail, setRecipientEmail] = useState("")
  const [recipientPhone, setRecipientPhone] = useState("")
  const router = useRouter()

  // Format date for display
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "Not available"
    try {
      return format(new Date(dateString), "PPP")
    } catch (error) {
      return "Invalid date"
    }
  }

  // Get severity level
  const getHighestSeverity = () => {
    if (!diagnostic.error_codes || diagnostic.error_codes.length === 0) {
      return "None"
    }

    const severityOrder = {
      Critical: 4,
      High: 3,
      Moderate: 2,
      Low: 1,
    }

    return diagnostic.error_codes.reduce(
      (highest, current) => {
        const currentValue = severityOrder[current.severity as keyof typeof severityOrder] || 0
        const highestValue = severityOrder[highest as keyof typeof severityOrder] || 0
        return currentValue > highestValue ? current.severity : highest
      },
      "Low" as "Low" | "Moderate" | "High" | "Critical",
    )
  }

  // Handle status update
  const handleStatusUpdate = async (status: "Approved" | "Rejected") => {
    if (!canApprove) {
      toast({
        variant: "destructive",
        title: "Permission Denied",
        description:
          "You don't have permission to update diagnostic status. This action requires Manager or Front Desk role.",
      })
      return
    }

    setIsUpdatingStatus(true)
    try {
      const { success, error } = await updateDiagnosticStatus(diagnostic.id!, status)

      if (error) throw error

      toast({
        title: `Diagnostic ${status}`,
        description: `The diagnostic has been ${status.toLowerCase()}.`,
      })

      onDiagnosticUpdated()
    } catch (err: any) {
      console.error(`Error ${status.toLowerCase()} diagnostic:`, err)
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || `Failed to ${status.toLowerCase()} diagnostic. Please try again.`,
      })
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  // Handle edit diagnostic
  const handleEditDiagnostic = () => {
    if (!canWrite) {
      toast({
        variant: "destructive",
        title: "Permission Denied",
        description: "You don't have permission to edit diagnostics.",
      })
      return
    }

    // Navigate to edit form with diagnostic ID
    router.push(`/garage/diagnostics/edit/${diagnostic.id}`)
  }

  // Format diagnostic data for sharing
  const formatDiagnosticForSharing = (): string => {
    const vehicleInfo = diagnostic.vehicle
      ? `${diagnostic.vehicle.make} ${diagnostic.vehicle.model} ${diagnostic.vehicle.model_year || ""} (${diagnostic.vehicle.license_plate || "No plate"})`
      : "Vehicle information not available"

    const customerInfo = diagnostic.customer
      ? `${diagnostic.customer.first_name} ${diagnostic.customer.last_name}`
      : "Customer information not available"

    const systemChecks = diagnostic.system_checks.join(", ")

    const errorCodesText =
      diagnostic.error_codes.length > 0
        ? diagnostic.error_codes
            .map(
              (error: ErrorCode) =>
                `Code: ${error.code} | System: ${error.related_system} | Severity: ${error.severity} | Recommendation: ${error.recommendation}`,
            )
            .join("\n")
        : "No error codes found"

    return `
DIAGNOSTIC REPORT

Customer: ${customerInfo}
Vehicle: ${vehicleInfo}
Date: ${formatDate(diagnostic.created_at)}
Status: ${diagnostic.status}

SYSTEMS CHECKED:
${systemChecks}

ERROR CODES:
${errorCodesText}

OBSERVATIONS:
${diagnostic.observation || "No observations recorded"}

RECOMMENDATIONS:
${diagnostic.recommendation || "No recommendations provided"}

Report ID: ${diagnostic.id}
    `.trim()
  }

  // Handle print report
  const handlePrintReport = () => {
    window.print()
  }

  // Handle export to PDF
  const handleExportToPDF = () => {
    // Create a hidden iframe to generate the PDF content
    const printIframe = document.createElement("iframe")
    printIframe.style.position = "absolute"
    printIframe.style.top = "-9999px"
    printIframe.style.left = "-9999px"
    document.body.appendChild(printIframe)

    // Get the diagnostic content
    const diagnosticContent = document.querySelector(".diagnostic-content")
    if (!diagnosticContent) {
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: "Could not find diagnostic content to export.",
      })
      return
    }

    // Write the content to the iframe
    const iframeDocument = printIframe.contentDocument
    if (iframeDocument) {
      iframeDocument.open()
      iframeDocument.write(`
        <html>
          <head>
            <title>Diagnostic Report - ${diagnostic.id}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h1 { font-size: 24px; margin-bottom: 10px; }
              h2 { font-size: 18px; margin-top: 20px; margin-bottom: 10px; }
              .header { display: flex; justify-content: space-between; margin-bottom: 20px; }
              .info-section { margin-bottom: 20px; }
              .error-code { border: 1px solid #ddd; padding: 10px; margin-bottom: 10px; border-radius: 4px; }
              .severity-critical { color: #ef4444; font-weight: bold; }
              .severity-high { color: #f97316; font-weight: bold; }
              .severity-moderate { color: #eab308; font-weight: bold; }
              .severity-low { color: #22c55e; font-weight: bold; }
              .footer { margin-top: 30px; font-size: 12px; color: #666; }
            </style>
          </head>
          <body>
            ${diagnosticContent.innerHTML}
          </body>
        </html>
      `)
      iframeDocument.close()

      // Use browser's print to PDF functionality
      setTimeout(() => {
        printIframe.contentWindow?.print()
        document.body.removeChild(printIframe)

        toast({
          title: "PDF Export",
          description: "Your diagnostic report has been exported to PDF.",
        })
      }, 500)
    }
  }

  // Handle send via WhatsApp
  const handleSendViaWhatsApp = () => {
    const text = encodeURIComponent(formatDiagnosticForSharing())
    const phoneNumber = recipientPhone.replace(/[^0-9]/g, "")

    // Create WhatsApp deep link
    const whatsappUrl = phoneNumber ? `https://wa.me/${phoneNumber}?text=${text}` : `https://wa.me/?text=${text}`

    // Open in new tab
    window.open(whatsappUrl, "_blank")

    toast({
      title: "WhatsApp Message Prepared",
      description: "WhatsApp has been opened with the diagnostic report.",
    })

    setIsSharingDialogOpen(false)
  }

  // Handle send via Email
  const handleSendViaEmail = () => {
    const subject = encodeURIComponent(`Diagnostic Report - ${diagnostic.vehicle?.make} ${diagnostic.vehicle?.model}`)
    const body = encodeURIComponent(formatDiagnosticForSharing())

    // Create mailto link
    const mailtoUrl = recipientEmail
      ? `mailto:${recipientEmail}?subject=${subject}&body=${body}`
      : `mailto:?subject=${subject}&body=${body}`

    // Open email client
    window.location.href = mailtoUrl

    toast({
      title: "Email Prepared",
      description: "Your email client has been opened with the diagnostic report.",
    })

    setIsSharingDialogOpen(false)
  }

  // Handle send report (open sharing dialog)
  const handleSendReport = () => {
    setIsSharingDialogOpen(true)

    // Pre-fill recipient info if available
    if (diagnostic.customer?.email) {
      setRecipientEmail(diagnostic.customer.email)
    }

    if (diagnostic.customer?.phone) {
      setRecipientPhone(diagnostic.customer.phone)
    }
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "Critical":
        return <Badge variant="destructive">Critical</Badge>
      case "High":
        return (
          <Badge variant="destructive" className="bg-orange-500">
            High
          </Badge>
        )
      case "Moderate":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
            Moderate
          </Badge>
        )
      case "Low":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
            Low
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="bg-gray-100">
            None
          </Badge>
        )
    }
  }

  return (
    <>
      <Card className="print:shadow-none print:border-none">
        <CardHeader className="print:pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Diagnostic Report</CardTitle>
              <CardDescription>Detailed diagnostic information</CardDescription>
            </div>
            <div className="flex items-center gap-2 print:hidden">
              <div className="text-sm text-muted-foreground">Status:</div>
              {diagnostic.status === "Approved" ? (
                <Badge
                  variant="outline"
                  className="bg-green-100 text-green-800 border-green-300 flex items-center gap-1"
                >
                  <CheckCircle2 className="h-3 w-3" />
                  Approved
                </Badge>
              ) : diagnostic.status === "Rejected" ? (
                <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300 flex items-center gap-1">
                  <XCircle className="h-3 w-3" />
                  Rejected
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Pending
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 diagnostic-content">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Customer Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Customer Information</h3>
              <div className="space-y-2">
                <div className="flex items-start">
                  <span className="font-medium w-24">Name:</span>
                  <span>
                    {diagnostic.customer?.first_name} {diagnostic.customer?.last_name}
                  </span>
                </div>
                <div className="flex items-start">
                  <span className="font-medium w-24">Email:</span>
                  <span>{diagnostic.customer?.email}</span>
                </div>
                <div className="flex items-start">
                  <span className="font-medium w-24">Phone:</span>
                  <span>{diagnostic.customer?.phone}</span>
                </div>
              </div>
            </div>

            {/* Vehicle Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Vehicle Information</h3>
              <div className="space-y-2">
                <div className="flex items-start">
                  <span className="font-medium w-24">Make/Model:</span>
                  <span>
                    {diagnostic.vehicle?.make} {diagnostic.vehicle?.model}
                  </span>
                </div>
                <div className="flex items-start">
                  <span className="font-medium w-24">Year:</span>
                  <span>{diagnostic.vehicle?.model_year || "N/A"}</span>
                </div>
                <div className="flex items-start">
                  <span className="font-medium w-24">License:</span>
                  <span>{diagnostic.vehicle?.license_plate || "N/A"}</span>
                </div>
              </div>
            </div>
          </div>

          <Separator className="print:border-gray-300" />

          {/* System Checks */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Systems Checked</h3>
            <div className="flex flex-wrap gap-2">
              {diagnostic.system_checks.map((system) => (
                <Badge key={system} variant="outline" className="print:bg-transparent print:border-gray-300">
                  {system}
                </Badge>
              ))}
            </div>
          </div>

          <Separator className="print:border-gray-300" />

          {/* Error Codes */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Error Codes</h3>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Highest Severity:</span>
                {getSeverityBadge(getHighestSeverity())}
              </div>
            </div>

            {diagnostic.error_codes.length === 0 ? (
              <p className="text-muted-foreground">No error codes found</p>
            ) : (
              <div className="space-y-4">
                {diagnostic.error_codes.map((errorCode, index) => (
                  <div key={index} className="border rounded-md p-4 space-y-2 print:border-gray-300">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold">{errorCode.code}</div>
                      {getSeverityBadge(errorCode.severity)}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">System: </span>
                      {errorCode.related_system}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Recommendation: </span>
                      {errorCode.recommendation}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator className="print:border-gray-300" />

          {/* Observations & Recommendations */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Observations</h3>
            <div className="border rounded-md p-4 min-h-[100px] print:border-gray-300">
              {diagnostic.observation || "No observations recorded"}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Recommendations</h3>
            <div className="border rounded-md p-4 min-h-[100px] print:border-gray-300">
              {diagnostic.recommendation || "No recommendations provided"}
            </div>
          </div>

          <div className="text-sm text-muted-foreground print:mt-8">
            <p>Diagnostic ID: {diagnostic.id}</p>
            <p>Created: {formatDate(diagnostic.created_at)}</p>
            <p>Last Updated: {formatDate(diagnostic.updated_at)}</p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-wrap justify-between gap-2 print:hidden">
          <div className="flex flex-wrap gap-2">
            {canWrite && (
              <Button variant="outline" onClick={handleEditDiagnostic}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Button>
            )}
            <Button variant="outline" onClick={handlePrintReport}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
            <Button variant="outline" onClick={handleExportToPDF}>
              <Download className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
            <Button variant="outline" onClick={handleSendReport}>
              <Send className="mr-2 h-4 w-4" />
              Send Report
            </Button>
          </div>

          {canApprove && diagnostic.status === "Pending" && (
            <div className="flex gap-2">
              <Button variant="destructive" onClick={() => handleStatusUpdate("Rejected")} disabled={isUpdatingStatus}>
                {isUpdatingStatus ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject
                  </>
                )}
              </Button>
              <Button variant="default" onClick={() => handleStatusUpdate("Approved")} disabled={isUpdatingStatus}>
                {isUpdatingStatus ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Approve
                  </>
                )}
              </Button>
            </div>
          )}
        </CardFooter>
      </Card>

      {/* Sharing Dialog */}
      <Dialog open={isSharingDialogOpen} onOpenChange={setIsSharingDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Diagnostic Report</DialogTitle>
            <DialogDescription>Send the diagnostic report via WhatsApp or Email</DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="whatsapp" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
              <TabsTrigger value="email">Email</TabsTrigger>
            </TabsList>

            <TabsContent value="whatsapp" className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="recipient-phone">Recipient Phone Number</Label>
                <Input
                  id="recipient-phone"
                  placeholder="+1 (555) 123-4567"
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Include country code. Leave empty to generate a shareable link.
                </p>
              </div>

              <Button className="w-full" onClick={handleSendViaWhatsApp}>
                <MessageSquare className="mr-2 h-4 w-4" />
                Send via WhatsApp
              </Button>
            </TabsContent>

            <TabsContent value="email" className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="recipient-email">Recipient Email</Label>
                <Input
                  id="recipient-email"
                  type="email"
                  placeholder="customer@example.com"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Leave empty to compose without a recipient.</p>
              </div>

              <Button className="w-full" onClick={handleSendViaEmail}>
                <Mail className="mr-2 h-4 w-4" />
                Send via Email
              </Button>
            </TabsContent>
          </Tabs>

          <DialogFooter className="sm:justify-start">
            <Button type="button" variant="secondary" onClick={() => setIsSharingDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
