// metro.config.js
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);
const {
  resolver: { resolveRequest },
} = config;

// ✅ Prefer ESM "module" builds (fix supabase realtime-js resolution issues)
config.resolver.resolverMainFields = [
  "react-native",
  "browser",
  "module",
  "main",
];

// (Optional) some libs ship .cjs
config.resolver.sourceExts.push("cjs");

// Force CJS punycode to avoid ESM interop issues in URL polyfill.
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules ?? {}),
  punycode: path.join(__dirname, "node_modules/punycode/punycode.js"),
};

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === "punycode") {
    return {
      type: "sourceFile",
      filePath: path.join(__dirname, "node_modules/punycode/punycode.js"),
    };
  }
  return resolveRequest ? resolveRequest(context, moduleName, platform) : null;
};

module.exports = config;
