# 1. 確保 Node version 正確

# 1. Ensure correct Node version

nvm use

# 2. 安裝 dependencies

# 2. Install dependencies

npm install

# 3. 啟動 Expo（最常用）

# 3. Start Expo (most common)

npm start
npx expo start -c

npx expo start --tunnel -c

npx expo start --tunnel --no-dev --minify -c

---

如果你之後只能用 ChatGPT（copy code）會唔會麻煩？
If you can only use ChatGPT (copy code) later, will it be troublesome?

答案係：唔會太麻煩，但建議你有一份「重點檔案索引」。
Answer: not too troublesome, but keep a list of key files.

你改動多數會落喺呢幾個檔案：
Most changes will be in these files:

UI
create.tsx
[id].tsx
[id].tsx
browse.tsx
joined.tsx
created.tsx

Domain / data
activities.ts
room_events.ts
auth.ts

Backend adapter
supabase_backend.ts

Realtime
room.ts
activities.ts

UI common
common.tsx

如果你以後用 ChatGPT 網頁版，只要 貼相關頁面 + backend adapter，就夠。
If you use ChatGPT web later, just paste the relevant screen(s) + backend adapter.
