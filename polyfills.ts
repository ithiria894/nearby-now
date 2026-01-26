// polyfills.ts

// 1) Force TextEncoder/TextDecoder onto globalThis (Hermes-friendly)
import { TextDecoder, TextEncoder } from "fast-text-encoding";

// :zap: CHANGE 1: Explicitly attach TextDecoder/TextEncoder to globalThis
if (typeof (globalThis as any).TextDecoder === "undefined") {
  (globalThis as any).TextDecoder = TextDecoder as any;
}
if (typeof (globalThis as any).TextEncoder === "undefined") {
  (globalThis as any).TextEncoder = TextEncoder as any;
}

// 2) URL / URLSearchParams polyfill (must come after TextDecoder is available)
import "react-native-url-polyfill/auto";
