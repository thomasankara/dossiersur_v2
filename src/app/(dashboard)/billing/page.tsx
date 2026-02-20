import { Header } from "@/components/layouts/header";

export const metadata = { title: "Facturation" };

export default function BillingPage() {
  return (
    <>
      <Header>
        <h1 className="text-lg font-semibold">Facturation</h1>
      </Header>
      <div className="flex-1 p-6">
        <p className="text-muted-foreground">Page facturation — à implémenter</p>
      </div>
    </>
  );
}
