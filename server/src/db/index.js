import { drizzle } from 'drizzle-orm/bun-sqlite';
import { Database } from 'bun:sqlite';
import * as schema from './schema.js';


// SQLite has foreign key enforcement off by default, so every connection has to turn it on itself
const sqlite = new Database(process.env.DATABASE_URL);
sqlite.run('PRAGMA foreign_keys = ON');

export const db = drizzle(sqlite, { schema });
