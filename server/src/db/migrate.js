import { Database } from 'bun:sqlite';


// Runs raw CREATE TABLE IF NOT EXISTS statements rather than using drizzle-kit push,
// so there is no CLI tooling dependency and migrations can run as a plain bun script.
const sqlite = new Database(process.env.DATABASE_URL ?? './biku.db');
sqlite.run('PRAGMA foreign_keys = ON');

// couples created first — users.couple_id references it
sqlite.run(`
	CREATE TABLE IF NOT EXISTS couples (
		id               TEXT PRIMARY KEY,
		partner_a_id     TEXT NOT NULL REFERENCES users(id),
		partner_b_id     TEXT REFERENCES users(id),
		couple_name      TEXT,
		anniversary_date TEXT,
		invite_code      TEXT UNIQUE,
		invite_status    TEXT NOT NULL DEFAULT 'pending',
		created_at       INTEGER NOT NULL
	)
`);

sqlite.run(`
	CREATE TABLE IF NOT EXISTS users (
		id            TEXT PRIMARY KEY,
		email         TEXT NOT NULL UNIQUE,
		password_hash TEXT NOT NULL,
		display_name  TEXT NOT NULL,
		avatar_url    TEXT,
		couple_id     TEXT REFERENCES couples(id),
		created_at    INTEGER NOT NULL
	)
`);

sqlite.run(`
	CREATE TABLE IF NOT EXISTS memories (
		id               TEXT PRIMARY KEY,
		couple_id        TEXT NOT NULL REFERENCES couples(id),
		created_by       TEXT NOT NULL REFERENCES users(id),
		title            TEXT NOT NULL,
		description      TEXT,
		memory_date      TEXT NOT NULL,
		location_name    TEXT,
		lat              REAL,
		lng              REAL,
		image_url        TEXT,
		image_author     TEXT,
		image_author_url TEXT,
		weather_data     TEXT,
		created_at       INTEGER NOT NULL
	)
`);

sqlite.run(`
	CREATE TABLE IF NOT EXISTS lists (
		id         TEXT PRIMARY KEY,
		couple_id  TEXT NOT NULL REFERENCES couples(id),
		list_type  TEXT NOT NULL,
		created_at INTEGER NOT NULL
	)
`);

sqlite.run(`
	CREATE TABLE IF NOT EXISTS list_items (
		id         TEXT PRIMARY KEY,
		list_id    TEXT NOT NULL REFERENCES lists(id),
		added_by   TEXT NOT NULL REFERENCES users(id),
		content    TEXT NOT NULL,
		is_checked INTEGER NOT NULL DEFAULT 0,
		sort_order INTEGER NOT NULL DEFAULT 0,
		created_at INTEGER NOT NULL
	)
`);

sqlite.run(`
	CREATE TABLE IF NOT EXISTS mood_logs (
		id         TEXT PRIMARY KEY,
		couple_id  TEXT NOT NULL REFERENCES couples(id),
		user_id    TEXT NOT NULL REFERENCES users(id),
		mood_score INTEGER NOT NULL,
		note       TEXT,
		log_date   TEXT NOT NULL,
		created_at INTEGER NOT NULL
	)
`);

sqlite.run(`
	CREATE TABLE IF NOT EXISTS important_dates (
		id            TEXT PRIMARY KEY,
		couple_id     TEXT NOT NULL REFERENCES couples(id),
		created_by    TEXT NOT NULL REFERENCES users(id),
		title         TEXT NOT NULL,
		date          TEXT NOT NULL,
		recurs_yearly INTEGER NOT NULL DEFAULT 0,
		created_at    INTEGER NOT NULL
	)
`);

sqlite.run(`
	CREATE TABLE IF NOT EXISTS date_ideas (
		id           TEXT PRIMARY KEY,
		title        TEXT NOT NULL,
		description  TEXT,
		category     TEXT NOT NULL,
		budget_level INTEGER NOT NULL,
		min_duration INTEGER,
		max_duration INTEGER,
		tags         TEXT
	)
`);

sqlite.close();
console.log('migration complete');
