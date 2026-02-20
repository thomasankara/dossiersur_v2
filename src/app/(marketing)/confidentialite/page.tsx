export const metadata = {
  title: "Politique de confidentialité",
  description:
    "Politique de confidentialité de DossierSûr : données collectées, RGPD, droits des utilisateurs.",
};

export default function ConfidentialitePage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-heading text-3xl font-bold">
        Politique de confidentialité
      </h1>

      <div className="mt-8 space-y-6 text-sm text-muted-foreground">
        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">
            1. Responsable du traitement
          </h2>
          <p>
            Le responsable du traitement des données est [Nom de la société],
            joignable à contact@dossiersur.fr.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">
            2. Données collectées
          </h2>
          <p>Nous collectons les données suivantes :</p>
          <ul className="ml-4 mt-2 list-disc space-y-1">
            <li>
              <strong>Compte :</strong> email, nom complet (inscription)
            </li>
            <li>
              <strong>Documents :</strong> fichiers uploadés (analysés puis
              immédiatement supprimés)
            </li>
            <li>
              <strong>Résultats :</strong> scores d&apos;analyse, alertes (sans les
              documents originaux)
            </li>
            <li>
              <strong>Paiement :</strong> identifiant client Stripe (pas de
              numéro de carte stocké)
            </li>
            <li>
              <strong>Analytics :</strong> pages visitées, actions (via
              PostHog, serveurs UE)
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">
            3. Finalité du traitement
          </h2>
          <p>
            Les données sont traitées pour fournir le service d&apos;analyse
            documentaire, gérer votre compte, traiter les paiements et
            améliorer le service.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">
            4. Sous-traitants
          </h2>
          <ul className="ml-4 mt-2 list-disc space-y-1">
            <li>
              <strong>Supabase</strong> (hébergement base de données, UE)
            </li>
            <li>
              <strong>Vercel</strong> (hébergement application)
            </li>
            <li>
              <strong>Stripe</strong> (paiement sécurisé)
            </li>
            <li>
              <strong>PostHog</strong> (analytics, serveurs UE)
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">
            5. Durée de conservation
          </h2>
          <p>
            Les documents uploadés sont supprimés immédiatement après analyse.
            Les données de compte sont conservées tant que le compte est actif.
            Les données de facturation sont conservées 10 ans conformément
            aux obligations légales.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">
            6. Vos droits
          </h2>
          <p>
            Conformément au RGPD, vous disposez des droits suivants :
            accès, rectification, effacement, portabilité, limitation et
            opposition au traitement. Vous pouvez supprimer votre compte
            depuis les paramètres ou nous contacter à contact@dossiersur.fr.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">
            7. Cookies
          </h2>
          <p>
            Nous utilisons des cookies essentiels pour le fonctionnement du
            service (authentification) et des cookies analytiques (PostHog)
            pour améliorer l&apos;expérience. Vous pouvez refuser les cookies
            analytiques.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">
            8. Contact
          </h2>
          <p>
            Pour toute question relative à la protection de vos données,
            contactez-nous à contact@dossiersur.fr.
          </p>
        </section>
      </div>
    </div>
  );
}
