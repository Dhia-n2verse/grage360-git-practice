import { CollapsibleLayout } from "@/components/layout/collapsible-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function DashboardPage() {
  return (
    <CollapsibleLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to your dashboard</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <CardTitle>Card {i + 1}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>This is a sample card that demonstrates how the content expands when the sidebar is collapsed.</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </CollapsibleLayout>
  )
}
