export const metadata = {
  title: "Conditions générales d\u2019utilisation",
  description:
    "Conditions générales d\u2019utilisation de DossierSûr : service, crédits, responsabilité.",
};

export default function CguPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-heading text-3xl font-bold">
        Conditions générales d&apos;utilisation
      </h1>

      <div className="mt-8 space-y-6 text-sm text-muted-foreground">
        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">
            1. Objet
          </h2>
          <p>
            Les présentes conditions générales régissent l&apos;utilisation du
            service DossierSûr, accessible à l&apos;adresse dossiersur.fr. En
            créant un compte, l&apos;utilisateur accepte ces conditions sans
            réserve.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">
            2. Description du service
          </h2>
          <p>
            DossierSûr est un service en ligne d&apos;analyse automatique de
            documents locatifs. Le service détecte les anomalies et signes de
            falsification dans les documents soumis par l&apos;utilisateur.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">
            3. Crédits et paiement
          </h2>
          <p>
            L&apos;utilisation du service repose sur un système de crédits. Chaque
            analyse de document consomme un crédit. Les crédits sont achetés
            par packs via Stripe et n&apos;expirent pas.
          </p>
          <p>
            3 crédits sont offerts à l&apos;inscription. Les packs achetés ne sont
            ni échangeables ni transférables.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">
            4. Droit de rétractation
          </h2>
          <p>
            Conformément à l&apos;article L221-28 du Code de la consommation, le
            droit de rétractation ne s&apos;applique pas aux contenus numériques
            fournis immédiatement. Toutefois, nous offrons un remboursement
            sous 14 jours pour les crédits non utilisés.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">
            5. Responsabilité
          </h2>
          <p>
            DossierSûr fournit des résultats indicatifs. L&apos;utilisateur est
            seul responsable de l&apos;interprétation et de l&apos;utilisation des
            résultats d&apos;analyse. DossierSûr ne saurait être tenu responsable
            des décisions prises sur la base des analyses.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">
            6. Compte utilisateur
          </h2>
          <p>
            L&apos;utilisateur est responsable de la confidentialité de ses
            identifiants. Toute activité réalisée depuis son compte est
            réputée effectuée par lui. En cas d&apos;utilisation non autorisée,
            l&apos;utilisateur doit nous en informer immédiatement.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">
            7. Modification des CGU
          </h2>
          <p>
            DossierSûr se réserve le droit de modifier les présentes CGU.
            Les utilisateurs seront informés de toute modification
            substantielle par email.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">
            8. Droit applicable
          </h2>
          <p>
            Les présentes CGU sont soumises au droit français. En cas de
            litige, les tribunaux de Paris seront seuls compétents.
          </p>
        </section>
      </div>
    </div>
  );
}
