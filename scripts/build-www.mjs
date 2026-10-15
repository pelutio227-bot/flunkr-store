// Kopiert den Expo-Web-Export (web/ im Repo, gebaut mit EXPO_PUBLIC_API_URL=https://flunkr.abooz.ch) nach www/ und hängt die Native-Bridge ein.
import { cpSync, rmSync, mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";
const SRC = process.env.FLUNKR_DIST ?? (existsSync("web") ? "web" : path.resolve("../glechno/apps/mobile/dist"));
if (!existsSync(path.join(SRC, "index.html"))) throw new Error("Web-Export fehlt: " + SRC);
rmSync("www", { recursive: true, force: true }); mkdirSync("www");
cpSync(SRC, "www", { recursive: true });
execSync("bun build src/native-bridge.ts --outfile www/native-bridge.js --target browser --minify", { stdio: "inherit" });
let html = readFileSync("www/index.html", "utf8");
html = html.replace(/<link rel="manifest"[^>]*>\s*/g, "");
html = html.replace(/<meta name="viewport"[^>]*>/, '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />');
html = html.replace("</head>", '<script src="/native-bridge.js"></script>\n</head>');
writeFileSync("www/index.html", html);
console.log("www/ gebaut aus", SRC);
