-- ══════════════════════════════════════════════════════════════════
-- EMROD SARL — Schéma de base de données (Neon PostgreSQL)
-- Exécuté automatiquement par `npm run db:setup`
-- ══════════════════════════════════════════════════════════════════

-- ── CATÉGORIES DE MOBILIER ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  position    INT  NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── PRODUITS (MODÈLES DE MOBILIER) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id          SERIAL PRIMARY KEY,
  category_id INT REFERENCES categories(id) ON DELETE SET NULL,
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  price       BIGINT NOT NULL DEFAULT 0,        -- Prix total en GNF (0 = sur devis)
  dimensions  TEXT NOT NULL DEFAULT '',
  finition    TEXT NOT NULL DEFAULT '',
  essence     TEXT NOT NULL DEFAULT '',
  is_published BOOLEAN NOT NULL DEFAULT true,
  position    INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_published ON products(is_published);

-- ── IMAGES DES PRODUITS (Vercel Blob) ──────────────────────────────
CREATE TABLE IF NOT EXISTS product_images (
  id          SERIAL PRIMARY KEY,
  product_id  INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  is_main     BOOLEAN NOT NULL DEFAULT false,
  position    INT NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_product_images_product ON product_images(product_id);

-- ── GALERIE PUBLIQUE (images + vidéos) ─────────────────────────────
CREATE TABLE IF NOT EXISTS gallery_items (
  id          SERIAL PRIMARY KEY,
  media_type  TEXT NOT NULL DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
  url         TEXT NOT NULL,                    -- URL Blob (mp4) ou URL embed externe
  title       TEXT NOT NULL DEFAULT '',
  is_published BOOLEAN NOT NULL DEFAULT true,
  position    INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_gallery_published ON gallery_items(is_published);

-- ── PROSPECTS (LEADS) ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leads (
  id           SERIAL PRIMARY KEY,
  first_name   TEXT NOT NULL DEFAULT '',
  last_name    TEXT NOT NULL DEFAULT '',
  phone        TEXT NOT NULL DEFAULT '',
  email        TEXT NOT NULL DEFAULT '',
  service_type TEXT NOT NULL DEFAULT '',
  message      TEXT NOT NULL DEFAULT '',
  source       TEXT NOT NULL DEFAULT '',        -- popup | contact_page | ...
  status       TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'archived')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);

-- ── COMMANDES ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id                 SERIAL PRIMARY KEY,
  reference          TEXT NOT NULL UNIQUE,      -- ex: EMROD-1730000000
  product_id         INT REFERENCES products(id) ON DELETE SET NULL,
  product_name       TEXT NOT NULL DEFAULT '',
  price_total        BIGINT NOT NULL DEFAULT 0,  -- Prix authentique lu en base
  deposit_amount     BIGINT NOT NULL DEFAULT 0,  -- Acompte attendu (calculé)
  paid_amount        BIGINT NOT NULL DEFAULT 0,  -- Montant réellement encaissé
  customer_name      TEXT NOT NULL DEFAULT '',
  customer_phone     TEXT NOT NULL DEFAULT '',
  customer_address   TEXT NOT NULL DEFAULT '',
  payment_status     TEXT NOT NULL DEFAULT 'pending'
                     CHECK (payment_status IN ('pending', 'paid', 'cancelled', 'failed', 'refunded')),
  djomy_transaction_id TEXT NOT NULL DEFAULT '',
  metadata           JSONB,
  product_details    JSONB,                    -- Snapshot du produit au moment de la commande
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at            TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_reference ON orders(reference);

-- ── PARAMÈTRES DU SITE (contenus éditables, JSONB) ─────────────────
CREATE TABLE IF NOT EXISTS settings (
  key        TEXT PRIMARY KEY,                  -- contact | home | testimonials | ...
  value      JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ══════════════════════════════════════════════════════════════════
-- MISES À JOUR v2 — sections/sous-sections, vidéos produits,
-- acompte personnalisable par produit (idempotent : db:setup rejouable)
-- ══════════════════════════════════════════════════════════════════

-- Catégories hiérarchiques : parent_id NULL = section, sinon sous-section
ALTER TABLE categories ADD COLUMN IF NOT EXISTS parent_id INT REFERENCES categories(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);

-- Acompte par produit : 'percent' (deposit_value = %), 'fixed' (GNF), 'none' (paiement désactivé)
ALTER TABLE products ADD COLUMN IF NOT EXISTS deposit_mode TEXT NOT NULL DEFAULT 'percent';
ALTER TABLE products ADD COLUMN IF NOT EXISTS deposit_value BIGINT NOT NULL DEFAULT 60;
DO $$ BEGIN
  ALTER TABLE products ADD CONSTRAINT chk_products_deposit_mode
    CHECK (deposit_mode IN ('percent', 'fixed', 'none'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Médias produits : images ET vidéos
ALTER TABLE product_images ADD COLUMN IF NOT EXISTS media_type TEXT NOT NULL DEFAULT 'image';
DO $$ BEGIN
  ALTER TABLE product_images ADD CONSTRAINT chk_product_images_media_type
    CHECK (media_type IN ('image', 'video'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Snapshot des détails du produit au moment de la commande (dashboard)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS product_details JSONB;
