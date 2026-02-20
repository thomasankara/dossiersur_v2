export const metadata = {
  title: "Mentions légales",
  description:
    "Mentions légales de DossierSûr : éditeur, hébergement, propriété intellectuelle.",
};

export default function MentionsLegalesPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-heading text-3xl font-bold">Mentions légales</h1>

      <div className="mt-8 space-y-6 text-sm text-muted-foreground">
        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">
            Éditeur du site
          </h2>
          <p>
            DossierSûr est édité par [Nom de la société], [forme juridique],
            au capital de [montant] euros.
          </p>
          <p>Siège social : [Adresse complète]</p>
          <p>RCS : [Ville] [Numéro]</p>
          <p>SIRET : [Numéro SIRET]</p>
          <p>Directeur de la publication : [Nom du responsable]</p>
          <p>Contact : contact@dossiersur.fr</p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">
            Hébergement
          </h2>
          <p>
            Le site est hébergé par Vercel Inc., 440 N Barranca Ave #4133,
            Covina, CA 91723, États-Unis.
          </p>
          <p>
            Les données sont stockées par Supabase Inc., via des serveurs
            situés dans l&apos;Union européenne.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">
            Propriété intellectuelle
          </h2>
          <p>
            L&apos;ensemble du contenu du site (textes, images, logos, code source)
            est protégé par le droit d&apos;auteur. Toute reproduction, même
            partielle, est interdite sans autorisation préalable.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">
            Responsabilité
          </h2>
          <p>
            DossierSûr fournit un outil d&apos;aide à la détection de fraude
            documentaire. Les résultats d&apos;analyse sont indicatifs et ne
            constituent pas une expertise juridique. L&apos;utilisateur reste
            seul responsable de ses décisions.
          </p>
        </section>
      </div>
    </div>
  );
}
