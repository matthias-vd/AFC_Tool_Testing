# Ticketing (merged from afcgent-tickettool)

AFC EventBeheer is de enige app: events/workshops/projects blijven in Supabase `events`.
Publieke inschrijvingen schrijven naar dezelfde `registrations`-tabel met `bron = 'afc_ticket'`.

## Setup (eenmalig)

1. Open de Supabase SQL editor.
2. Voer **eerst apart** uit: [`supabase/migrations/000_add_afc_ticket_bron.sql`](supabase/migrations/000_add_afc_ticket_bron.sql)
3. Voer daarna uit: [`supabase/migrations/001_ticketing.sql`](supabase/migrations/001_ticketing.sql)
4. Controleer dat storage-buckets `ticket-cvs` en `ticket-images` bestaan.
5. Als CV-upload faalt op RLS: voer ook
   [`supabase/migrations/002_ticket_cvs_storage_rls.sql`](supabase/migrations/002_ticket_cvs_storage_rls.sql) uit.
6. Als inschrijven klaagt over `ingeschreven_op`/text: voer
   [`supabase/migrations/003_fix_register_afc_ticket_types.sql`](supabase/migrations/003_fix_register_afc_ticket_types.sql) uit
   (frontend heeft ondertussen een fallback-insert).

Als je een check-constraint op `registrations.bron` hebt, voeg `'afc_ticket'` toe (zie commentaar in de migratie).

## Gebruik

1. **Evenementen** → event openen → sectie **Ticketing** → aanzetten, slug + open zetten.
2. Publiek (zelfde layout als afcgent-tickettool): `/`
3. Header **Organisatie** → `/ticketing` (AFC EventBeheer; login indien nodig).
4. Intern: sidebar **Ticketing** → overzicht, scanner, deelnemers/CSV. Dashboard blijft op `/dashboard`.

| Publieke route | Functie |
|---|---|
| `/` | Eventlijst (home) |
| `/events/:slug` | Inschrijven + CV |
| `/afgelopen` | Archief |
| `/ticket/:slug/:token` | QR-ticket |
| `/uitschrijven/:token` | Annuleren |

## Harmonie

| Actie in Evenementen | Effect |
|---|---|
| Ticketing aan + open | Event op `/` |
| `max_deelnemers` | Capaciteit voor ticket-inschrijvingen |
| Titel / datum / locatie / beschrijving | Publieke eventpagina |
| Soft delete | Verdwijnt uit publieke lijst |

Ticket-deelnemers verschijnen in `registrations` naast Tally/Ticket Tailor-imports (filterbaar via `bron`).
