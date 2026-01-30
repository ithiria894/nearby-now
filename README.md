# nearby-now

## Setup

1. Use the right Node version

```
nvm use
```

2. Install dependencies

```
npm install
```

3. Start Expo

```
npm start
```

## Environment variables (.env)

These variables are read by Expo and also wired via `app.config.js` into
`expoConfig.extra`.

Required:

- `EXPO_PUBLIC_SUPABASE_URL` - your Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` - your Supabase anon/public key

Example:

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```
