# Garage

Maquette fonctionnelle Expo (React Native + TypeScript) — livre de garage numérique pour garagiste indépendant.

## Lancer

```bash
npm install
npm start
```

## Architecture

- `app/` — écrans (expo-router)
- `types/` — modèles TypeScript
- `data/` — store mock + `garageService` (seule porte d’entrée données)
- `utils/` — calculs HT/TVA/TTC purs
- `components/` — UI réutilisable
- `constants/` — thème et badges de statut

Les écrans n’accèdent jamais au store mock directement : remplacer le contenu de `data/garageService.ts` par des appels Supabase plus tard, sans toucher à l’UI.
