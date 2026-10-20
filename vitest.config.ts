import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // fournis/ contient les originaux de l'énoncé, copiés dans test/
    exclude: [...configDefaults.exclude, "fournis/**"],
  },
});
