import { Header } from "@/components/layouts/header";

export const metadata = { title: "Paramètres" };

export default function SettingsPage() {
  return (
    <>
      <Header>
        <h1 className="text-lg font-semibold">Paramètres</h1>
      </Header>
      <div className="flex-1 p-6">
        <p className="text-muted-foreground">Page paramètres — à implémenter</p>
      </div>
    </>
  );
}
