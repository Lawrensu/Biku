import { drizzle } from 'drizzle-orm/bun-sqlite';
import { Database } from 'bun:sqlite';
import * as schema from './schema.js';


// Foreign key enforcement is off by default in SQLite — every connection must opt in
const sqlite = new Database(process.env.DATABASE_URL);
sqlite.run('PRAGMA foreign_keys = ON');

export const db = drizzle(sqlite, { schema });
