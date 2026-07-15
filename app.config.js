module.exports = ({ config }) => ({
  ...config,
  // Map is MapLibre + free OpenStreetMap tiles (no Google, no API key).
  extra: {
    ...config.extra,
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  },
});
