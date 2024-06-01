import { defineConfig } from "vite";
import { version } from "./package.json";

export default defineConfig({
  base: "/amber-light/",
  define: {
    "import.meta.env.__APP_VERSION__": JSON.stringify(version),
  },
});
