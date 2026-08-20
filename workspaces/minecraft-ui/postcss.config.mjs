import path from "node:path";
import { existsSync } from "node:fs";

// Turbopack evaluates this config from a virtualized copy (import.meta.url and
// require.resolve both point at a .next/[project] mirror), so derive the styles
// search path from process.cwd() instead. During next build/dev the cwd is the
// monorepo root; running postcss-cli from the package dir it is the package root.
const stylesDir =
  [
    path.join(process.cwd(), "workspaces", "minecraft-ui", "src", "styles"),
    path.join(process.cwd(), "src", "styles"),
  ].find((dir) => existsSync(dir)) ?? path.join(process.cwd(), "src", "styles");

const config = {
  plugins: {
    "postcss-import": {
      path: [stylesDir],
    },
  },
};

export default config;
