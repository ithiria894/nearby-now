jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}));

jest.mock("expo-constants", () => ({
  expoConfig: { extra: {} },
}));

jest.mock("expo-localization", () => ({
  getLocales: () => [{ languageTag: "en" }],
}));
