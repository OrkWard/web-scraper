import { defineConfig } from "tsup";
import packageDefine from "./package.json";

export default defineConfig((config) => ({
  entry: ["src/index.ts"],
  env: {
    NODE_ENV: config.watch ? "development" : "production",
  },
  sourcemap: true,
  clean: true,
  format: "esm",
}));
