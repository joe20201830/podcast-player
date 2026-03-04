CREATE TABLE IF NOT EXISTS shows (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id   TEXT NOT NULL,
  feed_url    TEXT NOT NULL,
  name        TEXT,
  author      TEXT,
  artwork_url TEXT,
  saved_at    TEXT DEFAULT (datetime('now')),
  UNIQUE(device_id, feed_url)
);
