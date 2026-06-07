import { defineConfig } from "vite";

// IMPORTANT (GitHub Pages):
// `base` MUST match the repository name, wrapped in slashes.
// Repo: https://github.com/<user>/neon-lazarski-pinball
// Live: https://<user>.github.io/neon-lazarski-pinball/
// If this is wrong, the deployed page loads a blank screen because
// it tries to fetch assets from the wrong path.
export default defineConfig({
  base: "/neon-lazarski-pinball/",
});
