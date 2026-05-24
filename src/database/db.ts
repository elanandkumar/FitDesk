import * as SQLite from 'expo-sqlite';
import { ALL_TABLES, DEFAULT_SETTINGS, DEFAULT_CLASS_TYPES } from './schema';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync('fitdesk.db');
  await initializeDatabase(db);
  return db;
}

async function initializeDatabase(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync('PRAGMA journal_mode = WAL;');
  await database.execAsync('PRAGMA foreign_keys = ON;');

  for (const sql of ALL_TABLES) {
    await database.execAsync(sql);
  }

  for (const setting of DEFAULT_SETTINGS) {
    await database.runAsync(
      'INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)',
      [setting.key, setting.value]
    );
  }

  const now = new Date().toISOString();
  for (const ct of DEFAULT_CLASS_TYPES) {
    await database.runAsync(
      'INSERT OR IGNORE INTO class_types (name, color, created_at) VALUES (?, ?, ?)',
      [ct.name, ct.color, now]
    );
  }
}

export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.closeAsync();
    db = null;
  }
}
