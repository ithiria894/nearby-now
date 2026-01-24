// metro.config.js
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// ✅ Prefer ESM "module" builds (fix supabase realtime-js resolution issues)
config.resolver.resolverMainFields = [
  "react-native",
  "browser",
  "module",
  "main",
];

// (Optional) some libs ship .cjs
config.resolver.sourceExts.push("cjs");

module.exports = config;
