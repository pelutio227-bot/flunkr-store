import type { CapacitorConfig } from "@capacitor/cli";

// Store-Wrapper für Flunkr (Expo-Web-Export aus ~/Projects/glechno/apps/mobile/dist, Server flunkr.abooz.ch).
const config: CapacitorConfig = {
  appId: "com.pelutio.flunkr",
  appName: "Flunkr",
  webDir: "www",
  ios: { contentInset: "never", backgroundColor: "#120B1F", scrollEnabled: false },
  android: { backgroundColor: "#120B1F" },
  plugins: { Keyboard: { resize: "none" } },
};

export default config;
