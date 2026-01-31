# ChatGPT Brief (Minimal Context Pack)

# ChatGPT 簡介（最小上下文包）

This project is a React Native (Expo) app using expo-router and Supabase. It now has a thin backend adapter so UI/domain code does not import Supabase directly.
呢個專案係 React Native（Expo）app，用 expo-router + Supabase。已加咗薄 backend adapter，所以 UI/domain 唔會直接 import Supabase。

Use this file to quickly share the minimum set of files when working with ChatGPT (web) or other LLMs.
用呢份文件可以快速分享「最少需要嘅檔案」，方便用 ChatGPT（網頁版）或其他 LLM。

## Core idea

## 核心概念

- UI screens call domain or backend adapter functions.
- UI 畫面應該呼叫 domain 或 backend adapter functions。
- `lib/backend/supabase_backend.ts` is the only file that should talk to Supabase directly.
- `lib/backend/supabase_backend.ts` 係唯一可以直接接 Supabase 嘅檔。
- If you change backend later, swap the adapter implementation.
- 之後換 backend，只要換 adapter 實作。

## Minimum files to paste (most changes)

## 最少要貼嘅檔案（大多數改動）

Choose the smallest set that covers your change.
按你嘅改動，揀最少但足夠嘅檔案。

### Auth / Login / Settings

### Auth / Login / 設定

- app/login.tsx
- app/register.tsx
- app/(tabs)/settings.tsx
- lib/domain/auth.ts
- lib/backend/supabase_backend.ts

### Activities (Browse / Created / Joined)

### Activities（Browse / Created / Joined）

- app/(tabs)/browse.tsx
- app/(tabs)/created.tsx
- app/(tabs)/joined.tsx
- lib/domain/activities.ts
- lib/realtime/activities.ts
- lib/backend/supabase_backend.ts

### Create / Edit Invite

### Create / Edit Invite（建立／編輯邀請）

- app/create.tsx
- app/edit/[id].tsx
- components/InviteForm.tsx
- lib/domain/activities.ts
- lib/backend/supabase_backend.ts

### Room / Chat

### Room / Chat（房間／聊天）

- app/room/[id].tsx
- lib/domain/room_events.ts
- lib/repo/room_repo.ts
- lib/realtime/room.ts
- lib/backend/supabase_backend.ts

### Theme / UI

### Theme / UI（主題／UI）

- src/ui/theme/tokens.ts
- src/ui/theme/ThemeProvider.tsx
- src/ui/common.tsx

### i18n / Languages

### i18n / 語系

- lib/i18n/i18n.ts
- locales/en.json
- locales/zh-HK.json
- locales/ja.json

## When you change navigation behavior

## 修改導航行為時

- app/\_layout.tsx
- app/(tabs)/\_layout.tsx

## Notes

## 備註

- If a change touches data shape, also share .docs/SCHEMA.md.
- 如果改動到資料結構，記得一併提供 .docs/SCHEMA.md。
- Keep changes minimal and avoid direct Supabase imports outside the backend adapter.
- 盡量保持改動最少，唔好喺 adapter 以外直接用 Supabase。
