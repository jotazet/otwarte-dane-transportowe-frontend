import { fileURLToPath } from "node:url";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  // Same `@/` alias as tsconfig.json.
  resolve: { alias: { "@": fileURLToPath(new URL(".", import.meta.url)) } },
  test: {
    environment: "node",
    // Agent worktrees in .claude/ hold other checkouts of this repository.
    exclude: [...configDefaults.exclude, ".claude/**"],
  },
});
