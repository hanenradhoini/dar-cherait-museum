-- ============================================================
-- DAR CHERAÏT — Migration : compléter la table admins
-- Ajoute les colonnes manquantes sans supprimer les données
-- À exécuter avec :
--   psql -U postgres -d dar_cherait_reservations -f backend/config/fix-admins.sql
-- ============================================================

-- Ajouter la colonne actif (requise par middleware/auth.js)
ALTER TABLE admins ADD COLUMN IF NOT EXISTS actif BOOLEAN NOT NULL DEFAULT TRUE;

-- Ajouter updated_at (cohérence avec le reste du schéma)
ALTER TABLE admins ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Convertir created_at en TIMESTAMPTZ si besoin (déjà TIMESTAMP, on harmonise)
-- (optionnel — sans risque, ne casse rien si déjà bon type)
ALTER TABLE admins ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC';

-- Ajouter la contrainte CHECK sur role si elle n'existe pas déjà
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'admins_role_check'
  ) THEN
    ALTER TABLE admins ADD CONSTRAINT admins_role_check
      CHECK (role IN ('admin', 'super_admin'));
  END IF;
END $$;

-- Trigger updated_at automatique (réutilise la fonction si elle existe déjà)
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_admins_updated ON admins;
CREATE TRIGGER trg_admins_updated
  BEFORE UPDATE ON admins FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Vérification finale
\d admins
