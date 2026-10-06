-- Run this FIRST, alone, in the Supabase SQL editor.
-- Then run 001_ticketing.sql.
-- (Postgres cannot use a newly added enum value in the same transaction.)

ALTER TYPE registratie_bron ADD VALUE IF NOT EXISTS 'afc_ticket';
