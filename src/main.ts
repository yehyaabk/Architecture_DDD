// Point d'entrée : démarre le serveur (l'assemblage est dans container.ts)
import { buildApp, selectAdapters } from "./container";

const PORT = process.env.PORT || 3000;
buildApp(selectAdapters()).listen(PORT, () => console.log(`CinéResa sur http://localhost:${PORT}`));
