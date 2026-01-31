# Architecture (MVP Sweet Spot)

# 架構（MVP 甜蜜點）

This project is a React Native Expo app using expo-router. The architecture aims to be simple (MVP) but keeps a clear separation so future backend swaps are easier.
呢個專案係 React Native Expo app（用 expo-router）。架構目標係保持簡單（MVP），但要有清楚分層，方便將來換 backend。

## Layers

## 分層

### 1) UI (Screens + Components)

### 1) UI（畫面 + 元件）

Location:
位置：

- app/\*\* (screens)
- app/\*\*（畫面）
- components/\*\* (UI components)
- components/\*\*（UI 元件）

Responsibilities:
職責：

- Render UI
- 負責 UI 顯示
- Call domain or backend functions
- 呼叫 domain 或 backend functions
- Handle local UI state
- 處理本地 UI 狀態

Rules:
規則：

- Do not import Supabase directly.
- UI 唔可以直接 import Supabase。
- Prefer calling domain functions (lib/domain) or backend adapter (lib/backend).
- 優先用 domain（lib/domain）或 backend adapter（lib/backend）。

### 2) Domain / Data Functions

### 2) Domain / Data Functions（商業邏輯／資料操作）

Location:
位置：

- lib/domain/\*\*
- lib/domain/\*\*
- lib/repo/\*\* (thin repo wrappers)
- lib/repo/\*\*（薄的 repo 包裝）

Responsibilities:
職責：

- Encapsulate business rules and data operations
- 封裝業務規則同資料操作
- Keep UI simple
- 令 UI 保持簡單

Rules:
規則：

- Use backend adapter for data access
- 用 backend adapter 取數
- Avoid UI logic here
- 呢層避免 UI 邏輯

### 3) Backend Adapter

### 3) Backend Adapter（後端轉接層）

Location:
位置：

- lib/backend/supabase_backend.ts
- lib/backend/index.ts

Responsibilities:
職責：

- The only layer that talks to Supabase
- 唯一可以直接接 Supabase 嘅層
- Provide a stable API for domain/UI
- 提供穩定 API 俾 domain/UI 用

Rules:
規則：

- No UI logic here
- 呢度唔放 UI 邏輯
- Keep functions small and focused
- function 保持細同單一職責

### 4) Realtime

### 4) Realtime（即時）

Location:
位置：

- lib/realtime/\*\*

Responsibilities:
職責：

- Subscribe to realtime events
- 訂閱即時事件
- Expose cleanup/unsubscribe
- 提供 cleanup/unsubscribe

Rules:
規則：

- Use backend adapter where possible
- 儘量用 backend adapter
- No UI logic here
- 呢度唔放 UI 邏輯

### 5) Shared UI/Theme/i18n

### 5) Shared UI/Theme/i18n（共用 UI／主題／語系）

Location:
位置：

- src/ui/\*\*
- lib/i18n/\*\*
- locales/\*\*

Responsibilities:
職責：

- Common UI primitives
- 共用 UI 元件
- Theme + localization
- 主題同語系

## Current Backend Boundaries

## 目前 Backend 範圍

All Supabase usage is contained in:
所有 Supabase 使用都集中喺：

- lib/api/supabase.ts
- lib/backend/supabase_backend.ts

All other files should use:
其他檔案應該用：

- import { backend } from "../lib/backend" (path adjusted per file)
- import { backend } from "../lib/backend"（視路徑調整）

## Navigation

## 導航

- app/\_layout.tsx defines stack screens
- app/\_layout.tsx 定義 stack screens
- app/(tabs)/\_layout.tsx defines tab screens
- app/(tabs)/\_layout.tsx 定義 tab screens

Back button behavior:
返回按鈕行為：

- For stack screens (create/edit/room), a custom headerLeft handles back.
- stack 畫面（create/edit/room）用自訂 headerLeft 返回。

## MVP Guideline (Sweet Spot)

## MVP 指引（甜蜜點）

- Keep UI simple and fast to change
- UI 保持簡單、易改
- Keep domain functions small and reusable
- domain functions 小而可重用
- Avoid over-abstracting
- 避免過度抽象
- Only add new layers when they remove duplication or enable future swaps
- 只有當能減少重複或方便換 backend 時先加新層

## Where to Add New Features

## 新功能應該加喺邊

- New screen: app/\*\*
- 新畫面：app/\*\*
- New data operation: lib/domain/\*\* (and backend adapter if needed)
- 新資料操作：lib/domain/\*\*（需要時加 backend adapter）
- New realtime channel: lib/realtime/\*\*
- 新即時訂閱：lib/realtime/\*\*

## Quick Dependency Map

## 依賴關係快速圖

UI -> domain/repo -> backend adapter -> Supabase
UI -> realtime -> backend adapter -> Supabase

## Migration Plan (if moving off Supabase later)

## 之後搬離 Supabase 嘅計劃

1. Implement a new adapter file (e.g. lib/backend/api_backend.ts)
1. 新增一個 adapter 檔（例如 lib/backend/api_backend.ts）
1. Switch lib/backend/index.ts to export the new adapter
1. 將 lib/backend/index.ts 改成 export 新 adapter
1. Keep domain + UI unchanged
1. domain + UI 保持唔變
