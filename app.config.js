module.exports = ({ config }) => ({
  ...config,
  // Inject the Android Google Maps SDK key at config time so it stays out of
  // git. react-native-maps on Android renders a BLANK map without this key.
  // Provide it via env / EAS secret named GOOGLE_MAPS_API_KEY.
  android: {
    ...config.android,
    config: {
      ...(config.android && config.android.config),
      googleMaps: {
        apiKey: process.env.GOOGLE_MAPS_API_KEY,
      },
    },
  },
  extra: {
    ...config.extra,
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  },
});
