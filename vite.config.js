import { defineConfig } from "vite";
import eslintPlugin from "vite-plugin-eslint";
import { svelte } from "@sveltejs/vite-plugin-svelte";

export default defineConfig({
  build: {
    emptyOutDir: true,
    lib: {
      entry: "app/Resources/assets/js/main.js",
      name: "WBDB",
      fileName: (format) => `worldbreakersdb.${format}.js`,
    },
    manifest: true,
    outDir: "web/dist",
  },
  plugins: [
    eslintPlugin({
      include: "app/Resources/assets/**/*.js",
    }),
    svelte({
      compilerOptions: {
        // customElement: true,
      },
    }),
  ],
});
