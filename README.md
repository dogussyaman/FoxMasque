# Kızılkuyruk

## Local setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env` and set `EXPO_PUBLIC_SUPABASE_URL` and
   `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. The legacy
   `EXPO_PUBLIC_SUPABASE_ANON_KEY` is also accepted. Leave both keys unset to
   use the local demo service.
3. Start the app with `npm run dev`.

Only the Supabase project URL and publishable/legacy anon key are used by the
client. Never place a `service_role` key or Google OAuth client secret in an
`EXPO_PUBLIC_*` variable.

## Supabase schema

- For a brand-new, empty Supabase project, run `supabase/schema.sql` once in
  the SQL Editor. It contains the schema and functions assembled from the
  migrations through `20261029000001`, including the profile trigger needed by
  Supabase Auth and the current block-only-fake-answer behavior. Then run
  `supabase/migrations/20261030000001_private_room_access.sql` once to enable
  password-protected rooms, followed by
  `supabase/migrations/20261031000001_player_discovery_weekly_leaderboard.sql`.
  Do not run `20261101000001_block_only_fake_answers.sql` after the combined
  schema; that behavior is already included.
- For a project where migrations have already been applied, do not run the
  combined schema. Apply only pending files in `supabase/migrations/` in
  timestamp order, including `20261024000001_fix_join_room_ambiguity.sql` to
  fix the room-join RPC and `20261025000001_fix_nudge_round_ambiguity.sql`
  to fix the nudge RPC, and `20261026000001_choices_correct_and_player_fakes_only.sql`
  to exclude question distractors from the answer pool, followed by
  `20261027000001_question_bank_and_seen_history.sql` for question metadata,
  per-player repeat prevention, and confirmed-seen tracking. Apply any later
  pending question-bank/avatar migrations (including `20261028000001` and
  `20261029000001`) before `20261030000001_private_room_access.sql`.
  Then apply `20261031000001_player_discovery_weekly_leaderboard.sql` for
  authenticated player search and weekly/friends leaderboard scopes, followed
  by `20261101000001_block_only_fake_answers.sql` so blocks prevent only fake
  answer submission. Do not edit or re-run the combined schema to install this
  update.

The private-room migration installs `pgcrypto` in the Supabase `extensions`
schema. Room passwords are stored only as salted bcrypt hashes, and private
rooms are excluded from the public-room listing. The join RPC rate-limits
failed attempts per authenticated user. Configure Supabase Auth's anonymous
sign-in rate limits as an additional safeguard; database-only rate limiting
cannot identify an IP address reliably.
The local demo adapter keeps its mock room password only in transient
in-memory state; production access control is enforced by Supabase RPCs.

Questions use one prompt and one correct answer. Legacy distractors are moved
to the restricted `question_legacy_decoys` archive before the live question
rows are cleared; no existing values are discarded. New rows default to
`status = 'draft'` and are excluded from games until reviewed and approved.
Question selection reserves an unseen question for active room members, while
the player's history is written only after the question screen acknowledges
that it was displayed. A depleted unseen pool returns an error instead of
silently repeating a question.

Weekly rankings include completed games recorded after the player-discovery
migration; earlier game snapshots have no reliable completion timestamp and
are intentionally excluded from weekly results. All-time rankings are
unchanged. The weekly score is the sum of a player's completed-match scores
over the preceding seven days.

There is no in-app question-admin screen. For a reviewed live import, use the
Supabase Table Editor CSV import for `public.questions`, supplying at minimum
`id`, `category_id`, `prompt`, `correct_answer`, and `explanation`; optionally
include `difficulty`, `subcategory`, and `source_url`. Omit
`default_decoys`; do not import AI-generated content directly as approved.
Keep imported category IDs among the app's existing categories. Review each
row, then explicitly set `status = 'approved'` and `is_active = true` before
it can be selected. The local demo question set is bundled in the app and is
not changed by a Supabase CSV import.

The profile row uses the same UUID as `auth.users.id`; no separate Google or
email account table is created.

## Google OAuth setup

1. In Google Cloud Console, create an OAuth client for the application
   platform(s) you use and configure the consent screen. Add your web origins
   and production domains where requested.
2. In Supabase Dashboard, open **Authentication → Providers → Google**, enable
   Google, and paste the Google OAuth client ID and client secret. Keep the
   client secret only in Supabase Dashboard.
3. Copy the Supabase **Callback URL (for OAuth)** shown by the Google provider
   settings into the Google OAuth client's **Authorized redirect URIs**. This
   is the Supabase callback URL, not the app's callback route.
4. In Supabase **Authentication → URL Configuration**, set the production web
   site as the Site URL and add the allowed redirect URLs:
   - `foxmasque://auth/callback` for a native build using the configured app
     scheme.
   - `https://YOUR-WEB-HOST/auth/callback` for each deployed web host.
   - The Expo development callback URL shown by the running app when testing
     in Expo Go, if you use that workflow.
5. Configure the same web callback route on the hosting provider to serve the
   Expo Router single-page app for `/auth/callback`.
6. For native builds, rebuild/reinstall after changing the `foxmasque` scheme.
   For web, serve the app on an allowed HTTPS origin. The app uses Supabase
   PKCE and returns OAuth sessions through `/auth/callback`.

Email/password accounts use Supabase Auth. Configure email confirmation and
SMTP in Supabase as appropriate for production. Password recovery redirects to
the same callback route and allows the user to set a new password after
Supabase verifies the recovery link. OAuth and email identities are not
automatically merged based only on matching email addresses.

## Checks

Run `npm run typecheck`, `npm test`, `npm run lint`, and `npm run build:web`.
