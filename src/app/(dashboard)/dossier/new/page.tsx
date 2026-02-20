import { Header } from "@/components/layouts/header";
import { NewDossierForm } from "./new-dossier-form";

export const metadata = { title: "Nouveau dossier" };

export default function NewDossierPage() {
  return (
    <>
      <Header>
        <h1 className="text-lg font-semibold">Nouveau dossier</h1>
      </Header>
      <div className="flex-1 p-6">
        <NewDossierForm />
      </div>
    </>
  );
}
