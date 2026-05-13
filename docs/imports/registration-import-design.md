# Kauri Futsal Registration Import Design

## Short recommendation

Use a two-step CSV import: load each Master Ops Sheet staging pack into import staging tables, review validation and duplicate flags, then manually promote only approved rows into the current app tables. Keep payments in a review-only table until pricing, split-payment, and reconciliation rules are confirmed. Do not import emergency contacts yet, and reduce medical/support notes to a visible review placeholder unless Marvin has explicitly reviewed the source note.

This keeps the workflow simple for a one-person operator while protecting parent/player trust: no blind overwrites, no messaging, no Google Sheets connection, no payment automation, and every promoted record remains traceable to an import batch.

## Current app schema summary

The repository does not contain a complete baseline schema migration for the core app tables. The current database shape below is inferred from Supabase queries in the Next.js app and the existing storage/RLS migration.

| Area | Current app tables | Current fields used by app | Notes for import |
| --- | --- | --- | --- |
| Players | `players` | `id`, `first_name`, `last_name`, `preferred_name`, `dob`, `jersey_no`, `status`, `created_at`, `photo_url`, `photo_storage_path`, `photo_updated_at` | No explicit source ID, school year, consent, medical/support review, or import batch tracking yet. |
| Parents/caregivers | `guardians`, `guardian_players` | `guardians.id`, `name`, `email`, `phone`; `guardian_players.player_id`, `guardian_id`, `primary_contact` | Existing UI creates a new guardian for a new player; no dedupe key, relationship label, or import provenance yet. |
| Enrolments | `player_terms`, `memberships` | `player_terms.id`, `player_id`, `term_id`, `status`, `registered_at`; `memberships.player_term_id`, `team_term_id`, `role` | `player_terms` is the term enrolment shell; `memberships` links that enrolment to programme/group shells. |
| Programmes/groups | `terms`, `teams`, `team_terms` | `terms.id`, `year`, `term`, `start_date`, `end_date`; `teams.id`, `name`; `team_terms.id`, `team_id`, `term_id`, `fee_amount`, `fee_due_date` | Teams/groups can represent operational groups; do not create programme dates, venues, or prices unless present and reviewed. |
| Attendance/events | `events`, `attendance` | `events.id`, `title`, `type`, `location`, `starts_at`, `ends_at`, `team_term_id`; `attendance.event_id`, `player_id`, `status`, `notes` | Out of scope for the first registration import. |
| Payments | none confirmed in app code | `team_terms.fee_amount`, `fee_due_date` only | There is no live payments ledger in the app. Use payment review rows only. |

## Proposed source-to-app field map

| Master Ops/staging source field | App destination | Import rule | Notes |
| --- | --- | --- | --- |
| `Player ID` (`KF-P-0001`) | `players.source_player_id` and staging `source_player_id` | Store as source reference only; do not use as app primary key. | Supports audit and future dedupe. |
| Player first name | `players.first_name` | Required for promotion. Trim whitespace. | Quarantine if missing. |
| Player last name | `players.last_name` | Required for promotion. Trim whitespace. | Quarantine if missing. |
| Preferred/known-as name | `players.preferred_name` | Optional. Blank becomes `NULL`. | Keep exact parent-visible spelling after trim. |
| Date of birth | `players.dob` | Optional but validate date when supplied. | Quarantine invalid dates. |
| School year / year group | `players.school_year` | Optional but recommended for duplicate detection. | Add column; do not infer if missing. |
| Player status | `players.status` | Map known values only (`prospect`, `active`, `inactive`, `alumni`). | Default to `prospect` for unconfirmed imports unless the staging row explicitly indicates active enrolment. |
| Medical/support notes indicator | `players.medical_support_review_note` | If any source note exists and policy is not settled, import only `Medical/support note present - review source`. | Do not copy sensitive clinical/free-text notes into app during first import. |
| Photo/video consent | `players.photo_video_consent` | Preserve value including `To confirm`. | `To confirm` must remain visible for review. |
| Parent/caregiver name | `guardians.name` | Required if creating guardian from source contact. | If name missing but email/phone present, quarantine for manual review. |
| Parent/caregiver email | `guardians.email` | Optional; lower-case for matching, preserve original in raw staging JSON. | Email should be dedupe input. |
| Parent/caregiver phone | `guardians.phone` | Optional; normalize for matching in staging, store readable source value. | Phone should be dedupe input. |
| Parent relationship | `guardian_players.relationship` | Optional. | Add column; do not infer relationship. |
| Primary contact marker | `guardian_players.primary_contact` | True for the first/primary parent row when source says primary; otherwise false. | If ambiguous, choose one primary only during manual approval. |
| Enrolment ID (`KF-E-0001`) | `player_terms.source_enrolment_id` and staging `source_enrolment_id` | Store as source reference only. | Unique with source system where present. |
| Enrolment term/year | `player_terms.term_id` | Must match an existing `terms` row selected by Marvin. | Do not create term dates unless the staging pack supplies reviewed dates. |
| Enrolment status | `player_terms.status` | Use source value only when it maps to app statuses. | Recommended first import status: `registered` only for approved rows. |
| Registration date | `player_terms.registered_at` | Optional. | If missing, leave `NULL`; do not use import date as registration date. |
| Programme/group name | `teams.name`, `team_terms` | Match existing team/group first; create only reviewed missing group names. | No pricing, venue, or dates unless confirmed. |
| Programme fee | `team_terms.fee_amount` | Manual only for now. | Do not apply combined Friday + Sunday rows without confirmed split rules. |
| Programme due date | `team_terms.fee_due_date` | Manual only for now. | Keep blank if not explicit. |
| Player-to-group assignment | `memberships` | Create after player term and team term exist. | Use `role = 'player'` unless source explicitly says otherwise. |
| Payment ID (`KF-PAY-0001`) | `payment_review_rows.source_payment_id` | Review-only. | Do not create confirmed paid records. |
| Payment amount / status / method / reference | `payment_review_rows.*` | Store for review, not reconciliation. | Keep `review_status = 'needs_review'` until manually cleared. |
| Combined Friday + Sunday payment rows | `payment_review_rows.review_flags` | Flag as `combined_programme_payment`. | Remain review-only until split rules are confirmed. |
| Emergency contact details | none | Do not import. | Hold in source system until policy/table design is approved. |

## Missing app tables or columns required

Recommended minimal changes are captured in `supabase/migrations/002_safe_registration_import_layer.sql`.

### Live app provenance and review columns

| Table | Additions | Why |
| --- | --- | --- |
| `players` | `source_system`, `source_player_id`, `school_year`, `photo_video_consent`, `medical_support_review_note`, `import_batch_id` | Duplicate detection, visible consent review, sensitive-note minimisation, rollback/audit. |
| `guardians` | `source_system`, `source_guardian_key`, `import_batch_id` | Parent/caregiver dedupe and rollback/audit. |
| `guardian_players` | `relationship`, `import_batch_id` | Keeps caregiver role visible without CRM complexity. |
| `player_terms` | `source_system`, `source_enrolment_id`, `import_batch_id` | Avoids duplicate enrolment promotions and supports rollback. |
| `team_terms` | `source_system`, `source_programme_key`, `import_batch_id` | Tracks imported programme/group shells without changing current UI. |
| `memberships` | `import_batch_id` | Lets an import batch be reversed safely. |

### New tables

| Table | Purpose | Rule |
| --- | --- | --- |
| `import_batches` | One row per CSV staging pack import. | Contains source path, dry-run status, counts, and operator notes. |
| `staging_registration_rows` | Raw + normalized registration rows before promotion. | Never blindly promote; every row gets validation status and review flags. |
| `payment_review_rows` | Review-only imported payment rows. | Not a ledger and not a confirmed payment table. |

## Recommended Supabase migration

Add `supabase/migrations/002_safe_registration_import_layer.sql` before the first CSV import. This migration is intentionally conservative:

- It creates staging/review tables but does not move data.
- It adds import provenance columns for rollback.
- It adds indexes for duplicate detection.
- It does not create triggers, automations, payment reconciliation, or messages.
- It keeps payment rows separate from confirmed payments.

## Safe import staging strategy

1. Create an `import_batches` row for the staging pack path, for example `kauri-ops/sheets/staging-imports/2026-05-13-new-registrations/`.
2. Load CSV rows into `staging_registration_rows.raw_payload` and normalized columns. Do not write to `players`, `guardians`, `player_terms`, `teams`, `team_terms`, or `memberships` yet.
3. Validate required fields: player first/last name, at least one parent contact route where a parent row is present, selected term, and programme/group match decision.
4. Normalize duplicate-match helpers in staging: lower-case emails, phone digits, lower-case player names, and school year.
5. Set staging statuses:
   - `pending` for unreviewed rows.
   - `ready` only when required fields pass and no duplicate conflicts exist.
   - `quarantined` for duplicates, missing required fields, invalid dates, ambiguous caregivers, medical/support details needing review, `To confirm` consent, or combined payment pricing concerns.
   - `promoted` only after live rows are created.
6. Promote approved rows in a transaction-like manual script order: players, guardians, guardian links, player terms, team terms, memberships.
7. Store promoted app IDs back on the staging row (`promoted_player_id`, `promoted_guardian_id`, `promoted_player_term_id`, `promoted_team_term_id`) plus `promoted_at`.
8. Run post-import QA before importing any payment review rows.
9. Load payment rows into `payment_review_rows` only after player/enrolment QA passes.

## Duplicate detection rules

Use these rules to produce review flags; do not auto-merge during the first import.

| Match type | Rule | Action |
| --- | --- | --- |
| Strong existing player match | Same `source_system + source_player_id`, or same normalized first name + last name + school year and matching parent email or phone. | Quarantine unless it is an expected already-imported source row. Never overwrite. |
| Possible sibling/family match | Same parent email or phone, different player first name. | Allow after review; create/link guardian carefully. |
| Possible duplicate guardian | Same normalized email, or same normalized phone. | Reuse/link existing guardian only after manual review. |
| Same player different school year | Same player name + parent contact but different school year. | Quarantine; check source. |
| Enrolment duplicate | Same `source_enrolment_id`, or same player + term + programme/group. | Quarantine; do not create a second membership. |
| Programme/group duplicate | Same normalized group/team name for selected term. | Reuse existing `teams`/`team_terms`; do not create near-duplicate group names. |
| Payment duplicate | Same `source_payment_id`, or same payer/contact + amount + reference + payment date. | Keep in `payment_review_rows` with duplicate flag. |

## Sensitive data handling rules

- Do not import emergency contact data until a policy and destination table are approved.
- Do not copy detailed medical/support notes into the app during first import. Use `Medical/support note present - review source` when a source note exists.
- Treat photo/video consent as an operational review field. Preserve `To confirm` visibly.
- Do not send emails, SMS, or parent messages from import scripts.
- Keep raw staging payloads access-controlled with Supabase RLS for authenticated operators only.
- Avoid unnecessary exports after import; CSV files contain sensitive child and caregiver data.
- Prefer dry-run counts and row IDs over printing full parent/player details in logs.

## Rollback strategy

Because every promoted row carries `import_batch_id`, rollback is simple and auditable:

1. Pause app changes and export a backup of affected rows for the batch.
2. Delete in dependency order for the target `import_batch_id`:
   - `memberships`
   - `guardian_players`
   - `player_terms`
   - `team_terms` created only by the batch if unused elsewhere
   - `guardians` created only by the batch if they have no remaining links
   - `players` created only by the batch if they have no remaining enrolments/attendance
   - `payment_review_rows`
3. Reset related `staging_registration_rows.status` from `promoted` to `ready` or `quarantined` and clear promoted IDs.
4. Mark the `import_batches.status` as `rolled_back` with notes.

Do not rollback by overwriting existing pre-import rows. If a promoted row was manually edited after import, review before deleting.

## First import workflow

1. Confirm target term exists in `terms` and the intended programme/group names exist or are explicitly approved for creation.
2. Create one `import_batches` row for `2026-05-13-new-registrations` with `status = 'staging'`.
3. Import registration CSV rows into `staging_registration_rows` only.
4. Run validation and duplicate detection queries. Produce counts for `ready`, `quarantined`, missing required fields, possible duplicates, `To confirm` consent, medical/support placeholder rows, and programme/group misses.
5. Marvin reviews quarantined rows in the source CSV/Master Ops Sheet. Fix staging rows or mark them `excluded` with a reason.
6. Promote only `ready` rows. No overwrites. Create new live records only where duplicate review says it is safe.
7. Run post-import QA:
   - Count promoted players, guardians, enrolments, and memberships by batch.
   - Spot-check at least five player profiles against source rows.
   - Confirm no emergency contact fields were imported.
   - Confirm `To confirm` consent values remain visible.
   - Confirm medical/support detail was not copied beyond placeholder text.
8. Import payment CSV rows into `payment_review_rows` only after registration QA passes.
9. Review payment rows manually. Combined Friday + Sunday rows stay `needs_review` until split pricing rules are confirmed.
10. Close batch as `promoted` only after QA notes are written.

## What should stay manual for now

- Creating or confirming programme dates, venues, and prices.
- Splitting combined Friday + Sunday payment rows.
- Marking any payment as confirmed paid.
- Resolving duplicates and deciding whether to reuse an existing guardian.
- Reviewing emergency contact policy and destination design.
- Reviewing medical/support notes in the source sheet.
- Parent/caregiver communications.
- Google Sheets syncing or scheduled imports.
- Any CRM-style follow-up automation.

## Risks and manual checks

| Risk | Why it matters | Manual check |
| --- | --- | --- |
| Duplicate children created | Parent trust and admin cleanup suffer. | Review duplicate flags before promotion; no overwrites. |
| Sensitive medical notes copied into app | Increases privacy risk. | Verify only placeholder text is imported. |
| `To confirm` consent hidden | Could lead to accidental photo/video usage. | Check consent value in player record after import. |
| Payment rows treated as paid | Creates false payment visibility. | Keep only `payment_review_rows.review_status = 'needs_review'`. |
| Combined programme payments misallocated | Pricing split not confirmed. | Flag and leave review-only. |
| Programme/group near-duplicates | Roster management becomes messy. | Match existing team names first; approve new names manually. |
| Rollback deletes manually edited records | Could lose legitimate admin updates. | Check `updated_at`/operator notes where available before deleting imported live rows. |
