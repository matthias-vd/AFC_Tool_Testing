# Ticketing (merged from afcgent-tickettool)

AFC EventBeheer is de enige app: events/workshops/projects blijven in Supabase `events`.
Publieke inschrijvingen schrijven naar dezelfde `registrations`-tabel met `bron = 'afc_ticket'`.

## Setup (eenmalig)

### Van “basic” schema (sqldb.rtf) → volledige tool
1. Open de Supabase SQL editor.
2. Open [`supabase/migrations/010_adapt_basic_schema_to_full_tool.sql`](supabase/migrations/010_adapt_basic_schema_to_full_tool.sql).
3. Run **Sectie A** alleen (enums / `afc_ticket`).
4. Run **Sectie B** (kolommen, RLS, storage, RPCs).

Dat voegt o.a. toe: ticketing-velden op `events`/`registrations`, zet `ingeschreven_op` om naar `timestamptz`, buckets `ticket-cvs` / `ticket-images`, RPCs `register_afc_ticket` / `get_ticket_by_token` / `cancel_ticket_by_token`, en basis-RLS.

### Of stapsgewijs (als je al half gemigreerd bent)
1. [`000_add_afc_ticket_bron.sql`](supabase/migrations/000_add_afc_ticket_bron.sql)
2. [`001_ticketing.sql`](supabase/migrations/001_ticketing.sql)
3. Eventueel [`002_ticket_cvs_storage_rls.sql`](supabase/migrations/002_ticket_cvs_storage_rls.sql) / [`003_fix_register_afc_ticket_types.sql`](supabase/migrations/003_fix_register_afc_ticket_types.sql)
4. CV-toggle + wachtlijst — **apart runnen** (SQL-editor kapt grote scripts af):
   - [`004a_cv_waitlist_columns.sql`](supabase/migrations/004a_cv_waitlist_columns.sql)
   - [`004b_get_event_ticket_status.sql`](supabase/migrations/004b_get_event_ticket_status.sql)
   - [`004c_register_afc_ticket_waitlist.sql`](supabase/migrations/004c_register_afc_ticket_waitlist.sql)
   - [`004d_promote_waitlist.sql`](supabase/migrations/004d_promote_waitlist.sql)

Als je een check-constraint op `registrations.bron` hebt, voeg `'afc_ticket'` toe (zie commentaar in de migratie).

## SMTP (bulkmail)

Zet in Vercel / `.env` (zie [`frontend/.env.example`](frontend/.env.example)):

- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`
- `SUPABASE_URL` / `SUPABASE_ANON_KEY` (of de `VITE_`-varianten) voor de `/api/mail` serverless functie

Lokaal testen van mail: `vercel dev` (Vite alleen serveert geen `/api`).

## Gebruik

1. **Evenementen** → event openen → sectie **Ticketing** → aanzetten, slug + open zetten.
   Optioneel: **CV-upload verplicht**, **Wachtlijst bij volzet**.
2. Publiek: `/` → `/events/:slug` (CV alleen als verplicht; wachtlijst als vol + toggle aan).
3. Intern: sidebar **Ticketing** → open/dicht, CV/wachtlijst toggles, **Bulkmail** / wachtlijst-mail, deelnemers (filter + promoveren).

| Publieke route | Functie |
|---|---|
| `/` | Eventlijst (home) |
| `/events/:slug` | Inschrijven (+ optioneel CV / wachtlijst) |
| `/afgelopen` | Archief |
| `/ticket/:slug/:token` | QR-ticket of wachtlijst-bevestiging |
| `/uitschrijven/:token` | Annuleren |

## Harmonie

| Actie in Evenementen | Effect |
|---|---|
| Ticketing aan + open | Event op `/` |
| `max_deelnemers` | Capaciteit voor ticket-inschrijvingen |
| Titel / datum / locatie / beschrijving | Publieke eventpagina |
| Soft delete | Verdwijnt uit publieke lijst |

Ticket-deelnemers verschijnen in `registrations` naast Tally/Ticket Tailor-imports (filterbaar via `bron`).
