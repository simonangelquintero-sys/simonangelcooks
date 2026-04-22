CREATE TABLE IF NOT EXISTS news_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  summary TEXT NOT NULL,
  why_it_matters TEXT,
  source_name TEXT NOT NULL,
  source_url TEXT NOT NULL,
  secondary_sources TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  review_notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  approved_at TEXT,
  published_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_news_status ON news_items(status);
CREATE INDEX IF NOT EXISTS idx_news_published_at ON news_items(published_at);

CREATE TABLE IF NOT EXISTS trusted_sources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  rss_url TEXT,
  active INTEGER NOT NULL DEFAULT 1
);