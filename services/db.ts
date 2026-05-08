import * as SQLite from 'expo-sqlite';
import { DB_NAME } from '../constants/theme';
import { GradingRecord, SyncStatus } from '../types/grading';

let _db: SQLite.SQLiteDatabase | null = null;

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;
  _db = await SQLite.openDatabaseAsync(DB_NAME);
  await _db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS records (
      id         TEXT PRIMARY KEY,
      data       TEXT NOT NULL,
      syncStatus TEXT NOT NULL DEFAULT 'pending',
      isDraft    INTEGER NOT NULL DEFAULT 0,
      createdAt  TEXT NOT NULL
    );
  `);
  return _db;
}

export async function saveRecord(record: GradingRecord): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT OR REPLACE INTO records
     (id, data, syncStatus, isDraft, createdAt)
     VALUES (?, ?, ?, ?, ?)`,
    [
      record.id,
      JSON.stringify(record),
      record.syncStatus,
      record.isDraft ? 1 : 0,
      record.createdAt,
    ]
  );
}

export async function getAllRecords(): Promise<GradingRecord[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ data: string }>(
    `SELECT data FROM records ORDER BY createdAt DESC`
  );
  return rows.map(r => JSON.parse(r.data));
}

export async function getRecord(id: string): Promise<GradingRecord | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ data: string }>(
    `SELECT data FROM records WHERE id = ?`,
    [id]
  );
  return row ? JSON.parse(row.data) : null;
}

export async function updateSyncStatus(
  id: string,
  status: SyncStatus
): Promise<void> {
  const db = await getDb();
  const record = await getRecord(id);
  if (!record) return;
  record.syncStatus = status;
  await db.runAsync(
    `UPDATE records SET syncStatus = ?, data = ? WHERE id = ?`,
    [status, JSON.stringify(record), id]
  );
}

export async function getPendingRecords(): Promise<GradingRecord[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ data: string }>(
    `SELECT data FROM records
     WHERE syncStatus IN ('pending','failed') AND isDraft = 0
     ORDER BY createdAt ASC`
  );
  return rows.map(r => JSON.parse(r.data));
}

export async function deleteRecord(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(`DELETE FROM records WHERE id = ?`, [id]);
}