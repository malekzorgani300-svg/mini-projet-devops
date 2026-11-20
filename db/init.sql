-- Exécuté automatiquement au premier démarrage du conteneur PostgreSQL
CREATE TABLE IF NOT EXISTS tasks (
  id         SERIAL PRIMARY KEY,
  title      TEXT        NOT NULL,
  done       BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO tasks (title, done) VALUES
  ('Installer WSL2 et Ubuntu', TRUE),
  ('Créer le dépôt GitHub', TRUE),
  ('Lancer la stack avec docker compose up -d', FALSE);
