# Schema Notes (Nearby Now)

This is a lightweight reference for core tables, indexes, and relationships.
Source of truth is migrations + Supabase.

---

## Tables

### activities

- Purpose: Activity/invite posts
- PK: id (uuid)
- FK: creator_id -> auth.users(id)
- Notable fields: title_text, status, expires_at, place_name, place_address, lat, lng, created_at
- Indexes (core):
  - activities_status_created_id_idx (status, created_at desc, id desc)
  - activities_creator_created_id_idx (creator_id, created_at desc, id desc)

### activity_members

- Purpose: Join state for users in activities
- PK: (activity_id, user_id)
- FK: activity_id -> activities(id), user_id -> profiles(id)
- Notable fields: role, state, joined_at, left_at
- Indexes (core):
  - activity_members_user_state_idx (user_id, state)
  - activity_members_activity_idx (activity_id)

### room_events

- Purpose: Chat/system events inside a room
- PK: id (uuid)
- FK: activity_id -> activities(id), user_id -> profiles(id)
- Notable fields: type, content, created_at
- Indexes (core):
  - room_events_activity_created_id_idx (activity_id, created_at desc, id desc)

### profiles

- Purpose: Display name and profile data
- PK/FK: id -> auth.users(id)
- Notable fields: display_name, created_at, updated_at

---

## Relationships (high level)

- activities.creator_id -> auth.users.id
- activity_members.user_id -> profiles.id -> auth.users.id
- room_events.user_id -> profiles.id
- room_events.activity_id -> activities.id

---

## RLS / Policies

See:

- supabase/SchemaSnapshot/public_policies.sql

---

## Notes

- Migrations are the source of truth.
- Add new indexes via migrations only.
