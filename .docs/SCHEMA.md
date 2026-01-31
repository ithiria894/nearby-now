# Schema Notes (Nearby Now)

# Schema 筆記（Nearby Now）

This is a lightweight reference for core tables, indexes, and relationships.
呢個係核心 tables、indexes、關係嘅輕量參考。
Source of truth is migrations + Supabase.
真正準確來源係 migrations + Supabase。

---

## Tables

## Tables（資料表）

### activities

- Purpose: Activity/invite posts
- 用途：活動／邀請貼文
- PK: id (uuid)
- 主鍵：id (uuid)
- FK: creator_id -> auth.users(id)
- 外鍵：creator_id -> auth.users(id)
- Notable fields: title_text, status, expires_at, place_name, place_address, lat, lng, created_at
- 重要欄位：title_text, status, expires_at, place_name, place_address, lat, lng, created_at
- Indexes (core):
- 主要索引：
  - activities_status_created_id_idx (status, created_at desc, id desc)
  - activities_creator_created_id_idx (creator_id, created_at desc, id desc)

### activity_members

- Purpose: Join state for users in activities
- 用途：使用者加入狀態
- PK: (activity_id, user_id)
- 主鍵：(activity_id, user_id)
- FK: activity_id -> activities(id), user_id -> profiles(id)
- 外鍵：activity_id -> activities(id), user_id -> profiles(id)
- Notable fields: role, state, joined_at, left_at
- 重要欄位：role, state, joined_at, left_at
- Indexes (core):
- 主要索引：
  - activity_members_user_state_idx (user_id, state)
  - activity_members_activity_idx (activity_id)

### room_events

- Purpose: Chat/system events inside a room
- 用途：房間內聊天／系統事件
- PK: id (uuid)
- 主鍵：id (uuid)
- FK: activity_id -> activities(id), user_id -> profiles(id)
- 外鍵：activity_id -> activities(id), user_id -> profiles(id)
- Notable fields: type, content, created_at
- 重要欄位：type, content, created_at
- Indexes (core):
- 主要索引：
  - room_events_activity_created_id_idx (activity_id, created_at desc, id desc)

### profiles

- Purpose: Display name and profile data
- 用途：顯示名稱與個人資料
- PK/FK: id -> auth.users(id)
- 主鍵/外鍵：id -> auth.users(id)
- Notable fields: display_name, created_at, updated_at
- 重要欄位：display_name, created_at, updated_at

---

## Relationships (high level)

## 關係（高層）

- activities.creator_id -> auth.users.id
- activities.creator_id -> auth.users.id
- activity_members.user_id -> profiles.id -> auth.users.id
- activity_members.user_id -> profiles.id -> auth.users.id
- room_events.user_id -> profiles.id
- room_events.user_id -> profiles.id
- room_events.activity_id -> activities.id
- room_events.activity_id -> activities.id

---

## RLS / Policies

## RLS / Policies

See:
詳見：

- supabase/SchemaSnapshot/public_policies.sql

---

## Notes

## 備註

- Migrations are the source of truth.
- Migrations 係唯一準確來源。
- Add new indexes via migrations only.
- 新增 index 只能用 migrations。
