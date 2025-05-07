export default function SettingsPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-lg font-medium">Business Information</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Manage your company details, contact information, and business address.
          </p>
          <a href="/settings/business" className="text-sm text-primary hover:underline mt-4 inline-block">
            Edit Business Information →
          </a>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-lg font-medium">User Management</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Manage user accounts, roles, and permissions for your staff.
          </p>
          <a href="/settings/users" className="text-sm text-primary hover:underline mt-4 inline-block">
            Manage Users →
          </a>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-lg font-medium">Billing & Subscription</h3>
          <p className="text-sm text-muted-foreground mt-2">
            View and manage your subscription plan, payment methods, and billing history.
          </p>
          <a href="/settings/billing" className="text-sm text-primary hover:underline mt-4 inline-block">
            Manage Billing →
          </a>
        </div>
      </div>
    </div>
  )
}
