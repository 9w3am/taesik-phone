// GitHub Pages 등에서 /editor 같은 경로로 바로 들어와도 열리도록 404.html을 복사
import { copyFileSync } from "node:fs";
copyFileSync("dist/index.html", "dist/404.html");
console.log("404.html 생성 완료");
