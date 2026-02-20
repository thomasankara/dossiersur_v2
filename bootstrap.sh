#!/bin/bash
echo "🚀 SDD SaaS Bootstrap"
echo ""
read -p "📦 Nom du projet : " PROJECT_NAME
read -p "📝 Description courte : " PROJECT_DESC
read -p "🎯 B2B ou B2C ? (b2b/b2c) : " TARGET
read -p "💰 Modèle (freemium/subscription/one-time) : " MODEL
read -p "🤖 Features AI/LLM ? (o/n) : " HAS_AI
echo ""
echo "⚙️  Génération des fichiers..."

# Générer CLAUDE.md depuis template
sed -e "s/{{PROJECT_NAME}}/$PROJECT_NAME/g" \
    -e "s/{{PROJECT_DESC}}/$PROJECT_DESC/g" \
    -e "s/{{TARGET}}/$TARGET/g" \
    CLAUDE.md.template > CLAUDE.md

# Générer specs
mkdir -p specs/tasks docs/research
for f in specs/*.template docs/*.template; do
  out="${f%.template}"
  sed "s/{{PROJECT_NAME}}/$PROJECT_NAME/g" "$f" > "$out"
  rm "$f"
done

# Créer .env.local.example
cat > .env.local.example << 'ENVEOF'
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# PostHog
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com

# AI (si applicable)
ANTHROPIC_API_KEY=
ENVEOF

echo "✅ Projet $PROJECT_NAME initialisé !"
echo ""
echo "Prochaines étapes :"
echo "1. npx create-next-app@latest . --typescript --tailwind --app --src-dir"
echo "2. npx shadcn@latest init"
echo "3. npm install @supabase/supabase-js @supabase/ssr posthog-js stripe zod react-hook-form @hookform/resolvers framer-motion lucide-react"
echo "4. cp .env.local.example .env.local && remplis les clés"
echo "5. git add . && git commit -m 'chore: init SDD project'"
echo "6. Ouvre Claude Code et commence par écrire les specs !"
