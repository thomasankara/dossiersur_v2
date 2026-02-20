import { Skeleton } from "@/components/ui/skeleton";
import { Header } from "@/components/layouts/header";

export default function DossierLoading() {
  return (
    <>
      <Header>
        <div className="flex flex-1 items-center gap-3">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </Header>
      <div className="flex-1 space-y-6 p-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-10 w-full max-w-sm" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-32 rounded-lg" />
          <Skeleton className="h-32 rounded-lg" />
        </div>
      </div>
    </>
  );
}
