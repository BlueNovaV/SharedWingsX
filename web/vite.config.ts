import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  server: { port: 17323, strictPort: true, host: "127.0.0.1" },
  preview: { port: 17323, host: "127.0.0.1" },
});
