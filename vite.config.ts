import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { viteSingleFile } from "vite-plugin-singlefile";

// 일반 빌드: dist/ (정적 호스팅용)
// 단일 파일 빌드: npm run build:single → dist-single/index.html 하나로 전부 동작
export default defineConfig(({ mode }) => ({
  base: "./",
  plugins: [react(), tailwindcss(), ...(mode === "single" ? [viteSingleFile()] : [])],
  build: mode === "single" ? { outDir: "dist-single", assetsInlineLimit: 100000000 } : { outDir: "dist" },
}));
