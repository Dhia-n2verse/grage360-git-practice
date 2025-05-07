import { SupplierForm } from "@/components/inventory/supplier-form"

export default function EditSupplierPage({ params }: { params: { id: string } }) {
  return <SupplierForm id={params.id} />
}
