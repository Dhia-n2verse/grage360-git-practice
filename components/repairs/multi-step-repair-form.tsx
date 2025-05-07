"use client"

import { useState, useEffect, createContext, useContext } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, FormProvider } from "react-hook-form"
import * as z from "zod"
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { createRepair, type Repair, type RepairItem } from "@/lib/api/repairs"

// Step components
import { DiagnosticSelectionStep } from "./steps/diagnostic-selection-step"
import { VehicleCustomerStep } from "./steps/vehicle-customer-step"
import { RepairDetailsStep } from "./steps/repair-details-step"
import { PartsSelectionStep } from "./steps/parts-selection-step"
import { LaborCostStep } from "./steps/labor-cost-step"
import { TechnicianAssignmentStep } from "./steps/technician-assignment-step"
import { ReviewSubmitStep } from "./steps/review-submit-step"

// Form schema
const repairFormSchema = z.object({
  // Step 1: Diagnostic Selection
  diagnostics_id: z.string().optional(),

  // Step 2: Vehicle and Customer Information
  vehicle_id: z.string().min(1, "Vehicle is required"),
  customer_id: z.string().min(1, "Customer is required"),

  // Step 3: Description, Notes, and Notification
  description: z.string().optional(),
  notes: z.string().optional(),
  notify_customer: z.boolean().default(false),

  // Step 4: Parts Addition is handled separately

  // Step 5: Labor Cost Entry
  labor_cost: z.coerce.number().min(0, "Labor cost must be a positive number"),

  // Step 6: Technician Assignment
  technician_specialty_ids: z.array(z.string()).optional(),

  // Additional fields
  progress: z.coerce.number().int().min(0).max(100).default(0),
  status: z.enum(["Scheduled", "InProgress", "Pending", "Completed", "Cancelled"]).default("Scheduled"),
  total_cost: z.coerce.number().min(0).optional(),
})

export type RepairFormValues = z.infer<typeof repairFormSchema>

// Context for sharing data between steps
type RepairFormContextType = {
  currentStep: number
  setCurrentStep: (step: number) => void
  repairItems: RepairItem[]
  setRepairItems: (items: RepairItem[]) => void
  totalPartsCost: number
  setTotalPartsCost: (cost: number) => void
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
  diagnostic: any | null
  setDiagnostic: (diagnostic: any | null) => void
  vehicle: any | null
  setVehicle: (vehicle: any | null) => void
  customer: any | null
  setCustomer: (customer: any | null) => void
  technicians: any[]
  setTechnicians: (technicians: any[]) => void
}

const RepairFormContext = createContext<RepairFormContextType | undefined>(undefined)

export const useRepairFormContext = () => {
  const context = useContext(RepairFormContext)
  if (!context) {
    throw new Error("useRepairFormContext must be used within a RepairFormProvider")
  }
  return context
}

export function MultiStepRepairForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(0)
  const [repairItems, setRepairItems] = useState<RepairItem[]>([])
  const [totalPartsCost, setTotalPartsCost] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [diagnostic, setDiagnostic] = useState<any | null>(null)
  const [vehicle, setVehicle] = useState<any | null>(null)
  const [customer, setCustomer] = useState<any | null>(null)
  const [technicians, setTechnicians] = useState<any[]>([])

  const methods = useForm<RepairFormValues>({
    resolver: zodResolver(repairFormSchema),
    defaultValues: {
      diagnostics_id: "",
      vehicle_id: "",
      customer_id: "",
      description: "",
      notes: "",
      notify_customer: false,
      labor_cost: 0,
      technician_specialty_ids: [],
      progress: 0,
      status: "Scheduled",
      total_cost: 0,
    },
  })

  const steps = [
    { title: "Select Diagnostic", description: "Choose an approved diagnostic" },
    { title: "Vehicle & Customer", description: "Confirm vehicle and customer information" },
    { title: "Repair Details", description: "Enter description, notes, and notification preferences" },
    { title: "Parts Selection", description: "Add parts required for the repair" },
    { title: "Labor Cost", description: "Enter labor cost for the repair" },
    { title: "Assign Technicians", description: "Assign technicians to the repair" },
    { title: "Review & Submit", description: "Review and submit the repair" },
  ]

  // Update total cost when parts or labor cost changes
  useEffect(() => {
    const laborCost = methods.getValues("labor_cost") || 0
    const newTotalCost = totalPartsCost + laborCost
    methods.setValue("total_cost", newTotalCost)
  }, [totalPartsCost, methods])

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const onSubmit = async (data: RepairFormValues) => {
    setIsLoading(true)
    try {
      // Prepare repair data
      const repairData: Repair = {
        vehicle_id: data.vehicle_id,
        customer_id: data.customer_id,
        diagnostics_id: data.diagnostics_id,
        description: data.description,
        notes: data.notes,
        notify_customer: data.notify_customer,
        labor_cost: data.labor_cost,
        total_cost: data.total_cost,
        progress: data.progress,
        status: data.status,
        repair_items: repairItems,
      }

      // Create repair
      const response = await createRepair(repairData)

      if (response.success && response.id) {
        // If technicians are assigned, create repair_technicians entries
        if (data.technician_specialty_ids && data.technician_specialty_ids.length > 0) {
          // This would be handled by a new API function to link technicians to repairs
          // For now, we'll just log it
          console.log("Technicians to assign:", data.technician_specialty_ids)
        }

        toast({
          title: "Success",
          description: "Repair created successfully",
        })
        router.push(`/garage/repairs/${response.id}`)
      } else {
        throw new Error(response.error || "Failed to create repair")
      }
    } catch (error) {
      console.error("Error creating repair:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create repair",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return <DiagnosticSelectionStep />
      case 1:
        return <VehicleCustomerStep />
      case 2:
        return <RepairDetailsStep />
      case 3:
        return <PartsSelectionStep />
      case 4:
        return <LaborCostStep />
      case 5:
        return <TechnicianAssignmentStep />
      case 6:
        return <ReviewSubmitStep />
      default:
        return null
    }
  }

  return (
    <RepairFormContext.Provider
      value={{
        currentStep,
        setCurrentStep,
        repairItems,
        setRepairItems,
        totalPartsCost,
        setTotalPartsCost,
        isLoading,
        setIsLoading,
        diagnostic,
        setDiagnostic,
        vehicle,
        setVehicle,
        customer,
        setCustomer,
        technicians,
        setTechnicians,
      }}
    >
      <FormProvider {...methods}>
        <div className="space-y-6">
          <div className="flex items-center">
            <Button variant="ghost" onClick={() => router.push("/garage/repairs")} className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Repairs
            </Button>
            <h2 className="text-2xl font-bold tracking-tight">New Repair</h2>
          </div>

          {/* Progress indicator */}
          <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            ></div>
          </div>

          {/* Step indicators */}
          <div className="flex justify-between mb-8">
            {steps.map((step, index) => (
              <div
                key={index}
                className={`flex flex-col items-center ${
                  index <= currentStep ? "text-primary" : "text-muted-foreground"
                }`}
                style={{ width: `${100 / steps.length}%` }}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${
                    index < currentStep
                      ? "bg-primary text-primary-foreground"
                      : index === currentStep
                        ? "border-2 border-primary"
                        : "border-2 border-muted"
                  }`}
                >
                  {index < currentStep ? <Check className="h-4 w-4" /> : index + 1}
                </div>
                <span className="text-xs text-center hidden md:block">{step.title}</span>
              </div>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{steps[currentStep].title}</CardTitle>
              <CardDescription>{steps[currentStep].description}</CardDescription>
            </CardHeader>
            <CardContent>{renderStepContent()}</CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={prevStep} disabled={currentStep === 0 || isLoading}>
                Previous
              </Button>
              {currentStep < steps.length - 1 ? (
                <Button onClick={nextStep} disabled={isLoading}>
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={methods.handleSubmit(onSubmit)} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Create Repair
                    </>
                  )}
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      </FormProvider>
    </RepairFormContext.Provider>
  )
}
