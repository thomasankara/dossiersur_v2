import { Check } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface PricingCardProps {
  name: string;
  priceLabel: string;
  description: string;
  features: readonly string[];
  popular?: boolean;
  children: React.ReactNode; // CTA button slot
}

export function PricingCard({
  name,
  priceLabel,
  description,
  features,
  popular,
  children,
}: PricingCardProps) {
  return (
    <Card
      className={cn(
        "flex flex-col",
        popular && "border-primary shadow-lg ring-1 ring-primary",
      )}
    >
      <CardHeader className="space-y-1">
        {popular && (
          <span className="mb-2 inline-block w-fit rounded-full bg-primary px-3 py-0.5 text-xs font-medium text-primary-foreground">
            Populaire
          </span>
        )}
        <CardTitle className="text-xl">{name}</CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="flex-1">
        <p className="text-3xl font-bold">{priceLabel}</p>
        <p className="mt-1 text-xs text-muted-foreground">Paiement unique</p>
        <ul className="mt-6 space-y-2">
          {features.map((feature) => (
            <li key={feature} className="flex items-start gap-2 text-sm">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-valid" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>{children}</CardFooter>
    </Card>
  );
}
