import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Quels types de documents sont analysés ?",
    answer:
      "DossierSûr analyse les bulletins de paie, avis d\u2019imposition, cartes d\u2019identité, passeports, contrats de travail, attestations employeur, quittances de loyer, relevés de compte et RIB.",
  },
  {
    question: "Comment fonctionne la détection de fraude ?",
    answer:
      "Notre IA analyse les métadonnées des fichiers PDF (outils de création, dates de modification), vérifie la cohérence des données entre documents, et détecte les signes de falsification comme les polices suspectes ou les modifications récentes.",
  },
  {
    question: "Mes documents sont-ils conservés ?",
    answer:
      "Non. Les documents sont analysés puis immédiatement supprimés de nos serveurs. Nous ne conservons que le résultat de l\u2019analyse (score, alertes). Nous sommes conformes au RGPD.",
  },
  {
    question: "Les 3 crédits gratuits expirent-ils ?",
    answer:
      "Non, les crédits n\u2019expirent jamais. Vous pouvez les utiliser quand vous le souhaitez. Chaque analyse de document consomme 1 crédit.",
  },
  {
    question: "Puis-je obtenir un remboursement ?",
    answer:
      "Oui, nous offrons un remboursement sous 14 jours si vous n\u2019êtes pas satisfait. Contactez-nous par email.",
  },
];

export function FaqSection() {
  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-3xl">
        <h2 className="mb-10 text-center font-heading text-2xl font-bold sm:text-3xl">
          Questions fréquentes
        </h2>
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, i) => (
            <AccordionItem key={faq.question} value={`faq-${i}`}>
              <AccordionTrigger className="text-left text-sm font-medium">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
