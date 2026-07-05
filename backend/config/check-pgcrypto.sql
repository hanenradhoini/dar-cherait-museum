-- ============================================================
-- DAR CHERAÏT — Vérifier et activer pgcrypto
-- À exécuter avec :
--   psql -U postgres -d dar_cherait_reservations -f backend/config/check-pgcrypto.sql
-- ============================================================

-- Activer l'extension (sans erreur si déjà présente)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Vérifier qu'elle est bien installée
SELECT extname, extversion FROM pg_extension WHERE extname = 'pgcrypto';

-- Tester que gen_random_uuid() fonctionne
SELECT gen_random_uuid() AS test_uuid;

-- Tester l'expression exacte utilisée dans le DEFAULT de reservations.reference
SELECT 'RES-' || UPPER(SUBSTRING(gen_random_uuid()::TEXT, 1, 8)) AS test_reference;
