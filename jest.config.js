module.exports = {
  preset: "jest-expo",
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@supabase/.*|@gorhom/.*|phosphor-react-native|react-native-url-polyfill)",
  ],
  setupFiles: ["./tests/setup.ts"],
  testPathIgnorePatterns: ["/node_modules/", "/components/legacy/"],
};
