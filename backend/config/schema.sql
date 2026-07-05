-- ============================================================
-- DAR CHERAÏT — Schéma PostgreSQL
-- Base : dar_cherait_reservations
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── admins ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admins (
  id            SERIAL PRIMARY KEY,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  nom           VARCHAR(100) NOT NULL,
  role          VARCHAR(50) NOT NULL DEFAULT 'admin'
                CHECK (role IN ('admin','super_admin')),
  actif         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── users (visiteurs inscrits) ───────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  prenom        VARCHAR(100) NOT NULL,
  nom           VARCHAR(100) NOT NULL,
  telephone     VARCHAR(30),
  nationalite   VARCHAR(100),
  actif         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── reservations ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reservations (
  id                  SERIAL PRIMARY KEY,
  reference           VARCHAR(20) UNIQUE NOT NULL
    DEFAULT ('RES-' || UPPER(SUBSTRING(gen_random_uuid()::TEXT,1,8))),
  user_id             INTEGER REFERENCES users(id) ON DELETE SET NULL,
  visiteur_prenom     VARCHAR(100) NOT NULL,
  visiteur_nom        VARCHAR(100) NOT NULL,
  visiteur_email      VARCHAR(255) NOT NULL,
  visiteur_telephone  VARCHAR(30),
  visiteur_nationalite VARCHAR(100),
  espace              VARCHAR(100) NOT NULL,
  date_visite         DATE NOT NULL,
  heure_visite        TIME NOT NULL,
  nombre_adultes      INTEGER NOT NULL DEFAULT 1 CHECK (nombre_adultes >= 0),
  nombre_enfants      INTEGER NOT NULL DEFAULT 0 CHECK (nombre_enfants >= 0),
  langue_visite       VARCHAR(50) NOT NULL DEFAULT 'français',
  visite_guidee       BOOLEAN NOT NULL DEFAULT FALSE,
  message             TEXT,
  statut              VARCHAR(30) NOT NULL DEFAULT 'en_attente'
    CHECK (statut IN ('en_attente','confirmee','annulee','terminee')),
  reponse_admin       TEXT,
  annule_par          VARCHAR(20) CHECK (annule_par IN ('visiteur','admin')),
  montant_total       DECIMAL(10,2),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── reservation_history ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS reservation_history (
  id              SERIAL PRIMARY KEY,
  reservation_id  INTEGER NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  action          VARCHAR(100) NOT NULL,
  ancienne_valeur TEXT,
  nouvelle_valeur TEXT,
  fait_par        VARCHAR(100),
  fait_par_role   VARCHAR(50),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Index ────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_reservations_email  ON reservations(visiteur_email);
CREATE INDEX IF NOT EXISTS idx_reservations_statut ON reservations(statut);
CREATE INDEX IF NOT EXISTS idx_reservations_date   ON reservations(date_visite);
CREATE INDEX IF NOT EXISTS idx_reservations_user   ON reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_ref    ON reservations(reference);
CREATE INDEX IF NOT EXISTS idx_history_reservation ON reservation_history(reservation_id);

-- ── Trigger updated_at ───────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_admins_updated
  BEFORE UPDATE ON admins FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE OR REPLACE TRIGGER trg_users_updated
  BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE OR REPLACE TRIGGER trg_reservations_updated
  BEFORE UPDATE ON reservations FOR EACH ROW EXECUTE FUNCTION set_updated_at();