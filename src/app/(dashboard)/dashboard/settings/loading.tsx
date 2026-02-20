import { Skeleton } from "@/components/ui/skeleton";
import { Header } from "@/components/layouts/header";

export default function SettingsLoading() {
  return (
    <>
      <Header>
        <Skeleton className="h-5 w-28" />
      </Header>
      <div className="flex-1 space-y-6 p-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-full rounded-lg" />
        ))}
      </div>
    </>
  );
}
