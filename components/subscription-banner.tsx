import Link from "next/link"

export function SubscriptionBanner() {
  return (
    <div className="bg-amber-50 text-amber-800 px-4 py-2 text-sm text-center">
      Your subscription will expire in 7 days. Please{" "}
      <Link href="/settings/billing" className="underline font-medium">
        renew it
      </Link>
    </div>
  )
}
