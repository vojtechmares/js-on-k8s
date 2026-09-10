// Recipe: https://js-on-k8s.dev/recipes/container-images/tanstack-start
import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";
import viteReact from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [tanstackStart(), nitro({ preset: "node-server" }), viteReact()],
});
