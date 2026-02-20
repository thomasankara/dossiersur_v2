import { Skeleton } from "@/components/ui/skeleton";
import { Header } from "@/components/layouts/header";

export default function BillingLoading() {
  return (
    <>
      <Header>
        <div className="flex flex-1 items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-8 w-28 rounded-md" />
        </div>
      </Header>
      <div className="flex-1 space-y-8 p-6">
        {/* Credits card skeleton */}
        <Skeleton className="h-32 w-full rounded-lg" />

        {/* Pricing table skeleton */}
        <div className="space-y-4">
          <Skeleton className="h-5 w-48" />
          <div className="grid gap-6 md:grid-cols-3">
            <Skeleton className="h-80 rounded-lg" />
            <Skeleton className="h-80 rounded-lg" />
            <Skeleton className="h-80 rounded-lg" />
          </div>
        </div>

        {/* History skeleton */}
        <div className="space-y-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
      </div>
    </>
  );
}
