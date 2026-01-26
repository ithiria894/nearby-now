// metro.config.js
const { getDefaultConfig } = require("expo/metro-config");
const { resolve } = require("metro-resolver");
const path = require("path");

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

const punycodePath = path.join(__dirname, "node_modules/punycode/punycode.js");

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === "punycode") {
    return {
      type: "sourceFile",
      filePath: punycodePath,
    };
  }
  return resolve(context, moduleName, platform);
};

module.exports = config;
