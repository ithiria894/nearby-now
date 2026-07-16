# Vibe system — design spec (research-grounded)

A second signal on a hangout, separate from the activity-**type** tag. Type says
**what** you'll do (Food / Music / Games — the existing keyword tags). Vibe says
**how it'll feel** — the energy / social texture. Two "dinner" hangouts can be
opposite vibes: a quiet deep-talk dinner vs a rowdy group crawl.

## Why it's worth building

Researched ~15 apps (see sources). Finding: **most apps that market a "vibe"
just relabel the activity tag and filter by distance** (VibeLink, Social Vibe,
Flock's topics). A true _energy / social-texture_ axis is **rare and mostly
unclaimed** — so it's genuinely differentiating. For a spontaneous, mood-driven
app it's the real hook: "I feel like something chill nearby right now" is the
whole point, and type tags can't answer it.

**The one trap:** if vibe isn't kept strictly orthogonal to activity, it
collapses back into the activity tag you already have. Guardrail below.

## Taxonomy — 5 core (cap at 6), two orthogonal poles + a default

| Vibe       | zh   | Meaning                                       |
| ---------- | ---- | --------------------------------------------- |
| 😌 Chill   | 放鬆 | low-key, relaxed, mellow                      |
| 🔥 Hype    | 熱鬧 | high-energy, loud, turn-up                    |
| 💬 Deep    | 深傾 | real, meaningful, connect                     |
| 🎲 Playful | 玩下 | silly, banter, light fun                      |
| 🧭 Open    | 隨意 | no agenda, go with the flow — **the default** |

Two independent axes: **Chill ↔ Hype** (energy level) and **Deep ↔ Playful**
(emotional register), plus **Open** as the default/escape hatch. This spans the
space with no overlap and stays under the choice-overload ceiling.

- Optional 6th 🎯 **Focus** (co-work / study / train) — but it leaks toward
  activity, so hold it back to keep the axis clean.
- **Orthogonality guardrail:** _if a vibe label only makes sense with one
  activity, it's an activity in disguise — cut it._ This is why we DON'T use
  "Party" (encodes Drinks) or "Active/Sport" (encodes the activity) as vibes —
  they double-count the type tags. "Games + Deep" = board-game heart-to-heart,
  "Food + Hype" = rowdy group dinner: every vibe × every type must be sensible.

## Mechanic (zero-friction)

1. **Pick, not inferred.** One-tap pill row on hangout creation. (222/Timeleft
   infer via a personality quiz — far too heavy for a zero-friction post.)
2. **Defaulted to Open, so it's never blank.** A user who just wants to post
   fast still ships a valid vibe. Kills the "optional field nobody sets" decay.
3. **Lives on the hangout, not the profile.** It expires with the hangout — no
   persistent "mood status" to go stale, no re-logging burden (>50% of users
   abandon repeated mood entry in the research).
4. **Colored pill on the card** — earns its keep as expectation-setting even for
   people who never filter (Partiful lesson: "chill coffee" vs "deep-talk
   coffee" are genuinely different plans).
5. **Soft filter chip in the feed, never a hard gate.** People who want "only
   chill nearby" can filter, but the default shows everything. **A hard vibe
   gate would fragment an already-thin local liquidity pool into near-empty
   buckets** — the opposite of what a spontaneous app needs. If we want more than
   a filter, _soft-boost / sort_ same-vibe rather than hide others.

## Data model (our side / backend)

- `activities.vibe text` — nullable, `CHECK (vibe IS NULL OR vibe IN
('chill','hype','deep','playful','open'))`. Same pattern as `gender_pref` /
  the type tags. Default handled app-side (Open) so a null still renders.
- Browse filter by vibe: client-side over the fetched feed (small lobbies) or a
  `.eq('vibe', …)` query param — same as the category filter.
- No new table, no RPC needed for v1.

## Division of labour

- **Friend (front-end):** the vibe pill row on create, the card chip, the feed
  filter chip / "what's your vibe now?" selector.
- **Us (backend/logic):** the `activities.vibe` column + CHECK migration, the
  filter query support, and locking the taxonomy above.

## Pitfalls this spec is built to avoid

- **Choice overload** — capped at 5 (Iyengar: 6 options 60% act, 24 options 30%).
- **Collapse into activity** — the orthogonality guardrail.
- **Stale/unset field** — ephemeral + defaulted.
- **Fragmentation** — soft filter, never a hard gate.
- **Decoration-masquerading-as-utility** — vibe must power the feed filter, not
  just sit on the card. Pick a lane and deliver it.

## Open decision (product call + user-test)

The exact 5 labels are a product decision. Run the same 5-second test as the
design direction: show target users the 5 vibes, ask "if you tapped Hype, what
do you expect?" — if answers diverge or two vibes feel the same, cut/rename.

## Sources

MOOD Social (intent-mood picker), 222 / Timeleft / Boo (inferred personality
matching), **Feeld** (Desires kept orthogonal to Interests — best model),
Partiful (aesthetic vibe as expectation-setting), VibeLink / Social Vibe (the
"vibe = activity" trap), social-battery apps (0–100% energy scale), Iyengar
choice-overload study, CHI 2025 mood-logging-burden study.
