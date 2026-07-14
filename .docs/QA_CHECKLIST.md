# NearbyNow — End-to-End QA Checklist

## Legend / how to run

- Run on a real Android phone, tapping through as a first-time user would. Work top to bottom; the order follows the real user journey (launch → sign up → login → browse → create → join → room → tabs → settings → edit/close → logout).
- `⭐` = core happy-path step. If any `⭐` fails, stop and file a blocker before continuing.
- Each item: **what to test** → _Steps_ → _Expected_ → _Edge cases_ → _Watch for_ (a known-risky area to probe).
- Two devices help for realtime/concurrency items (labelled "Device A / Device B").
- Re-run the whole "Edge cases to sweep" section (bottom) against the screens you touched.

---

## 1. Cold start / Splash / Shell

- [ ] ⭐ **Splash holds until fonts + i18n are ready, then reveals the first screen**
  - Steps: Force-quit from the recents tray. Tap the NearbyNow icon. Watch the native splash (location-pin + radar) until it auto-dismisses.
  - Expected: No white/black flash; splash stays up until Google fonts finish AND `initI18n()` resolves, then the correct first screen appears (Login when logged out, Browse when a session is restored).
  - Edge cases: Throttled network; first-ever launch offline (font assets not cached); backgrounding mid-splash then resuming.
  - Watch for: `hideAsync()` is gated on `(fontsLoaded||fontError) && i18nReady`. If `initI18n()` hangs (stuck fetch), `i18nReady` stays false and the app renders `null` forever — infinite splash with no timeout.

- [ ] **Header titles + all shell text localize (no raw i18n keys)**
  - Steps: Set device language to each supported locale (en / zh-HK / zh-CN / ja), cold-launch, visit Register, Create, Compose, Edit, Room and read each header title.
  - Expected: Titles resolve (`rootNav.login/register/create/editInvite/room`, `compose.navTitle`); never a literal dotted key.
  - Edge cases: Unsupported device locale falls back to default; a key missing from a bundle; switching device language while backgrounded.
  - Watch for: `initI18n()` failure is caught and still sets `i18nReady=true`, so with no translations loaded every header shows the raw key (`rootNav.room`).

- [ ] **Custom Google fonts load, with graceful fallback**
  - Steps: Cold-launch; inspect headings/brand marks (PatrickHand, Kalam, Inter, Nunito, Poppins, Montserrat, ShortStack, Caveat).
  - Expected: Text renders in the designed typefaces/weights.
  - Edge cases: First launch offline (assets not downloaded); partial font failure; low-storage eviction.
  - Watch for: On `fontError` the app still hides splash and renders in system font; custom-styled headings/handwriting marks silently mismatch the design and shift layout.

- [ ] **Cold start with no network (offline first-run)**
  - Steps: Enable airplane mode, cold-launch, wait through splash.
  - Expected: App boots past splash to Login/tabs; cached fonts + local i18n render; network areas show offline/empty states, not a hang.
  - Edge cases: First-ever offline launch (nothing cached); realtime channels can't connect; toggle airplane off mid-session.
  - Watch for: No "reconnecting" indicator from the shell; realtime subscriptions never open and there's no visible recovery.

---

## 2. Auth routing / guard

- [ ] ⭐ **Cold-start routing: first-time vs returning user**
  - Steps: New user, no session → cold-launch and note first settled screen. Then log in, force-quit, relaunch.
  - Expected: Logged-out user lands on **Login**; returning user with a valid session lands on **Browse** without seeing Login. Mechanics: `index.tsx` redirects `/` → `/(tabs)/browse`; `useAuthGuard` finds no session → `router.replace('/login')`.
  - Edge cases: Expired/invalid token; offline at launch; sign-out done on another device; deep-link into a protected route while logged out; rapid relaunch during session restore.
  - Watch for: (1) Flash of protected content — `index.tsx` goes straight to Browse and the guard only runs async post-mount, so an unauthenticated user briefly sees Browse before the bounce. (2) `useAuthGuard.ts:17` only `console.error`s a `getSession` failure and leaves session undefined, so an **offline returning user is falsely logged out**. (3) Dead code `const x = 1;` at `index.tsx:6`.

- [ ] **Guard: unauthenticated user hitting a protected route**
  - Steps: With no session (or after clearing token), deep-link/navigate to `/(tabs)/browse`.
  - Expected: `getSession` finds no user → `router.replace('/login')`.
  - Edge cases: Deep link straight to protected screen; offline `getSession` error treated as no-session; first render where `segments` is empty returns early.
  - Watch for: `useAuthGuard.ts:13` returns early when `segments.length===0`, so a protected screen can paint one frame before redirect.

- [ ] ⭐ **Guard: returning authed user stays in app**
  - Steps: Relaunch with a valid stored session; confirm you stay on Browse.
  - Expected: Guard finds a session → no redirect.
  - Edge cases: Expired token needing refresh; refresh in flight at launch; offline.
  - Watch for: Transient/offline `getSession` failure leaves session undefined → false logout (same root as above).

- [ ] **Guard: sign-out / session expiry mid-session**
  - Steps: On Browse, trigger sign-out or let the token expire.
  - Expected: `onAuthStateChange` fires → guard re-runs → no user → `router.replace('/login')`.
  - Edge cases: Expiry while deep in a room (unsaved draft); multiple rapid auth events; listener re-subscribes each effect run.
  - Watch for: Effect deps `[router, segments]` re-subscribe `onAuthStateChange` on every navigation; combined with guard also running on segment changes, an auth event can double-fire `router.replace` with no debounce.

- [ ] **Guard: already-authed user landing on /login is NOT forwarded**
  - Steps: While logged in, navigate to `/login` (back stack or stale deep link).
  - Expected (ideal): an authed user on an auth screen is forwarded into the app.
  - Watch for: There is no inverse rule — a logged-in user can sit on Login/Register and re-run `signInWithPassword`/`signUp`; no auto-forward to Browse. Login is `headerShown:false`, so there's no header back arrow to escape either.

---

## 3. Sign up (Register)

- [ ] **Register screen render + label/i18n bug**
  - Steps: From Login tap the create-account link. Read the label above Email and its placeholder; same for Password.
  - Expected: Field labels are distinct from the greyed placeholder text (as Login does).
  - Edge cases: Missing key renders raw key; locale switch; long strings overflow the card.
  - Watch for: `register.tsx:124/145` use `auth.register.emailPlaceholder`/`passwordPlaceholder` for the **labels**, so the label above the box and the placeholder inside show identical text (dedicated `emailLabel`/`passwordLabel` keys were never added).

- [ ] **Register — email field entry**
  - Steps: Tap Email, type an address.
  - Expected: Email keyboard, autoCapitalize off, verbatim text.
  - Edge cases: Leading/trailing spaces kept until submit-time trim; unicode local part; very long; paste; OS autofill.

- [ ] **Register — password field entry**
  - Steps: Tap Password, type.
  - Expected: Masked; no reveal toggle.
  - Edge cases: Can't reveal a new password to confirm; not trimmed; emoji/special chars count as UTF-16 units toward the 6-char rule; paste.

- [ ] ⭐ **Register — submit (sign up, happy path)**
  - Steps: New email + a 6+ char password → tap the sign-up button.
  - Expected: Button goes busy+disabled; `signUp` succeeds; with autoconfirm ON a session exists so `ensureProfile` creates the row + default display_name; success Alert; `router.replace('/login')`.
  - Edge cases: Confirmation ON → no session → `ensureProfile` throws and is swallowed; offline; concurrent double-tap.
  - Watch for: Even with a valid session, `register.tsx:53` ALWAYS replaces to `/login`, forcing a second manual login on the core sign-up path.

- [ ] **Register — empty / whitespace validation**
  - Steps: Leave Email and/or Password blank (or spaces only) → tap sign-up.
  - Expected: Missing Alert, no `signUp` call.
  - Edge cases: Email blank / password blank / whitespace-only.
  - Watch for: `register.tsx:21` uses `!password` (untrimmed) — a 6-space password passes both the empty check and the length≥6 check and is sent to Supabase.

- [ ] **Register — weak password (<6 chars)**
  - Steps: Valid email + 5-char password → tap sign-up.
  - Expected: Weak Alert, no `signUp` call.
  - Edge cases: Exactly 6 passes; empty fires "missing" not "weak"; emoji counts code units.
  - Watch for: Client rule is flat length≥6 and may not match Supabase policy → a client-passing password can still be rejected with a second, differently-worded error.

- [ ] **Register — duplicate email / backend error**
  - Steps: Already-registered email + valid password → tap sign-up.
  - Expected: Error Alert with backend message (or a misleading success under enumeration protection).
  - Watch for: Supabase often returns success-with-no-session for an existing email; `register.tsx:39` only throws on `error`, so a duplicate can fall through to the SUCCESS Alert + replace to `/login`, telling the user an account was created when it was not.

- [ ] ⭐ **Register — success Alert → replace to Login**
  - Steps: Complete a valid signup, observe the success Alert, tap OK.
  - Expected: Success Alert, then navigate to Login.
  - Watch for: `register.tsx:49-53` calls `Alert.alert` then immediately `router.replace('/login')` on the same tick (not on the OK callback), so the alert can appear over Login or race the transition.

- [ ] **Register — back-to-login link**
  - Steps: Tap the bottom back-to-login link.
  - Expected: `router.replace('/login')` returns to Login.
  - Watch for: Reached via `push` (login) but exits via `replace` → inconsistent back stack; link is tappable mid-submit.

---

## 4. Login

- [ ] **Login screen render / i18n / theme (headerless)**
  - Steps: On Login read the compass-rose logo, app name, subtitle, Email label+field, Password label+field, primary button, bottom create-account link. Confirm no top header bar.
  - Expected: All strings resolve via i18n; compass-rose renders; colors match active theme.
  - Edge cases: Missing key shows raw key; locale switch re-renders; dark vs light; long translations overflow; ShortStack font fails → fallback; RTL.
  - Watch for: Subtitle (`login.tsx:86`) and idle button label (`login.tsx:155`) share key `auth.login.submitIdle`, so button wording reads oddly as a subtitle. No header = no shell back button if a logged-in user is wrongly routed here.

- [ ] **Login — email field entry**
  - Steps: Tap Email, type.
  - Expected: Email keyboard, autoCapitalize off, verbatim.
  - Edge cases: Leading/trailing spaces kept until submit-time trim (`login.tsx:33`); unicode/emoji; long; paste; autofill.
  - Watch for: On-screen value keeps whitespace while only the outgoing request is trimmed — testers see a mismatch.

- [ ] **Login — password field entry**
  - Steps: Tap Password, type.
  - Expected: Masked; no reveal toggle.
  - Edge cases: Password NOT trimmed (intentional); long; paste; keystore autofill; special chars/emoji.
  - Watch for: No reveal toggle → a typo is invisible; only feedback is a failed login.

- [ ] ⭐ **Login — submit (happy path)**
  - Steps: Valid registered email + correct password → tap sign-in.
  - Expected: Button busy+disabled; `signInWithPassword` succeeds; `ensureProfile()` runs; `router.replace('/')` → index → Browse.
  - Edge cases: Returning user with existing profile; offline; double-tap; auth OK but network drops before `ensureProfile`.
  - Watch for: `login.tsx:39` awaits `ensureProfile()` with **no try/catch** (register wraps it, login does not). Any RLS/constraint/offline failure throws into the catch → error Alert and the `router.replace('/')` is SKIPPED, so the user is authenticated (session persisted) but stranded on Login.

- [ ] **Login — empty / whitespace validation**
  - Steps: Leave Email and/or Password blank (or spaces) → tap sign-in.
  - Expected: Missing Alert, no network call.
  - Watch for: `login.tsx:25` is `!email.trim() || !password` — email trimmed, password not, so a spaces-only password passes client validation and hits Supabase (confusing backend error instead of the local Alert).

- [ ] **Login — wrong credentials / error state**
  - Steps: Valid email + wrong password (or unregistered email) → tap sign-in, read Alert.
  - Expected: Error Alert with backend message.
  - Edge cases: Unregistered email; wrong password; malformed email; rate-limited; offline.
  - Watch for: `login.tsx:44` shows `_e?.message` verbatim — raw English/technical error regardless of locale, "Unknown error" if null.

- [ ] **Login — loading / submitting state**
  - Steps: Valid creds → tap, watch the button label while the request is in flight.
  - Expected: Label → `submitBusy`, disabled, no re-tap until resolved.
  - Watch for: `finally` calls `setSubmitting(false)` with no mounted-check (navigate away mid-request → "setState on unmounted" warning). No spinner, only a label swap, so on fast networks the busy state may be imperceptible.

- [ ] ⭐ **Login → Register navigation link**
  - Steps: Tap the bottom create-account link; then Android hardware back.
  - Expected: `router.push('/register')` opens Register; hardware back returns to Login.
  - Watch for: Plain Pressable with no disabled state — tappable during an in-flight sign-in; double-tap can stack two Register screens.

---

## 5. Browse — list

- [ ] ⭐ **Initial Browse load + auth gate**
  - Steps: Logged in, land on Browse (default tab). Observe full-screen "Loading…", then header/composer/card list.
  - Expected: Shows `common.loading` briefly, then logo/app-name, composer card, "What's happening" heading, area pill, and a list of joinable activities (open, not expired, not mine, not already joined).
  - Edge cases: No session → `requireUserId` throws → `/login`; zero activities → empty state; back into tab re-triggers `useFocusEffect` reload.
  - Watch for: `loadInitial`'s catch calls `router.replace('/login')` on ANY error (not just auth), so a transient network blip at startup logs the user out instead of showing retry. `loading` stays true until `finally`, so a hung `requireUserId` leaves the user on "Loading…" forever with no timeout.

- [ ] **Re-fetch on tab focus**
  - Steps: From Browse tap another tab, then back to Browse; watch the list refresh in place.
  - Expected: On every focus (after first load) list/joinedSet/memberships silently reload; no spinner.
  - Edge cases: Focus during first load is guarded/skipped; focus reload error alerts but keeps you on screen.
  - Watch for: No request cancellation — fast tab switching can land an older `getBrowsePage` after a newer one, showing stale/duplicated items.

- [ ] **Loading state render**
  - Steps: Cold-start on a slow connection; observe Browse before data.
  - Expected: Bare `<Screen>` with `common.loading` text.
  - Watch for: Plain unstyled text (no spinner/skeleton) looks frozen on a long load; combined with the no-timeout risk it can appear hung.

- [ ] ⭐ **Render activity list (FlatList of ActivityCard)**
  - Steps: Load Browse with several activities; scroll the cards.
  - Expected: Each card: inferred emoji, title (≤5 lines), a hint line (place · time · capacity ratio · gender · distance), a relative "posted" timestamp top-right, and a › affordance.
  - Edge cases: Null place/hint hides the hint block; null capacity omits segment; null joined_count shows "max cap"; bad `expires_at` → `common.unknown`; distance only after area filter; long title clamps to 5 lines.
  - Watch for: `buildPostHint` can return null → divider+hint disappear and card height jumps (inconsistent sizing). `timeLeftLabel` branches all return the same label, so "expiring soon" urgency is dead code.

- [ ] **Pull-to-refresh**
  - Steps: Pull down past the threshold, release.
  - Expected: Spinner; `loadInitial` re-runs; list/joinedSet reload; spinner clears.
  - Edge cases: Refresh mid-join; refresh error alerts and leaves list unchanged; offline pull → error alert.
  - Watch for: `onRefresh` uses a stale `t` (dep array omits it); bigger risk is refresh racing a concurrent focus reload with no cancellation.

- [ ] **Infinite scroll / load more (cursor pagination, PAGE_SIZE=30)**
  - Steps: With >30 activities, scroll near bottom (0.6 threshold); watch footer spinner and appended cards.
  - Expected: `loadingMore` footer; next page by cursor; rows merged/deduped by id, re-sorted `created_at desc, id`; cursor+hasMore updated.
  - Edge cases: `hasMore` false / already loading → early return; 0 rows → hasMore false + "noMore"; momentum fires repeatedly (guarded).
  - Watch for: Pagination is server-side over ALL activities but the radius filter is client-side — a page of 30 far-away items filters to ~0 visible, so `onEndReached` keeps firing empty pages until `hasMore` flips. Feels broken on tight radius / sparse areas.

- [ ] **Empty state — no area / area detecting**
  - Steps: Open Browse before location resolves (or with location unavailable).
  - Expected: When `areaLoading` or `currentArea` is null AND list empty → "area_detecting" text + a "choose area" PrimaryButton opening the area sheet.
  - Watch for: If IP lookup returns null (offline/blocked) and the user never grants location, the state reads "detecting…" forever; the only escape is the choose-area button, with no failure/retry copy.

- [ ] **Empty state — no activities in area**
  - Steps: Small radius (e.g. 5 km) in a sparse area; observe empty body.
  - Expected: "browse.empty" text + "empty_cta" PrimaryButton.
  - Watch for: The empty CTA pushes `'/create'` while the composer card pushes `'/compose'` — two different create routes; the empty CTA may hit a different/missing screen than the composer.

- [ ] **List footer — "no more" vs spinner**
  - Steps: Scroll to the very bottom of a fully-loaded list.
  - Expected: Fetching → spinner; `hasMore` false and list non-empty → centered "common.noMore"; else nothing.
  - Watch for: "noMore" is gated on `filteredItems.length>0`, so when the radius filter empties the list the footer shows neither "noMore" nor an empty CTA — ambiguous end-of-list.

- [ ] **Radius/area filter drops coordinate-less activities**
  - Steps: Have activities created without lat/lng; set an area; check whether they appear.
  - Expected: With a `currentArea`, items with null lat/lng are excluded; only in-radius items with valid coords show.
  - Edge cases: `currentArea` null → filter bypassed → coordinate-less items DO show; distance NaN/Infinity excluded; boundary exactly at radius.
  - Watch for: Any coordinate-less activity vanishes the moment an area is detected — a whole class of posts silently disappears between "detecting" (all shown) and "area set" (coord-less hidden).

- [ ] **i18n across the Browse surface**
  - Steps: Switch language; walk header, composer, area/search sheets, cards, alerts, empty/footer.
  - Expected: All copy resolves via `t(...)` for the active locale.
  - Watch for: The search sheet's "Filters" / "Filters will live here." are hardcoded English (never localize). Any missing `browse.*` key shows the raw key; count-based plurals must be defined per locale.

---

## 6. Location / Area sheet

- [ ] ⭐ **IP auto-detect area on mount**
  - Steps: Fresh install, open Browse; watch the pill go from "detecting…" to a city label.
  - Expected: `areaLoading=true`, `getIpLocation` resolves an approximate area, pill shows "<label> (approx)", `areaLoading=false`.
  - Edge cases: `getIpLocation` null (offline/blocked) → pill "area_unknown"/"detecting"; corrupted persisted recents/radius JSON caught and ignored; effect early-returns once area is set.
  - Watch for: Slow IP detect leaves the pill on "detecting" with no cap, gating the radius filter that decides what's visible.

- [ ] **Open area sheet from the location pill**
  - Steps: Tap the pill (area label + chevron) beside "What's happening".
  - Expected: Area BottomSheetModal at ~55% with current-area box, refresh, "use current location", search, radius chips, recents.
  - Edge cases: Long labels truncate; open while search sheet already open → two modals; pan-down/backdrop dismiss.
  - Watch for: Search + area modals have no mutual-exclusion — opening one over the other can stack/backdrop-conflict.

- [ ] **"Use current location" → device GPS permission**
  - Steps: Open area sheet, tap "use current location", respond to the OS prompt.
  - Expected: Granted → reverse-geocode to a label (fallback "area_nearby"), set exact area (approx:false), dismiss sheet.
  - Edge cases: Denied → IP fallback (approx); GPS on but no fix (indoors); `reverseGeocode` null → "area_nearby"; device-derived areas are NOT added to recents.
  - Watch for: `getCurrentPositionAsync` has no timeout/try-catch and `setAreaFromDevice` no catch — a stuck GPS fix leaves the promise pending, the sheet never dismisses, and the unhandled rejection can crash in dev.

- [ ] **Refresh area**
  - Steps: Open area sheet, tap refresh on the current-area row.
  - Expected: `areaLoading=true`; approx area → re-run IP; exact → re-run device GPS.
  - Watch for: Same GPS-hang risk; on the approx branch a null IP result silently leaves the stale area with no feedback that refresh failed.

- [ ] **Manual area search (Nominatim, debounced)**
  - Steps: Tap the search field, type a place (e.g. "Richmond"), wait ~350 ms.
  - Expected: After 350 ms `searchPlacesNominatim(query)` runs; "area_searching" while pending, then results (name + address).
  - Edge cases: Empty/whitespace query clears + shows recents; no matches → "area_no_results"; rapid typing clears prior timeout; offline / 429 rate-limit; non-latin query.
  - Watch for: The debounced fetch has try/FINALLY but **no catch** — a rejection (offline / Nominatim 429) leaves results silently empty, indistinguishable from "no results".

- [ ] **Select a searched place → set area**
  - Steps: Search, tap a result row.
  - Expected: `selectArea` sets `currentArea` (approx:false), clears query, dismisses sheet, prepends to recents (dedupe by label, cap 5); list re-filters.
  - Edge cases: Duplicate label moved to front; malformed lat/lng drops all items; recents persisted.
  - Watch for: Selecting a distant area updates the LIST filter but the map's `INITIAL_REGION` is hardcoded Vancouver — switch to map after picking Toronto and you see an empty Vancouver map. List and map disagree.

- [ ] **Radius chip selection (5/10/20/30/50 km) + persistence**
  - Steps: Open area sheet, tap a km chip (e.g. 10 km).
  - Expected: `setRadiusKm`; active chip highlighted; value label updates; `filteredItems` recomputes; radius persisted.
  - Edge cases: Tiny radius empties list → empty CTA; radius change while area null → no effect; persisted radius restored (validated finite & >0).
  - Watch for: Radius filters only the already-paginated in-memory items — widening 5→50 km can still show few results because far pages were never fetched.

- [ ] **Recent areas list select**
  - Steps: With recents populated, open the sheet (empty search), tap a recent row.
  - Expected: `selectArea` sets area, re-prepends, dismisses.
  - Edge cases: No recents → section hidden; corrupted lat/lng/label filtered on load; approx flag shows "(approx)".
  - Watch for: Dedupe in `selectArea` is by label only, so two distinct places sharing a label (e.g. "Chinatown") can shadow each other.

- [ ] **Clear area search field**
  - Steps: Type in search, tap the close-circle icon.
  - Expected: Query cleared; icon flips close-circle → chevron-down; results clear; recents return.
  - Watch for: A request dispatched before clearing can resolve after and set stale matches (no request-id guard).

---

## 7. Search sheet (known non-functional)

- [ ] **Open search sheet (top-right magnifier)**
  - Steps: Tap the circular search button in the header top-right.
  - Expected: Search BottomSheetModal (35%/70%) with a title, text field, clear button, "Filters" section.
  - Watch for: Opens fine but leads to a dead feature (below).

- [ ] **Search text input + clear (NON-FUNCTIONAL)**
  - Steps: Type a query; observe the list behind the sheet; tap close-circle to clear.
  - Expected (user): the browse list filters by the query.
  - Watch for: `searchText` is captured but NEVER used to filter `filteredItems` (area/items/radius only). Typing does nothing — a tester will file "search broken".

- [ ] **"Filters" placeholder section**
  - Steps: Scroll to the "Filters" heading.
  - Watch for: Hardcoded English "Filters" / "Filters will live here." (bypasses i18n) and the feature is unimplemented.

---

## 8. Browse — map

- [ ] **Toggle List ↔ Map (floating center pill)**
  - Steps: Tap the floating pill (map icon); view the map; tap again (list icon) to return.
  - Expected: Keyboard dismisses; `viewMode` toggles; map shows pins for in-area activities; back restores the list (scroll resets).
  - Edge cases: Toggle while area still detecting; toggle preserves joinedSet/items; rapid toggling; toggle while a join Alert is open.
  - Watch for: Switching to map unmounts the FlatList (loses scroll) and the map always recentres on Vancouver regardless of selected area.

- [ ] **Render markers (mappable filter)**
  - Steps: Switch to map, observe indigo pins on OSM tiles.
  - Expected: Only items with finite lat & lng become MapMarkers; others dropped.
  - Edge cases: Null coords → no pin (silently missing vs list); many overlapping pins (no clustering); items outside Vancouver viewport render off-screen (no auto-fit); OSM tiles fail offline → grey map.
  - Watch for: Fixed Vancouver camera + no fit-to-markers means pins for a non-Vancouver area render off-screen, so the map looks empty even though the count pill says N>0.

- [ ] **Tap a map marker → join/detail**
  - Steps: Tap an indigo pin.
  - Expected: `onMarkerPress(id)` → find activity → detailed join Alert (map branch).
  - Edge cases: Marker id not found (removed by realtime) → no-op; already-joined pin routes straight to `/room`; small 18px target (hitSlop 10) → mis-taps.
  - Watch for: 18px pin + overlapping pins make it easy to tap the wrong activity; a just-filtered-out marker silently does nothing.

- [ ] **"Count in area" pill**
  - Steps: In map view read the bottom "N in area" pill.
  - Expected: Shows `markers.length` (mappable count) via i18n count interpolation.
  - Watch for: Map count = valid-coord items, but the LIST can include coordinate-less items when `currentArea` is null, so the two views can legitimately differ — confusing when cross-checking.

- [ ] **"Back to list" from inside map (DEAD prop)**
  - Steps: Enter map, look for a map-rendered "go to list" control.
  - Watch for: `BrowseMap` passes `onRequestList` into AppMap but `MapView.native.tsx` never uses it — dead on native. On web the only back-to-list affordance may be missing entirely, stranding web users in map view.

---

## 9. Create — entry points

- [ ] ⭐ **Composer card tap → open Compose**
  - Steps: On Browse tap the large composer card ("What do you feel like doing?").
  - Expected: `router.push('/compose')` opens the quick composer.
  - Edge cases: Double-tap; tap while keyboard open; back triggers focus reload.
  - Watch for: No debounce → fast double tap stacks two compose screens. Route inconsistency: composer → `/compose`, empty-state CTA → `/create`.

- [ ] **Rotating composer hints**
  - Steps: Sit on Browse; watch the pill placeholder change every ~3.2 s.
  - Expected: 5 hints cycle every 3200 ms, wrapping.
  - Edge cases: 1 hint → interval skipped; index reset after i18n change; unmount clears interval.
  - Watch for: A missing hint key flashes the raw key on rotation.

- [ ] ⭐ **Open Create from bottom tab-bar center (＋/pencil-box) button**
  - Steps: Tap the raised center create button in the bottom tab bar.
  - Expected: "Create an invite" form opens.
  - Edge cases: Double-tap double-pushes; back returns to the previously-active tab; not-signed-in state.
  - Watch for: `_layout.tsx:14` always `router.push('/create')` with no mount auth guard; a missing session only fails at submit inside `requireUserId()` with a raw "Not authenticated".

- [ ] **Header ＋ Create button (BROKEN)**
  - Steps: On Feed/Lobby/Created look for a ＋ in the top-right header; tap it.
  - Expected: ＋ visible and pushes `/create`.
  - Watch for: `screenOptions` sets `headerShown:false`, so NO header renders and the `headerRight` ＋ never appears. The primary create entry is dead; users with existing data can only reach Create via the Created-tab empty-state CTA.

- [ ] **Open Create from Browse empty-state CTA**
  - Steps: On Feed with 0 joinable lobbies, see "No joinable lobbies right now." → tap "Create an invite".
  - Expected: Pushes `/create`.
  - Watch for: Empty state can flash transiently before data loads, letting a user tap Create when lobbies actually exist.

---

## 10. Create — full invite form

- [ ] ⭐ **Submit minimal invite (Title only)**
  - Steps: Tap Title, type "Board games tonight", leave everything else, tap "Post now".
  - Expected: Activity inserted (title_text, status "open", lat/lng/place null); creator auto-joined; `router.replace` to the Created tab showing the new invite.
  - Edge cases: Empty/whitespace title → inline "Title is required."; very long title (no cap); emoji/RTL; double-tap; offline → "Create failed".
  - Watch for: `create.tsx:41-54` has NO transaction — `createActivity` succeeds then `upsertActivityMember` can fail (RLS/network), leaving an orphaned activity with no creator-member; re-tapping Post creates a SECOND activity.

- [ ] ⭐ **Auto-join creator as member**
  - Steps: Create any invite, go to Created tab, open its room, confirm you're already a member (can chat, no join prompt).
  - Expected: `upsertActivityMember` inserts `{role:'creator', state:'joined'}`.
  - Watch for: RLS `members_insert_self_open_only` re-checks status='open' AND expires_at>now(); clock skew or a race can reject the auto-join and throw "Create failed" even though the row was created.

- [ ] ⭐ **Post-create navigation to Created tab**
  - Steps: Submit a valid invite; observe the transition.
  - Expected: `router.replace('/(tabs)/created')`; Created shows the new invite at top; back does not reopen the form.
  - Watch for: No explicit refetch is triggered; if Created was already mounted, the new invite may be missing until pull-to-refresh.

- [ ] **Create failure error alert**
  - Steps: Airplane mode (or dead Supabase URL), fill a Title, tap "Post now".
  - Expected: "Create failed" Alert with message; submitting clears so the button re-enables.
  - Watch for: `e?.message` is often opaque ("row-level security…" / "Network request failed") and can't distinguish a true failure from the partial-create-then-join-fail ghost row.

- [ ] **Summary status card (live recap)**
  - Steps: Note the top card "Optional details"; add place/time/capacity/gender/expiry and watch chips appear.
  - Expected: Chips for place (selected OR manual OR raw query), non-empty start time, non-null capacity, gender≠any, expiry≠default.
  - Watch for: The Place chip is driven by `placeQuery.trim()` (`InviteForm.tsx:387`), so a half-typed, unselected search string claims a place was added even though only a text label (no coordinates) will be saved.

- [ ] ⭐ **Title field + required validation**
  - Steps: Leave Title empty → "Post now" → see red "Title is required."; type a title → submit.
  - Expected: `didSubmit` gates the error; empty/whitespace blocks; trimmed title clears the error.
  - Watch for: Validation is submit-time only (no live feedback) and there's no length cap → pathologically long titles hit the NOT NULL column and break card/room layout.

- [ ] **Place search (Nominatim autocomplete)**
  - Steps: In the Place card tap "Search place", type 1-2 letters (nothing), then 3+ (e.g. "Stanley Park"), wait ~0.5 s.
  - Expected: <3 chars no search; ≥3 chars → 500 ms-debounced Nominatim, up to 8 candidates (name + address).
  - Edge cases: Rapid typing cancels prior timers (searchIdRef); offline/429 → []; no matches → "No results yet."; special chars/non-latin.
  - Watch for: `places.ts:30` returns [] on any non-2xx, so a shared-IP 429/403 silently shows "No results yet." for valid places — the most common real break here.

- [ ] **Select a place candidate**
  - Steps: Search, tap a result row.
  - Expected: `selectedPlace` set (placeId/name/address/lat/lng, source "nominatim"); candidates cleared; search box shows the name. On submit, place_name/address/lat/lng/place_id/location_source saved and the invite appears on the map.
  - Edge cases: Candidates without lat/lng filtered out; re-editing the box clears the selection; retyping the same name is guarded.
  - Watch for: `onChangePlaceQuery` clears `selectedPlace` whenever trimmed text ≠ name (`InviteForm.tsx:206`); a stray keystroke/autocorrect silently drops the chosen coordinates and posts a text-only place.

- [ ] **"Not decided yet" place-skip + "Clear selection"**
  - Steps: Tap "Not decided yet"; separately select a place and tap "Clear selection".
  - Expected: Both reset selectedPlace/placeQuery/candidates/manualPlace; the invite saves with no place.
  - Watch for: Two visually different controls call the same `onClearSelection`; a tester expecting "Not decided yet" to only skip (keep typed text) finds it wipes the manual label and query too.

- [ ] **Custom place label (manual text)**
  - Steps: In "Custom place label" type e.g. "My apartment lobby", do NOT select a search result, submit.
  - Expected: With no selection, `manualPlace` (or raw `placeQuery`) saves as place_text, source "manual", null lat/lng (no map pin).
  - Watch for: Precedence in `handleSubmit` (`InviteForm.tsx:298-305`) silently discards `manualPlace` when a `selectedPlace` exists — a user who both picked a result and typed a label loses the label with no warning.

- [ ] **Quick-time chips (Tonight / Later today / This week / Next few days)**
  - Steps: Tap "Tonight" (today 20:00); try the others and watch the Start time value change.
  - Expected: Each chip writes a "YYYY-MM-DD HH:mm" start time; End time untouched.
  - Edge cases: Chips overwrite a manually typed start with no confirm; no active-selected state.
  - Watch for: No past-time guard anywhere (only end<start is validated). "Tonight" after 8 pm — or any manual past time — creates an invite whose start_time is already elapsed, silently.

- [ ] **Start time text input + format validation**
  - Steps: Tap Start time, type "2026-13-40 99:99", "Post now", read "Use YYYY-MM-DD HH:mm."
  - Expected: Empty is valid (null); zero-padded shape or with seconds accepted; invalid → format error blocks submit.
  - Watch for: The regex only normalizes the exact zero-padded shape; other strings fall through to `new Date(normalized)` (engine-dependent), so some "looks-valid" inputs get silently accepted/misparsed instead of rejected.

- [ ] **End time input + optional + range validation**
  - Steps: Set Start via a chip, type an End earlier than start (20:00 / 19:00), "Post now", read "End time must be after start time."
  - Expected: End optional; if both parse and end<start → range error blocks.
  - Watch for: `timeRangeError` is suppressed whenever either field has a format error (`InviteForm.tsx:245`); after fixing a malformed start the user can be surprised by a second round-trip range error.

- [ ] **"More options" / "Hide extra options" toggle**
  - Steps: Note capacity/gender/expiry hidden by default; tap "More options" to reveal; collapse again.
  - Expected: Toggles the three advanced cards; collapsing does NOT reset chosen values.
  - Watch for: In EDIT mode a creator sees the collapsed form and may not realize a previously-set capacity/gender is still applied.

- [ ] **Capacity presets (2-3 / 3-4 / 5+ / Any)**
  - Steps: Under "More options" tap a capacity preset.
  - Expected: Stores 3/4/6/null; selected chip full opacity; saved on submit.
  - Watch for: The "Capacity must be an integer of 1 or more." error path is unreachable from the preset-only UI (untested dead code); only an `initialValues.capacity < 1` loaded in edit mode would hit it and block saving.

- [ ] **Gender preference (any / female / male)**
  - Steps: Under "More options" tap female, male, then any.
  - Expected: `setGenderPref` updates; saved on submit (default "any"); selected full opacity.
  - Watch for: No non-binary/other option; `gender_pref` has NO DB CHECK constraint, so correctness relies entirely on the client enum.

- [ ] **Expiry selector (Default / 30m / 1h / 2h / 4h / 8h / Never)**
  - Steps: Tap "1h" (hint "Expires…"), "Never" ("will not expire"), "Default" ("Default is 30 days").
  - Expected: Default → omit expires_at (server 30-day); preset → now+minutes ISO; Never → null.
  - Watch for: In EDIT, "Default" deliberately does NOT resend expires_at, so a user expecting "Default" to reset a previously-Never invite to 30 days is silently no-op'd. A 30m expiry blocks later joiners via RLS.

- [ ] ⭐ **Submit button states (submitting / disabled)**
  - Steps: Fill a title, tap "Post now", watch the label → "Submitting…" (0.6 opacity), confirm no second tap.
  - Expected: `disabled=submitting` prevents a second tap; re-enables on error.
  - Watch for: Unlike compose, the button is NOT disabled on empty title (only submit-time validation blocks), so it always looks tappable; combined with no rollback, a fast double-tap before `submitting` flips can fire two creates.

---

## 11. Compose (Quick Post)

- [ ] ⭐ **Open Compose (Quick Post) from the Feed composer**
  - Steps: On Feed tap "What do you feel like doing?"; confirm "Post a quick invite" opens (sparkles header, template chips, big text box, area chip, "Post to lobby").
  - Expected: `/compose` opens; back returns to Feed.
  - Watch for: Two parallel create UIs (compose vs create) both insert into `activities` and auto-join — compose saves only title+lat/lng+location_source, omitting gender_pref/capacity/expiry (they fall to DB defaults), so quick vs full posts have subtly different shapes.

- [ ] **Template chips fill the text box**
  - Steps: Under "Quick templates" tap e.g. "Anyone up for a board game tonight?"; tap a different template.
  - Expected: `setText(tpl)` replaces the box content.
  - Watch for: Full overwrite (`compose.tsx:335`) — a user who typed a custom line then taps a template loses their text entirely.

- [ ] ⭐ **Main multiline invite text input**
  - Steps: Tap the big box, type a one-line invite; confirm "Post to lobby" un-dims.
  - Expected: `text` drives submit-enabled; on submit `title_text = text.trim()`.
  - Edge cases: Whitespace-only keeps the button disabled; very long/newlines stored as title_text; keyboard avoidance.
  - Watch for: The whole quick post becomes the title with no length/newline sanitation — a pasted paragraph becomes an unwieldy title that breaks feed cards and the room header.

- [ ] **Area chip opens area sheet + loads suggested (IP) area**
  - Steps: Tap the area chip under "This post will go to" (shows "Choose area"); watch "Finding your area…" then the sheet "Choose your area".
  - Expected: `loadSuggestedArea` fetches IP location (ipapi.co) if no area yet, then the area sheet presents.
  - Watch for: ipapi.co is a rate-limited free third-party; on failure `currentArea` stays null and, because posting is gated on an area, the user is funnelled back into the sheet each time.

- [ ] **Area sheet "Use my current location" (device GPS)**
  - Steps: Open the area sheet, tap "Use my current location", grant permission.
  - Expected: `requestDeviceLocation` prompts; granted → reverse-geocode to a label (or "Nearby"), source "device", added to recents; denied → IP fallback (approx).
  - Watch for: On native, a previously-denied user gets no re-prompt, so the button silently yields only coarse IP area with no explanation.

- [ ] **Area sheet manual search + clear/chevron**
  - Steps: Under "Choose area manually" type a city, watch "Searching…" then results; tap the round X to clear.
  - Expected: 350 ms debounce → `searchPlacesNominatim`; non-empty query shows close-circle (clears), empty shows chevron-down.
  - Watch for: Same Nominatim 429 risk — "No results yet" for valid cities can strand a user who can't grant GPS and can't find their city, so they can't set an area and can't post.

- [ ] **Area sheet select a searched place / recent areas**
  - Steps: Search a city, tap a result; reopen with empty search, tap a "Recent areas" entry.
  - Expected: `selectArea` sets area (source "manual"), clears query, dismisses, unshifts into recents (max 5, dedupe by label); recents render only when search is empty.
  - Edge cases: >5 trims oldest; corrupted AsyncStorage JSON silently dropped; empty + no-recents shows nothing below the search.
  - Watch for: Dedupe by label string only (`compose.tsx:175`); shared storage key `browse.recentAreas.v1` means Feed and Compose can overwrite each other's recents. A malformed recents blob makes recents vanish with no indication.

- [ ] ⭐ **"Post to lobby" — area gating + create + auto-join**
  - Steps: Type a line, WITHOUT an area tap "Post to lobby" (area sheet opens instead of posting), set/confirm an area, tap "Post to lobby" AGAIN to actually post.
  - Expected: First tap with no area loads a suggestion + opens the sheet (no insert); with an area → insert activity + auto-join creator + present success sheet.
  - Edge cases: Button disabled when text empty/submitting; two-tap requirement is non-obvious; offline → "Post failed".
  - Watch for: `compose.tsx:226-231` captures `area=currentArea` up top; if both device GPS and ipapi.co fail, `currentArea` never sets and EVERY tap just re-opens the sheet — quick posting becomes impossible even though createActivity accepts null lat/lng.

- [ ] **Success sheet ("Posted to the lobby") + randomized line**
  - Steps: Post successfully; read the bottom sheet with a random encouraging line + guidance + two buttons.
  - Expected: `successSheetRef` presents; `successLine` random pick of 5 i18n lines.
  - Watch for: Any of the 5 lines missing in zh-HK/zh-CN/ja falls back to English → mixed-language sheet.

- [ ] **Success sheet "I'll wait for replies" → Feed**
  - Steps: Tap "I'll wait for replies".
  - Expected: Sheet dismiss + `router.replace('/(tabs)/browse')`.
  - Watch for: No explicit refetch — the new post may not appear until manual pull-to-refresh if Feed was already mounted.

- [ ] **Success sheet "Add details (optional)" → Edit**
  - Steps: Tap "Add details (optional)".
  - Expected: If `createdId` set → dismiss + `router.push('/edit/'+createdId)`; the edit screen loads prefilled.
  - Watch for: After Edit → Back, you return to compose with `text` and `createdId` still populated; tapping "Post to lobby" again creates a DUPLICATE activity because compose never clears its state.

- [ ] **Success sheet swipe-to-close (duplicate-post risk)**
  - Steps: Post, then swipe the success sheet down instead of tapping a button; you remain on compose with text intact; tap "Post to lobby" again.
  - Watch for: `compose.tsx` never resets `text`/`createdId` after success and the sheet is pan-down dismissible, so dismiss-then-resubmit inserts a second identical activity and auto-joins it — a straightforward duplicate-creation bug.

- [ ] **Compose failure error alert**
  - Steps: Offline (or break auth), with an area + text, tap "Post to lobby".
  - Expected: "Post failed" Alert; submitting clears.
  - Watch for: Same no-transaction pattern as create — createActivity success + join failure surfaces "Post failed" while leaving an orphaned activity; retry duplicates it.

---

## 12. Activity card interactions / Join

- [ ] ⭐ **Tap a card → join confirmation (list mode)**
  - Steps: In list view tap a card body (not the › and not a long-press); read the "Join this?" Alert with the title; tap "Join".
  - Expected: On Join → `joinActivity(id,userId)`, add to joinedSet, remove card from items, `router.push('/room/<id>')`.
  - Edge cases: Cancel keeps the card; `!userId` (pre-load race) → silent no-op; already-joined → skip alert, go straight to `/room`; join fails (full/closed/network) → error alert, card NOT removed; long-press vs tap (280 ms guard).
  - Watch for: A realtime UPDATE for the just-joined activity can re-add it to the list because `isJoinableActivity` ignores `joinedSet`.

- [ ] **Tap a card → detailed join confirmation (map mode)**
  - Steps: In map view tap a pin/card for an un-joined activity; read the multi-line Alert (goal, place, address, gender, capacity, expires); tap "Join".
  - Expected: Map-branch Alert built from formatters; Join runs the same confirm path.
  - Edge cases: Missing place → "place_none"; no address line omitted; null capacity/gender → formatter fallbacks; invalid expires_at → formatter fallback.
  - Watch for: A malformed `expires_at` could render "Invalid Date"-style text if `formatLocalDateTime` isn't defensive.

- [ ] ⭐ **Open room for an already-joined activity**
  - Steps: Tap a card/pin you already joined (appears via realtime re-add or map).
  - Expected: `joinedSet.has(id)` → `router.push('/room/<id>')` directly, no alert.
  - Watch for: This branch should rarely fire in Browse (joined items are removed), so it's a symptom of the realtime re-add bug — non-destructive but wrong.

- [ ] **Tap the › / people affordance**
  - Steps: Tap the small people icon + › at bottom-right of a card.
  - Expected: `stopPropagation` then same join/room flow.
  - Watch for: The inner › Pressable is NOT gated by `isJoining` (only the outer card is disabled), so during an in-flight join a › tap can fire a second join/alert.

- [ ] **Long-press card → context menu modal**
  - Steps: Press-hold a card ~280 ms; the bottom-sheet menu slides up.
  - Expected: `didLongPressRef=true`; menu with options by creator status; the release tap is swallowed (not treated as a card tap).
  - Edge cases: Long-press then tap outside closes; hardware back closes; long-press while joining won't open.
  - Watch for: `didLongPressRef` resets only in `onPressOut`'s spring callback; an interrupted gesture can leave it stuck true so the NEXT tap is swallowed as a phantom long-press.

- [ ] **Menu: Edit (creator only — dead path in Browse)**
  - Steps: (If a self-authored card ever appears) long-press it, tap "Edit".
  - Expected: If creator → `router.push('/edit/<id>')`.
  - Watch for: `getBrowsePage` excludes your own activities, so a creator's card (and Edit + edit-pencil badge) never renders in Browse — unreachable code here (test it from the Created tab).

- [ ] **Menu: Delete / Share / Report (NOT IMPLEMENTED)**
  - Steps: Long-press, tap "Share" (or "Report", or "Delete" if creator).
  - Expected (user): the action happens.
  - Watch for: All three call `notImplemented()` → a "not implemented" alert. Report as a no-op is a real trust-and-safety gap for a meet-strangers app.

- [ ] **Menu: Cancel / backdrop dismiss**
  - Steps: Open the menu, tap "Cancel" or the dimmed area.
  - Expected: `menuOpen=false`; modal fades; no navigation.
  - Watch for: Main concern is the `didLongPressRef` reset timing interacting with an immediate follow-up tap.

- [ ] **Activity icon inference**
  - Steps: Observe emoji on cards titled "Karaoke tonight", "打羽毛球", "hotpot dinner".
  - Expected: Keyword match → 🎤/🎲/🏸/🍲/☕️/🎬, else 🎯.
  - Watch for: Naive substring match mis-icons (e.g. "coffee" as a metaphor → ☕️) — cosmetic but visible.

- [ ] **Relative timestamps + expiry label**
  - Steps: Observe top-right "posted X ago" and the hint time segment on cards of varying age.
  - Expected: now/m/h/yesterday/d buckets; time window (tonight/later/week/next) from start_time; expiry via `formatExpiryLabel`.
  - Edge cases: created_at null → "time_now"; invalid → "common.unknown"; past start_time → no chip; device-tz vs stored-UTC; clock skew → future "posted".
  - Watch for: `timeLeftLabel` branches all return the same label (expiry urgency is dead code); tz handling of expires_at/start_time is a classic tonight/later break.

---

## 13. Room — open / membership

- [ ] ⭐ **Initial room load + auth gate (loadAll)**
  - Steps: From Browse tap a card to open its room; observe header title, member count, chat area while loading.
  - Expected: `requireUserId()` resolves user, then activity/members/my-membership/first page of messages load; header shows real title/place; a member sees chat auto-scrolled to newest.
  - Edge cases: Not logged in / expired → "Auth required" → `/login`; invalid/deleted id; first-time user with no display_name; returning member re-opening.
  - Watch for: On a network error `loadAll` only `console.error`s and `setActivity(null)`, so the user sees fallback title "Room", "Members 0" and a wrong "Join lobby" button with NO error/spinner. `requireUserId()` throwing on a transient (non-auth) error wrongly bounces to `/login`.

- [ ] **First-paint button flicker (Join vs Leave)**
  - Steps: Open a room you're ALREADY in; watch the top-right button in the first moment.
  - Expected: Immediately "Leave" for a joined member.
  - Watch for: Two sources of truth — the Join/Leave button uses `joined` (from members[]) while the input/quick-chips use `myMembershipState` (a separate call). Before both resolve, a joined member briefly sees "Join lobby" + "Members 0", and the two can stay disagreed.

- [ ] ⭐ **Join lobby (join → confirm → joinWithSystemMessage)**
  - Steps: Open a room you haven't joined, tap "Join lobby", in "Join this lobby?" tap "Join lobby".
  - Expected: "joined" membership upserted; "{name} joined the lobby" system message posts; `loadAll` re-runs; chat visible + scrolled to bottom; input auto-focuses.
  - Edge cases: Cancel = no-op; room closed/expired between open and tap; capacity full; gender mismatch; offline; double-tap / concurrent join from two devices.
  - Watch for: Failures surface via `friendlyDbError`, which passes the raw DB/RLS string through unless it literally contains "row-level security" — capacity/gender/constraint violations show a cryptic Postgres error. `joinWithSystemMessage` is non-atomic: the "joined" message insert only `console.error`s on failure, so a join can succeed with no visible "joined" line.

- [ ] **Re-enter lobby after leaving (rejoin)**
  - Steps: Open a room you left ("You left" banner + "Re-enter lobby"), tap it, confirm "Join lobby".
  - Expected: State flips to "joined"; new "joined" system message; input re-enables; full history (including messages sent while away) visible.
  - Edge cases: Messages sent by others while "left"; room closed/expired while away → button disabled.
  - Watch for: The `leftAt` filter into `fetchRoomEventsPage` comes from the member row's left_at; if the rejoin upsert doesn't clear left_at, `loadAll` re-reads a stale leftAt and pagination keeps filtering history → truncated/missing messages. Realtime also only re-subscribes once state flips to "joined", so there's a live gap right after rejoin.

- [ ] **Leave the room (confirmLeave → doLeave)**
  - Steps: In a joined room tap "Leave" (red), confirm "Leave".
  - Expected: "{name} left the invite" system message (unless read-only); state → "left"; navigate back.
  - Edge cases: Cancel stays; web uses `window.confirm`; already read-only skips message; offline; deep-linked empty back stack → `router.back()` no-op; creator closes at the same moment.
  - Watch for: Non-atomic and ordered wrong — `doLeave` inserts the "left" message FIRST then updates state; if the state update throws, the user gets "Leave failed" but the "left" line is already posted (chat shows them as left while still joined). Leaving via the native/back button does NO membership cleanup.

---

## 14. Room — chat

- [ ] ⭐ **Send a text message (Send → sendChat)**
  - Steps: In a joined, open room tap "Message…", type, tap "Send".
  - Expected: Message inserts, input clears, list reloads + scrolls to newest; your bubble on the right with display name + time.
  - Edge cases: Empty/whitespace; very long/newlines; emoji/RTL; read-only room → "Read-only" alert; not a member (input disabled); offline/RLS; rapid double-send.
  - Watch for: After every send, `sendChat` calls `loadAll()`, resetting `events` to page 1 and discarding older pages the user scrolled up to load. No optimistic UI — the bubble only appears after a full round-trip + reload. DB errors show `friendlyDbError` (raw Postgres unless it contains "row-level security").

- [ ] **Send with empty / whitespace-only input**
  - Steps: Leave the input blank (or type spaces), tap "Send".
  - Expected: Nothing sent; ideally the button is disabled or gives feedback.
  - Watch for: `sendChat` trims and returns silently, but the Send button is only disabled on `!canInteract`, never on empty text — a fresh user taps Send on an empty box and gets zero feedback (looks frozen).

- [ ] **Quick chip — "✅ I'm here" (sendQuick IM_HERE)**
  - Steps: In a joined, open room tap "✅ I'm here".
  - Expected: A quick event code IM_HERE inserts and renders as "✅ I'm here" in the active language.
  - Edge cases: Read-only / not-member → chip disabled; offline → "Failed"; rapid repeats.
  - Watch for: The raw code is stored and only mapped to a label at render — an unknown/new code renders as the raw string. Like `sendChat`, it calls `loadAll()` and drops loaded older history.

- [ ] **Quick chip — "⏱️ 10 min late" (sendQuick LATE_10)**
  - Steps: Tap "⏱️ 10 min late".
  - Expected: LATE_10 posts and renders as "⏱️ 10 min late".
  - Watch for: Same reload-collapses-history behavior; no de-dupe against spamming the same status.

- [ ] **Quick chip — "❌ Cancel" (sendQuick CANCEL)**
  - Steps: Tap "❌ Cancel".
  - Expected: A CANCEL chat status message posts (message only).
  - Watch for: Naming confusion — "❌ Cancel" is JUST a chat status; it does NOT cancel the activity, close the invite, or leave, and it sits next to the modal's own "Cancel". Testers will expect a destructive action.

- [ ] ⭐ **Read chat history (member view + joined-empty state)**
  - Steps: Join/re-enter a room; scroll through bubbles, system lines, date separators.
  - Expected: Newest-at-bottom (inverted); your messages right, others left with name + HH:MM; system lines centered grey; date separators between days.
  - Edge cases: Joined room with zero messages; only system messages; a user with no display_name; mixed languages.
  - Watch for: NO empty state for a joined-but-empty room — the "Enter this lobby…" hint only shows when NOT a member, so a joined user with no messages sees a blank white box. Others' bubbles fall back to "Unknown" when display_name is null.

- [ ] **Non-member empty state**
  - Steps: Open a room without joining; look at the chat area.
  - Expected: "Enter this lobby to see and send messages." + input placeholder "Enter lobby to chat".
  - Watch for: Gating relies on `canReadEvents` (joined OR left); if `myMembershipState` resolves late, the hint can flash even for an actual member.

- [ ] **Load older messages (pagination via scroll)**
  - Steps: In a room with >50 messages, scroll to the top of loaded history and keep scrolling.
  - Expected: `onEndReached` → `loadOlder`; "Loading…" footer; previous page prepends deduped by id; scroll stays stable.
  - Edge cases: Exactly 50 (limit boundary); fast repeated scroll → concurrent loads; true start of history; leftAt filter for a left member.
  - Watch for: `hasMore = (data.length===limit)`, so at exactly 50 one extra empty fetch happens before it flips false. Any subsequent send/quick calls `loadAll()` and wipes the older pages just loaded.

- [ ] ⭐ **Realtime incoming message from another user**
  - Steps: Join on Device A; on Device B (another member) send a message; watch A without touching it.
  - Expected: A receives the `postgres_changes` INSERT, fetches the full row by id, appends the bubble live (deduped).
  - Edge cases: "left" (read-only) state; burst of many messages; publication not enabled for `room_events`; reconnect after backgrounding; message arrives while scrolled up.
  - Watch for: The realtime subscription only mounts while `myMembershipState==='joined'`, so a "left" member gets NO live updates. Each insert triggers a separate `fetchRoomEventById` RPC (a burst = many round-trips). If `room_events` isn't in the `supabase_realtime` publication, messages never appear live.

- [ ] **Realtime member/activity change → debounced reload**
  - Steps: Stay in a joined room; have another user join/leave, or the creator close, on another device.
  - Expected: `onMemberChange`/`onActivityChange` → `scheduleReload` (200 ms debounce) → `loadAll` refreshes count/badges/read-only/messages.
  - Watch for: Every reload resets events to page 1 and re-scrolls, discarding scrolled-to history and yanking scroll position. If the creator closes while you're typing, `canInteract` flips false mid-compose and your draft becomes unsendable with only a "Read-only" alert on Send.

- [ ] **Long-press a message → action menu**
  - Steps: Press-hold (~250 ms) any chat/quick bubble.
  - Expected: Bottom-sheet modal "Message" with a 2-line preview and Copy / Report / Cancel.
  - Edge cases: Long-press a system message or date header; web/desktop (no touch long-press); long-press while scrolling.
  - Watch for: `onLongPress` is only on the user chat/quick Pressable — system messages and section headers are plain Views (can't be copied/reported). On web the menu is effectively unreachable.

- [ ] **Message menu — Copy**
  - Steps: Long-press a message, tap "Copy".
  - Expected: Text copied to clipboard + "Copied" confirmation.
  - Watch for: On native the Copy handler is a PLACEHOLDER ("Not implemented yet on native (placeholder).", copies nothing — no expo-clipboard). Only web copies via `navigator.clipboard`, which fails in insecure contexts.

- [ ] **Message menu — Report (NOT IMPLEMENTED)**
  - Steps: Long-press a message, tap "Report".
  - Expected (user): the message is flagged for moderation.
  - Watch for: Pure placeholder on every platform ("Not implemented yet.", files nothing). For a meet-nearby-strangers app this is a real safety gap — no working moderation path.

- [ ] **Message menu — Cancel / dismiss**
  - Steps: Open the menu, tap "Cancel" / the dimmed area / Android back.
  - Expected: Modal closes, no side effects.
  - Watch for: A mis-tap near the sheet edge could dismiss unexpectedly or fail to dismiss (`stopPropagation` boundary).

- [ ] **Date section separators (Today / Yesterday / month day) + i18n**
  - Steps: Open a room with messages spanning multiple days; read the centered pill separators; switch language.
  - Expected: "Today" / "Yesterday" / e.g. "Jul 3", grouped by the viewer's LOCAL day, localized.
  - Edge cases: Messages around local midnight; different device tz; zh/ja month formatting; older-than-a-year.
  - Watch for: Month names via `Date.toLocaleString(lang,{month:'short'})` — on Hermes without full ICU, non-English may fall back to English/odd format. Older-than-yesterday dates show "Mon D" with NO year, so last July and this July look identical.

- [ ] **System message rendering (joined / left / invite_updated / invite_closed)**
  - Steps: Trigger joins, leaves, a creator edit elsewhere, and a close; read the centered grey lines.
  - Expected: "{name} joined the lobby", "{name} left the invite", "Updated invite — <changes>", "Invite closed by creator", localized.
  - Edge cases: Malformed JSON; empty changes array; null display_name; unknown key.
  - Watch for: `safeParseSystemContent` returns null on bad JSON and `renderEventContent` then falls through to the RAW content string — a corrupt row displays literal JSON like `{"k":"room.system.left"}`. An empty changes list renders "Updated invite — " with a dangling em-dash; null names → "Unknown".

---

## 15. Room — header / state / nav

- [ ] **Members count badge**
  - Steps: Open a room, read the "Members N" pill.
  - Expected: Count of people currently in the room.
  - Watch for: The badge uses `members.length` (ALL rows), while joined/left is computed separately. If `fetchActivityMembers` returns "left" rows too, the count includes people who left and disagrees with the `joined` memo.

- [ ] **Closed / Expired badge + read-only banner (live expiry)**
  - Steps: Open a room that is closed or whose `expires_at` has passed; observe the badge/banner; try to type/send.
  - Expected: Red "Closed"/"Expired" badge + "Read-only" banner; chips and input disabled; placeholder "Read-only".
  - Edge cases: Room expires WHILE open (crossing expires_at with no reload); status flips via realtime; clock skew; expired but user still taps Send.
  - Watch for: `computeRoomState` uses `Date.now()` at render with NO timer, so a room that expires while open does not re-render to read-only until some other state change reloads — input stays enabled and Send is rejected server-side (RLS) and shown via `friendlyDbError`. UI and server disagree.

- [ ] **Message input placeholder reflects state**
  - Steps: Observe the placeholder as non-member, then joined, then left, then in a closed/expired room.
  - Expected: "Enter lobby to chat" → "Message…" → "Re-enter to chat" → "Read-only", greyed when not editable.
  - Watch for: Precedence is `canInteract ? … : left ? rejoin : readonly ? …`. A user who is BOTH left and the room is closed sees "Re-enter to chat" even though re-entering is impossible (Join is disabled by read-only) — the placeholder promises an unavailable action.

- [ ] **Room i18n coverage**
  - Steps: Set language to zh-HK/zh-CN/ja/en; walk title fallback, badges, banners, buttons, placeholders, dialogs, quick chips, menu, system messages.
  - Expected: All strings localize, no raw keys or missing interpolations; change-label separators use "、" for zh/ja, ", " otherwise.
  - Watch for: Key parity was verified complete, so raw-key leaks are unlikely; residual risk is Hermes ICU month formatting and layout overflow ("Re-enter lobby" / long place names overflowing the fixed header pills).

- [ ] **Back navigation out of the room**
  - Steps: Open a room from browse, tap the native header back arrow (or Android hardware back).
  - Expected: Returns to the previous screen without changing membership.
  - Edge cases: Deep-linked empty back stack; back while keyboard open; back while the message menu is open (should close modal first); back right after Leave.
  - Watch for: Native header back does NO membership cleanup — a user who "exits" via back is still joined and still receives realtime (differs from the Leave button). `router.back()` from `doLeave` assumes a non-empty stack; on a deep-linked first screen it can no-op, stranding the user.

---

## 16. Join / concurrency / realtime (Browse)

- [ ] **Live INSERT/UPDATE/DELETE of browse activities**
  - Steps: Keep Browse open on Device A; on B create → edit → delete/close an activity in the same area; watch A update without manual refresh.
  - Expected: `subscribeToBrowseActivities` pushes changes; INSERT/UPDATE of a joinable, not-mine activity adds/updates it; non-joinable or mine removes it; DELETE removes by old.id; re-sort `created_at desc`.
  - Edge cases: Update with null joined_count preserves existing; payload with no new.id ignored; new activity outside radius added but hidden by client filter; channel drop → missed events, no gap backfill.
  - Watch for: `isJoinableActivity(next, joinedSet)` IGNORES joinedSet — any UPDATE (e.g. someone else joining → joined_count change) on an activity YOU already joined re-inserts it into Browse, resurrecting a card removed at join time. Highest-impact realtime defect.

- [ ] **Realtime subscription lifecycle vs joinedSet dependency**
  - Steps: Load Browse (subscription starts when userId set), join an activity (joinedSet changes), observe.
  - Expected: Subscribe when userId set; re-subscribe when joinedSet changes; unsubscribe on cleanup.
  - Watch for: `joinedSet` in the dep array forces a full unsubscribe/resubscribe on every join — during teardown INSERT/DELETE events can be dropped, and the closure still captures the joinedSet that `isJoinableActivity` ignores anyway. Channel churn + missed events.

- [ ] **Concurrent join at capacity / double-device**
  - Steps: Two users open the same near-full activity; both tap Join near-simultaneously.
  - Expected: One join succeeds (→ room); the other gets a clear full/closed error and stays on Browse.
  - Edge cases: Loser's card stays (removal only after resolve); same user double-taps in the alert; join then immediate realtime UPDATE.
  - Watch for: Depends on `joinActivity`/DB enforcing capacity atomically; if not constraint-enforced, both can "succeed" and over-fill. The UI shows a generic error title, not "activity full", so the loser can't tell why.

- [ ] **Back-navigation from compose/create/edit/room → Browse**
  - Steps: From Browse push into `/compose` (or `/room/<id>` after join); complete or cancel; navigate back.
  - Expected: Focus reload re-runs `loadInitial`; created ones excluded as mine, joined ones removed.
  - Watch for: After creating an activity a fresh user returns to Browse and does NOT see their own post (excludeCreatorId) — a common "where did my post go?" confusion; there's no "my activities" affordance in Browse to reassure them.

---

## 17. Bottom tabs / navigation shell

- [ ] ⭐ **Switch between the four bottom tabs (Feed / Lobby / Created / Notifications)**
  - Steps: After signing in, tap Lobby, then Created, then Notifications, then Feed.
  - Expected: Each tap swaps screens instantly; the active tab uses the active tint; no crash; per-tab scroll remembered.
  - Edge cases: First-time empty data on every tab; returning user cached data; rapid double-tap; back-nav after entering a room; custom font "PatrickHand" fails.
  - Watch for: `tabBarLabelStyle` uses "PatrickHand" (`_layout.tsx:49`); if the font isn't loaded before first paint the labels render blank/fallback. Settings tab is `href:null` (correctly absent) — testers expecting a Settings tab won't find one.

- [ ] **Tabs shell entry (headerless container)**
  - Steps: After auth, land in `(tabs)`; confirm no root Stack header and that Browse is default.
  - Expected: `(tabs)` renders without the root Stack header; per-tab headers come from the nested layout.
  - Watch for: A missing title inside a tab is a nested-layout responsibility, not fixable in the shell — a boundary-of-responsibility trap when filing "no title on tab X".

- [ ] **Deep-link into a protected pushed screen while logged out**
  - Steps: Logged out, open a deep link like `/room/123`; observe where you land.
  - Expected: Auth guard intercepts → Login; after login you reach a sensible screen.
  - Edge cases: Valid link but not a member; expired session; link fired during cold-start before i18n/session ready; deleted activity id.
  - Watch for: `useAuthGuard` redirect and `StackBackButton`'s fallback (`/(tabs)/browse`) can both fire — the protected frame can flash, or the two can bounce between Login and Browse.

- [ ] **Header "←" back vs Android hardware/gesture back consistency**
  - Steps: Navigate Browse → Create → (push another screen); back out with hardware back; repeat using the header "←".
  - Expected: Both pop in the same order and reach Browse/tabs; deep-linked screens with no history resolve to a sensible parent, not app exit.
  - Watch for: `fallbackHref` (replace to a parent when `canGoBack` is false) lives ONLY in `StackBackButton` (the header "←"). Android hardware back uses default Stack behavior, so a deep-linked screen handles "←" gracefully but hardware back may pop to an empty stack / exit — divergent paths.

- [ ] **Compose / Edit back-navigation and draft handling**
  - Steps: Enter Compose (or Edit), type/change content, tap "←" before saving.
  - Expected: "←" returns to the previous screen (fallback `/(tabs)/browse`); predictable about the unsent draft.
  - Watch for: `StackBackButton` fires `router.back()/replace` immediately with NO unsaved-changes guard — a half-written invite is discarded silently with no confirmation.

---

## 18. Lobby (Joined) tab

- [ ] ⭐ **Initial load of joined lobbies + loading state**
  - Steps: Tap "Lobby"; observe "Loading…", then header + Active/Inactive/Left pills + list.
  - Expected: Resolves to Active by default, listing lobbies you joined (excluding created and left); membership map + first page of 30 loaded.
  - Edge cases: Zero memberships (empty state); offline; expired session; >30 (pagination); focus re-runs `loadInitial`.
  - Watch for: On the mount path a transient offline error does `handleError` AND `router.replace('/login')` (`joined.tsx:127`) — it logs the user out instead of showing retry.

- [ ] ⭐ **Active tab (default)**
  - Steps: Ensure "Active (N)" is selected; read the list.
  - Expected: Only `state==='joined'` AND `isActiveActivity` (open + not expired); the pill count matches visible rows.
  - Watch for: The Active/Inactive/Left split is a client-side `useMemo` over ONLY fetched pages, while pagination fetches by created_at cursor — so pill counts under-report until all pages load.

- [ ] **Inactive tab**
  - Steps: Tap "Inactive (N)"; read closed/expired joined lobbies.
  - Expected: Non-active joined lobbies, or "No inactive lobbies."
  - Watch for: Because tabs filter client-side over server-side pagination, Inactive can show empty (and its empty state) even though inactive lobbies exist on later pages — `onEndReached` fires on the empty sublist so load-more may never trigger.

- [ ] **Left tab (history)**
  - Steps: Tap "Left (N)"; read lobbies you left; tap a row to open the room read-only.
  - Expected: `state==='left'` rooms; tapping opens read-only/re-enter; or "No left rooms."
  - Watch for: Same pagination-vs-filter gap; also a left membership whose activity row isn't in the current page won't show at all.

- [ ] **Pull-to-refresh (Lobby)**
  - Steps: Pull down, release.
  - Expected: `onRefresh` runs `loadInitial`, re-fetches, spinner clears, tab stays selected.
  - Watch for: `onRefresh` and realtime `scheduleReload` both call `loadInitial`; two concurrent runs can interleave `setItems/setCursor/setHasMore` → briefly inconsistent list. Unlike mount, `onRefresh` errors only alert (no login redirect) — inconsistent handling.

- [ ] **Infinite scroll / load more (Lobby)**
  - Steps: With >30 joined lobbies, scroll Active to the bottom; watch the footer spinner then "No more".
  - Expected: `onEndReached` (0.6) → `loadMore` appends next 30 by cursor, dedupe by id, re-sort desc.
  - Watch for: `loadMore` paginates the WHOLE membership set but the visible list is a tab-filtered subset; if the Active subset is short you can't scroll far enough to trigger `onEndReached`, so later-page Active items never load. "No more" keys off `items.length` (unfiltered).

- [ ] ⭐ **Tap a lobby card → open its room**
  - Steps: On Active list, tap a card (not long-press).
  - Expected: `router.push('/room/{id}')`; the inner ›/people area opens the same room.
  - Edge cases: Long-press vs tap; back returns to same tab/scroll; activity deleted/closed between render and tap.
  - Watch for: `onLongPress` (delayLongPress 280 ms) shares state via `didLongPressRef` — a slow tap (>280 ms) is swallowed as a long-press and opens the menu instead of the room, so taps can feel broken on the core join→chat path.

- [ ] **Long-press a lobby card → action menu (Share / Report / Cancel)**
  - Steps: Press-hold ~0.3 s; a bottom sheet slides up.
  - Expected: For a joined non-creator: Share, Report, Cancel; backdrop tap dismisses.
  - Watch for: Memberships are filtered to `role !== 'creator'` so Edit/Delete is dead here (correct); Share and Report both call `notImplemented` (stub alerts) — a non-working Report is a trust/safety gap.

- [ ] **Empty state per tab + "Go to Browse" CTA**
  - Steps: With no active joined lobbies, open Lobby (Active), read "No active lobbies right now.", tap "Go to Browse"; check Inactive/Left empty copy.
  - Expected: Active shows message + "Go to Browse" (pushes `/(tabs)/browse`); Inactive "No inactive lobbies.", Left "No left rooms." (no CTA).
  - Watch for: The empty state can appear even when data exists on unfetched pages (false empty). CTA target is a group-relative route; if `(tabs)` doesn't resolve, navigation can no-op.

- [ ] **Realtime update of joined lobbies**
  - Steps: Stay on Lobby; from another device change a lobby you're in (join/close); watch the list refresh.
  - Expected: `subscribeToJoinedActivityChanges` → `scheduleReload` (250 ms) → `loadInitial`.
  - Watch for: Subscription is keyed to the current `membershipIds` Set — an activity you JUST joined from another screen isn't in that set, so its changes won't push until a focus reload rebuilds ids. Every tick resets cursor/hasMore to page 1, discarding scrolled pages.

- [ ] **Auth failure on load redirects to Login**
  - Steps: With an expired/invalid session, open Lobby; observe when `requireUserId` throws.
  - Expected: `handleError` alert, then `router.replace('/login')`.
  - Watch for: The mount effect treats ANY `loadInitial` error as a reason to redirect to `/login`, not just auth — a plain offline/500 on first open logs the user out. Focus-effect and onRefresh paths only alert, so behavior differs by entry path.

---

## 19. Created tab

- [ ] ⭐ **Initial load of created invites**
  - Steps: Tap "Created"; observe "Loading…", then header + Active/Inactive pills + list of invites you created.
  - Expected: Loads memberships (for joinedSet) + first page of activities where creator_id = you; defaults to Active.
  - Edge cases: Created nothing (empty state); offline (redirects to `/login` like Lobby); just-created invite appears after focus refresh; >30 pagination.
  - Watch for: Same "any load error → `/login`" (`created.tsx:117`).

- [ ] **Active / Inactive tab pills (Created)**
  - Steps: On Active read open/not-expired invites; tap Inactive for expired/closed.
  - Expected: Active = `isActiveActivity`; Inactive = the rest; counts match within fetched pages.
  - Watch for: Client-side split over paginated data → counts under-report and Inactive can look empty while expired invites exist on later pages. Created has ONE empty string regardless of tab, so an empty Inactive shows "You haven't posted any invites yet." + "Create an invite" CTA even when the user HAS active invites — misleading.

- [ ] **Pull-to-refresh (Created)**
  - Steps: Pull down, release.
  - Expected: `onRefresh` → `loadInitial`, spinner clears, tab retained.
  - Watch for: Created has NO realtime subscription (unlike Lobby), so pull-to-refresh + focus are the ONLY ways it updates — joined_count and new joins on your own invites look stale until a manual refresh.

- [ ] **Infinite scroll / load more (Created)**
  - Steps: With >30 created invites, scroll Active to the bottom; footer spinner → more rows → "No more".
  - Expected: `onEndReached` → `loadMore`, append by cursor, dedupe + sort desc.
  - Watch for: Same pagination-vs-filter coupling as Lobby — a short Active sublist may never trigger `onEndReached`, so later-page Active items never load.

- [ ] ⭐ **Tap a created card → open its room**
  - Steps: On the Created list, tap a card you posted.
  - Expected: `router.push('/room/{id}')` opens the room where you are creator/host.
  - Watch for: Same tap/long-press disambiguation risk (280 ms); this is the tester's primary way to verify a freshly-created invite produced a working room.

- [ ] **Edit a created invite via long-press menu**
  - Steps: Long-press one of your created cards, tap "Edit".
  - Expected: Creator menu shows Edit, Delete, Share, Report, Cancel; Edit closes the sheet and pushes `/edit/{id}`.
  - Watch for: `onPressEdit` is always passed here, but if `currentUserId` is momentarily null the Edit item is hidden even for your own invite. "Delete" is a stub alert — a creator cannot actually delete from here.

- [ ] ⭐ **Empty state + "Create an invite" CTA**
  - Steps: As a user who created nothing, open Created, read "You haven't posted any invites yet.", tap "Create an invite".
  - Expected: Empty card + a PrimaryButton pushing `/create`.
  - Watch for: Since the header ＋ never renders, this empty-state CTA is effectively the main path to Create — but it only appears when the current tab's filtered list is empty. A user with any active invite sees no CTA on Active and must find Create elsewhere.

---

## 20. Notifications tab

- [ ] **View the notifications screen (empty stub)**
  - Steps: Tap "Notifications"; see the bell header + a card "No notifications yet."
  - Expected: A static screen with title, a settings gear top-right, and the empty card.
  - Edge cases: A user with real activity still sees "No notifications yet."; dark/light; localized text.
  - Watch for: The entire screen is a hardcoded stub — no fetch, no realtime, no list. It ALWAYS shows "No notifications yet." — the feature is non-functional.

- [ ] **Open Settings from the notifications gear**
  - Steps: Tap the gear top-right.
  - Expected: `router.push('/settings')` opens Settings.
  - Watch for: Settings is hidden from the tab bar (`href:null`); this gear is the ONLY discoverable route to it. From Feed/Lobby/Created you can't reach Settings without first going to Notifications — a discoverability problem, and if this push fails there's no other path to logout/language/theme.

---

## 21. Settings

- [ ] **Back button**
  - Steps: Open Settings (via the gear), tap the "Back" pill top-left.
  - Expected: `router.back()` returns to Notifications.
  - Watch for: `router.back()` (`settings.tsx:111`) assumes a prior screen; entered via deep link / fresh stack it can no-op or exit unexpectedly.

- [ ] **Load current display name into the field**
  - Steps: Open Settings; observe the Display name field (non-editable while loading, then filled; placeholder "Your name" if none).
  - Expected: `getProfileDisplayName` loads the current name; `editable={!nameLoading}`.
  - Edge cases: No profile row yet; load fails offline; unmount during load; very long name.
  - Watch for: If `getProfileDisplayName` errors, the catch sets `nameLoading=false` with `displayName` still '' — the user sees an EMPTY name field despite having a saved name, and saving from there would overwrite the real name with ''.

- [ ] **Edit and save display name**
  - Steps: Clear the field, type a new name, tap "Save name"; watch "Loading…" → "Saved ✓".
  - Expected: `onSaveDisplayName` trims + slices to 24 chars, updates the profile, button → "Saved ✓"; editing again resets to "Save name".
  - Edge cases: Empty input saves ''; whitespace-only trims to ''; >24 truncated; emoji near the 24-char boundary; double-tap guarded; offline; concurrent save.
  - Watch for: `slice(0,24)` with NO minimum/non-empty validation — a user can save a blank display name (then shows empty in rooms/cards), and the slice can cut a multibyte/emoji mid-codepoint. Button isn't disabled by `nameSaved`, so tapping again re-saves.

- [ ] **Switch app language**
  - Steps: In "Language" tap a pill (English / 繁體中文（香港）/ Simplified Chinese (China) / 日本語); watch the UI text switch.
  - Expected: `i18n.changeLanguage` + persist; selected pill highlights; all `t()` strings re-render; persists across restarts.
  - Edge cases: Missing keys fall back to English; persist write fails; switch mid-save.
  - Watch for: Only en.json was verified for these screens; a missing key in zh-HK/zh-CN/ja renders the English fallback (or raw key) mid-screen. Pill labels are inconsistent — the Chinese-simplified pill label is in English ("Simplified Chinese (China)"), looks like a copy bug.

- [ ] **Switch app theme**
  - Steps: In "Theme" (11 pills: System, Light, Dark, Sage Paper, Forest Glass, Compass Teal, Compass Teal (Dark), Sunset Coral, Sunset Coral (Dark), Electric Violet, Electric Violet (Dark)) tap a pill.
  - Expected: `setMode(value)` applies immediately; selected pill highlights; "System" follows OS; persists.
  - Edge cases: "System" while toggling OS dark mode live; persistence across restart; many pills wrapping on a narrow device.
  - Watch for: The 11-way nested ternary mapping value→label (`settings.tsx:293-314`) is fragile; any mismatch between the value list and label keys yields a wrong/missing label. A failed persist would silently revert on restart with no error.

- [ ] **Log out**
  - Steps: Scroll to the bottom, tap the red "Log out".
  - Expected: `signOut()` clears the session and `router.replace('/login')`; on failure an alert "Logout failed".
  - Edge cases: Offline logout; logout while a name-save is in flight; double-tap; dangling subscriptions/timers; re-login.
  - Watch for: `onLogout` only navigates to `/login` if `signOut` returns no error — offline, it alerts and STAYS logged in even though the user intended to leave. No confirmation dialog, so an accidental tap logs out immediately.

---

## 22. Theme system (cross-app)

- [ ] **Theme mode persists across app restarts**
  - Steps: Pick a theme (e.g. Electric Violet Dark), confirm recolor, force-quit and relaunch.
  - Expected: Restored via `getStoredThemeMode`/`setStoredThemeMode`; first-time user defaults to "system".
  - Edge cases: First-time no stored value; stored value not in `themeMap`; changing theme twice rapidly; selecting a theme before the stored load resolves.
  - Watch for: Race — the async `getStoredThemeMode` effect calls `setMode(stored)` on mount; if the user picks a theme before it resolves, the late stored value overwrites the fresh selection. Any `resolvedMode` not in `themeMap` silently falls back to lightTheme.

- [ ] **System theme following (light/dark auto-switch)**
  - Steps: Set mode "System"; toggle OS dark mode; return and observe; toggle back.
  - Expected: With "system" the app follows OS live (base light/dark); with a named variant it does NOT follow OS.
  - Watch for: `resolvedMode` maps system only to base dark/light, never a variant — a user who picked a variant expecting auto light/dark finds it frozen (by design, reads as a bug). `useColorScheme` can briefly return null on cold start → transient light.

- [ ] **Default Text / TextInput + placeholder color from theme**
  - Steps: On a screen with text + an input, confirm body/input text readable and placeholder dimmer in light theme; switch to dark and re-check.
  - Expected: Text/TextInput inherit `theme.colors.text`; placeholder uses `theme.colors.subtext`; legible in both.
  - Edge cases: Theme changed while a TextInput is focused; a Text with an explicit style override; new RN architecture.
  - Watch for: ThemeProvider mutates `(Text as any).defaultProps` / `(TextInput as any).defaultProps` on every theme change; `defaultProps` on function components is deprecated — under the new architecture this may warn or silently not apply, so text can render with the platform default color, hurting dark-mode legibility.

---

## 23. Edit / Close activity

- [ ] **Load activity + creator authorization on mount**
  - Steps: Tap Edit on one of YOUR invites (from Created, a Feed card, Joined, or compose success); see "Loading…"; confirm the prefilled form.
  - Expected: `requireUserId` + `getActivityById`; if `creator_id === uid` the form renders prefilled.
  - Edge cases: Non-creator opens `/edit/{id}` → "Not allowed" then `router.back()`; deleted/nonexistent → "Load failed" + back; offline; bad/empty id → load error.
  - Watch for: Creator check is client-side (`edit/[id].tsx:79`) and `getActivityById` uses `.single()` (deleted row → PostgREST error surfaced as "Load failed"). Because `activities_select` RLS is `true` for all authenticated users, a non-creator can fetch the row and only the client check stops them seeing data momentarily before the bounce.

- [ ] **Prefilled form values from existing activity**
  - Steps: Open Edit on an invite with place/time/capacity/gender/expiry; verify Title, place card, start/end (and, after "More options", capacity/gender/expiry) match saved values.
  - Expected: `initialValues` map into InviteForm; times formatted to "YYYY-MM-DD HH:mm"; gender default "any"; null expires_at → mode "never".
  - Edge cases: Compose-created (place_text only) → `place_name ?? place_text`; UTC ISO shown in device-local; capacity not a preset (e.g. 5) → no chip highlighted, value still saved.
  - Watch for: Stored times are UTC ISO but rendered in device-local wall-clock (`InviteForm.tsx:76-83`) — a creator in a different tz, or DST, sees a shifted time, and re-saving rewrites it.

- [ ] **Save with changes → update + change-detection + system broadcast**
  - Steps: Open Edit on your invite that has ≥1 other member; change the title (and/or place/gender/capacity/time/expiry); tap "Save"; confirm you return to Created AND the room shows "Updated invite — title: X → Y".
  - Expected: `updateActivity` writes fields; a diff builds `InviteChange[]` and, if still joined + room open, inserts a "invite_updated" room_event; then `router.replace` to Created.
  - Edge cases: Not joined → update but no system message; room expired → no message; system-event insert failure logged not surfaced; concurrent edit last-write-wins; place change detected by name/address only.
  - Watch for: `isOpen` is computed from the STALE loaded `expires_at` (`edit/[id].tsx:207-209`), so if you change expiry in the same save the open/closed decision for the system message uses the OLD expiry; and if `room_events` isn't in the realtime publication, members won't see the update live.

- [ ] **Save with no changes (short-circuit)**
  - Steps: Open Edit, change nothing (or revert), tap "Save".
  - Expected: `changes.length===0` → skip update + skip system event → `router.replace('/(tabs)/created')`.
  - Watch for: A start_time that round-trips local→UTC identically is a correct no-op, but a value whose display reformats (seconds added/removed) could register a spurious change and fire an unnecessary broadcast.

- [ ] **Edit an expired / non-open invite (system-event + RLS edge)**
  - Steps: Create a 30m-expiry invite, let it expire (or close it), Edit it from Created, change the title, "Save".
  - Expected: Creator can still load and update their own row (RLS by creator); system message skipped because the room isn't open/joined.
  - Watch for: Because `isOpen` uses the stale `expires_at`, editing an expired invite to extend/remove expiry saves the new expiry but suppresses the "updated" notification in the same action — the creator thinks they revived it silently and members get no signal.

- [ ] **Creator closes the invite (closeInvite)**
  - Steps: Open a room you created ("Created" badge + red "Close"); tap "Close"; confirm "Close".
  - Expected: status → "closed" (closed_at/closed_by); "Invite closed by creator" system message; room reloads read-only (Closed badge + banner, input disabled).
  - Edge cases: Non-creator → "Not allowed"; already read-only returns silently; web uses `window.confirm`; offline; creator_id failed to load.
  - Watch for: `isCreator` derives from `activity.creator_id===userId`; if the fetch silently failed (creator_id undefined) the real creator sees no Close button. Two-step non-atomic close: `updateActivity` succeeds but the "invite_closed" event insert fails → room closed with no explanatory system message.

- [ ] **Cancel / "Skip for now" button (edit mode only)**
  - Steps: Open Edit on your invite, scroll to the bottom, tap "Skip for now".
  - Expected: `onCancel` → `router.back()` without saving.
  - Watch for: "Skip for now" discards all edits with no confirmation; a creator who typed changes and taps it (mistaking it for save, given the vague label) loses their edits.

---

## Edge cases to sweep across the app

Run these against every screen you touched above; they recur throughout NearbyNow.

- [ ] **Offline / airplane mode**: at cold start, at login/register submit, on Browse load + pull-to-refresh, area detect/search (IP + Nominatim), create/compose submit, join, chat send, realtime channels, logout. Confirm a clear error/empty/retry, not a hang or a false success. Known risks: any load error routing to `/login`; un-wrapped `ensureProfile` on login; Nominatim/ipapi failures reading as "no results"; realtime with no reconnect indicator.
- [ ] **Back button (hardware + gesture vs header "←")**: from every pushed screen and each deep-linked entry with an empty stack. Confirm both paths agree and never strand the user or exit unexpectedly. Known risk: `fallbackHref` lives only in the header "←".
- [ ] **Rotation / orientation**: auth forms (keyboard covering the primary button — no KeyboardAvoidingView/ScrollView), area/search sheets, the map, chat input, long lists. Confirm no clipped controls or lost scroll.
- [ ] **Empty states**: every list (Browse, Lobby Active/Inactive/Left, Created, Notifications, room with zero messages, recents with none, search with no results). Confirm the right copy and that no "false empty" appears while data sits on unfetched pages. Known risk: joined-but-empty room has no empty state (blank box).
- [ ] **Long text / overflow**: very long titles (no length cap on create/compose), long place names and area labels (header pill truncation), long translated button labels ("Re-enter lobby"), long display names, multi-line pasted invites.
- [ ] **Special characters / non-latin / emoji / RTL**: emails, passwords (UTF-16 length rule), titles, chat messages, place/area search queries (中文地名), display names (24-char slice mid-codepoint), month/date separators.
- [ ] **Double-tap / rapid taps / concurrency**: primary submit buttons (login/register/create/compose — disable timing before the first render), composer/create entry pushes (stacking screens), Join (double-request), chat send/quick chips, success-sheet dismiss-then-resubmit (duplicate post), theme/language pills, logout.
- [ ] **Permission denied / hardware unavailable**: location permission denied then IP fallback; previously-denied (no re-prompt) yielding only coarse IP; GPS on but no fix (no timeout → hang); Android Google Maps key without billing (blank map blocks Create at the map step); clipboard permission on web Copy.
- [ ] **Realtime publication + subscription lifecycle**: confirm `activities` and `room_events` are in the `supabase_realtime` publication (live Browse/chat/updated/closed depend on it). Enter/leave Browse and rooms repeatedly, background then foreground — confirm exactly one channel per surface (no leak/duplicates) and that just-joined activities start receiving live changes.
- [ ] **Timezone / clock skew**: card timestamps, room date separators, edit-prefill times (UTC vs device-local + DST), "Tonight after 8pm" past-start invites, live room expiry with no timer.
- [ ] **Partial-write / no-rollback**: create and compose both insert then auto-join without a transaction — force the join to fail (RLS/offline) and confirm whether an orphaned activity is left and whether a retry duplicates it.
