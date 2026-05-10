import * as SQLite from 'expo-sqlite';
import { DB_NAME } from '../constants/theme';
import { GradingRecord, SyncStatus } from '../types/grading';

// ─────────────────────────────────────────────────────────────────────────────
// SINGLETON CONNECTION
// The database is opened exactly once when this module is first imported.
// All functions below reuse this single connection, which is the correct
// pattern for SQLite — opening multiple connections causes Android JNI errors.
// ─────────────────────────────────────────────────────────────────────────────
const db = SQLite.openDatabaseSync(DB_NAME);

// ─────────────────────────────────────────────────────────────────────────────
// INITIALISATION
// We run this once at module load time. Using a promise so any caller that
// awaits initPromise is guaranteed the table exists before querying.
// ─────────────────────────────────────────────────────────────────────────────
const initPromise: Promise<void> = db.runAsync(
  `CREATE TABLE IF NOT EXISTS records (
    id         TEXT PRIMARY KEY,
    data       TEXT NOT NULL,
    syncStatus TEXT NOT NULL DEFAULT 'pending',
    isDraft    INTEGER NOT NULL DEFAULT 0,
    createdAt  TEXT NOT NULL
  )`
).then(() => {
  // Table is ready — nothing else needed
}).catch(e => {
  console.error('DB init error:', e);
});

// Every exported function awaits initPromise first.
// After the first call this resolves instantly (Promise is already settled).
async function ready(): Promise<void> {
  await initPromise;
}

// ─────────────────────────────────────────────────────────────────────────────
// CRUD OPERATIONS
// ─────────────────────────────────────────────────────────────────────────────

export async function saveRecord(record: GradingRecord): Promise<void> {
  await ready();
  await db.runAsync(
    `INSERT OR REPLACE INTO records (id, data, syncStatus, isDraft, createdAt)
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
  await ready();
  const rows = await db.getAllAsync<{ data: string }>(
    `SELECT data FROM records ORDER BY createdAt DESC`
  );
  return rows.map(r => JSON.parse(r.data));
}

export async function getRecord(id: string): Promise<GradingRecord | null> {
  await ready();
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
  await ready();
  // Fetch the full record first so we can update the embedded JSON too
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