import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";

const configuredBase = process.env.BASE_PATH;
const base = configuredBase ? `${configuredBase.replace(/\/+$/, "")}/` : "./";

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [vue()],
  build: {
    chunkSizeWarningLimit: 700,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: "three",
              test: /node_modules[\\/]three/,
              priority: 20,
            },
            {
              name: "vue",
              test: /node_modules[\\/](vue|@vue)/,
              priority: 10,
            },
          ],
        },
      },
    },
  },
});
