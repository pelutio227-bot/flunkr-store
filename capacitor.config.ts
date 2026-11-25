import type { CapacitorConfig } from "@capacitor/cli";

// Store-Wrapper für Flunkr (Expo-Web-Export aus ~/Projects/flunkr/apps/mobile/dist, Server flunkr.abooz.ch).
const config: CapacitorConfig = {
  appId: "com.pelutio.flunkr",
  appName: "Flunkr",
  webDir: "www",
  ios: { contentInset: "never", backgroundColor: "#0B0B0F", scrollEnabled: false },
  android: { backgroundColor: "#0B0B0F" },
  // resize native: WebView schrumpft mit offener Tastatur, damit Eingabefelder + Knoepfe sichtbar bleiben
  // (mit "none" lag die Tastatur ueber dem Finten-Feld → neue Spieler brachen die Proberunde ab, 25.11.2026)
  plugins: { Keyboard: { resize: "native", resizeOnFullScreen: true } },
};

export default config;
