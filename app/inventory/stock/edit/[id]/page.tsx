import { StockForm } from "@/components/inventory/stock-form"

export default function EditStockPage({ params }: { params: { id: string } }) {
  return <StockForm id={params.id} />
}
