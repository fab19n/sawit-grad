import * as SQLite from 'expo-sqlite';
import { DB_NAME } from '../constants/theme';
import { GradingRecord, SyncStatus } from '../types/grading';

const db = SQLite.openDatabaseSync(DB_NAME);

const initPromise: Promise<void> = db.runAsync(
  `CREATE TABLE IF NOT EXISTS records (
    id         TEXT PRIMARY KEY,
    data       TEXT NOT NULL,
    syncStatus TEXT NOT NULL DEFAULT 'pending',
    isDraft    INTEGER NOT NULL DEFAULT 0,
    createdAt  TEXT NOT NULL
  )`
).then(() => {}).catch(e => { console.error('DB init error:', e); });

async function ready(): Promise<void> {
  await initPromise;
}

export async function saveRecord(record: GradingRecord): Promise<void> {
  await ready();
  await db.runAsync(
    `INSERT OR REPLACE INTO records (id, data, syncStatus, isDraft, createdAt)
     VALUES (?, ?, ?, ?, ?)`,
    [record.id, JSON.stringify(record), record.syncStatus, record.isDraft ? 1 : 0, record.createdAt]
  );
}

export async function getAllRecords(): Promise<GradingRecord[]> {
  await ready();
  const rows = await db.getAllAsync<{ data: string }>(
    `SELECT data FROM records ORDER BY createdAt DESC`
  );
  return rows.map(r => JSON.parse(r.data));
}

export async function getRecord(id: string): Promise<GradingRecord | null> {
  await ready();
  const row = await db.getFirstAsync<{ data: string }>(
    `SELECT data FROM records WHERE id = ?`, [id]
  );
  return row ? JSON.parse(row.data) : null;
}

export async function updateSyncStatus(id: string, status: SyncStatus): Promise<void> {
  await ready();
  const record = await getRecord(id);
  if (!record) return;
  record.syncStatus = status;
  await db.runAsync(
    `UPDATE records SET syncStatus = ?, data = ? WHERE id = ?`,
    [status, JSON.stringify(record), id]
  );
}

export async function getPendingRecords(): Promise<GradingRecord[]> {
  await ready();
  const rows = await db.getAllAsync<{ data: string }>(
    `SELECT data FROM records
     WHERE syncStatus IN ('pending','failed') AND isDraft = 0
     ORDER BY createdAt ASC`
  );
  return rows.map(r => JSON.parse(r.data));
}

export async function deleteRecord(id: string): Promise<void> {
  await ready();
  await db.runAsync(`DELETE FROM records WHERE id = ?`, [id]);
}

// Seeds records from the server into SQLite on first login.
// Uses INSERT OR IGNORE so we never overwrite locally-created pending/failed
// records with server data. On a fresh device, all rows will be new inserts.
// On an existing device, rows that already exist (any status) are skipped.
export async function seedRecords(records: GradingRecord[]): Promise<void> {
  await ready();
  for (const record of records) {
    await db.runAsync(
      `INSERT OR IGNORE INTO records (id, data, syncStatus, isDraft, createdAt)
       VALUES (?, ?, ?, ?, ?)`,
      [record.id, JSON.stringify(record), 'synced', 0, record.createdAt]
    );
  }
}