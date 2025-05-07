import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Edit, Trash2 } from "lucide-react"

// Sample data
const records = [
  { id: 1, name: "John Doe", email: "john@example.com", status: "Active" },
  { id: 2, name: "Jane Smith", email: "jane@example.com", status: "Inactive" },
  { id: 3, name: "Bob Johnson", email: "bob@example.com", status: "Active" },
  { id: 4, name: "Alice Brown", email: "alice@example.com", status: "Pending" },
  { id: 5, name: "Charlie Davis", email: "charlie@example.com", status: "Active" },
  { id: 6, name: "Eva Wilson", email: "eva@example.com", status: "Inactive" },
  { id: 7, name: "Frank Miller", email: "frank@example.com", status: "Active" },
  { id: 8, name: "Grace Taylor", email: "grace@example.com", status: "Pending" },
]

export function RecordsList() {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => (
            <TableRow key={record.id}>
              <TableCell>{record.id}</TableCell>
              <TableCell className="font-medium">{record.name}</TableCell>
              <TableCell>{record.email}</TableCell>
              <TableCell>
                <span
                  className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                    record.status === "Active"
                      ? "bg-green-100 text-green-800"
                      : record.status === "Inactive"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {record.status}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" size="icon">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
