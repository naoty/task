import { defineConfig } from "vite-plus";

export default defineConfig({
  staged: {
    "*": "vp check --fix",
  },
  lint: { options: { typeAware: true, typeCheck: true } },
  pack: {
    entry: ["src/cli/index.ts"],
    format: ["esm"],
    outDir: "dist",
    dts: false,
    platform: "node",
  },
});
