// CinéResa — API de réservation de places de cinéma
// Point d'entrée : découpage en couches presentation → business → data.
import app from "./presentation/app";

const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => console.log(`CinéResa legacy sur http://localhost:${PORT}`));
}

export default app;
