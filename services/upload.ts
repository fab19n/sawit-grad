import { getPendingRecords, updateSyncStatus } from './db';
import { getToken } from './auth';
import { API_URL } from '../constants/theme';
import { GradingRecord } from '../types/grading';

export interface UploadProgress {
  current:  number;
  total:    number;
  recordId: string;
  supplier: string;
}

// The main sync function. It reads all pending records from SQLite,
// sends them to the API in one batch request, then updates local
// sync status based on what the server reports back.
// We send them all in one request rather than one-by-one because
// it's far more efficient on a mobile connection — one round trip
// with a payload of 50 records is much faster than 50 round trips.
export async function uploadAll(
  onProgress: (p: UploadProgress) => void,
  onDone:     (count: number) => void,
  onError:    (err: string) => void
): Promise<void> {
  try {
    const pending = await getPendingRecords();
    if (pending.length === 0) { onDone(0); return; }

    // Show the user we're starting — set progress to first record immediately
    onProgress({
      current:  1,
      total:    pending.length,
      recordId: pending[0].id,
      supplier: pending[0].namaLesen || '(Tanpa nama)',
    });

    // Retrieve the stored JWT token. If there's no token, the user
    // somehow got to this screen without being authenticated — send
    // them back to login by returning an error.
    const token = await getToken();
    if (!token) {
      onError('Sesi tamat. Sila log masuk semula.');
      return;
    }

    // Send all pending records in a single batch request.
    // The server's /api/records/sync endpoint accepts an array
    // and processes each record individually, returning a count
    // of how many succeeded and how many failed.
    const controller = new AbortController();
    const timeoutId  = setTimeout(() => controller.abort(), 30000); // 30s for batch upload

    const res = await fetch(`${API_URL}/api/records/sync`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        // The Authorization header is how the server knows who is making
        // this request. The protect middleware on the server extracts the
        // token from this header, verifies it, and populates req.user.
        'Authorization': `Bearer ${token}`,
      },
      body:   JSON.stringify({ records: pending }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      onError(errData.message || `Ralat pelayan: ${res.status}`);
      return;
    }

    const data = await res.json();

    if (!data.success) {
      onError(data.message || 'Muat naik gagal.');
      return;
    }

    // The server processed the records — now update each one locally.
    // We update them one by one in SQLite because each record needs
    // its own status update regardless of what happened to the others.
    const synced = data.results?.synced ?? 0;
    const failed = data.results?.failed ?? 0;

    for (let i = 0; i < pending.length; i++) {
      const record = pending[i];
      // Update progress UI for each record as we process it locally
      onProgress({
        current:  i + 1,
        total:    pending.length,
        recordId: record.id,
        supplier: record.namaLesen || '(Tanpa nama)',
      });

      // Mark as synced if the server reported overall success.
      // In a more sophisticated implementation you'd track per-record
      // success from the server response, but for now batch success
      // means all records were processed.
      await updateSyncStatus(record.id, failed === 0 ? 'synced' : 'failed');
    }

    onDone(synced);

  } catch (err: any) {
    if (err.name === 'AbortError') {
      onError('Sambungan tamat masa. Cuba lagi apabila rangkaian stabil.');
    } else {
      onError(err.message || 'Ralat tidak dijangka semasa muat naik.');
    }
  }
}

// Single record retry — used from the History Detail screen's Retry button.
// Sends just one record to the same sync endpoint wrapped in an array,
// because the server endpoint always expects an array even for single records.
export async function uploadSingle(record: GradingRecord): Promise<boolean> {
  try {
    const token = await getToken();
    if (!token) return false;

    const controller = new AbortController();
    const timeoutId  = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(`${API_URL}/api/records/sync`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${token}`,
      },
      // Wrap in array — the endpoint always expects { records: [...] }
      body:    JSON.stringify({ records: [record] }),
      signal:  controller.signal,
    });

    clearTimeout(timeoutId);
    const data = await res.json();

    if (data.success && data.results?.synced > 0) {
      await updateSyncStatus(record.id, 'synced');
      return true;
    } else {
      await updateSyncStatus(record.id, 'failed');
      return false;
    }
  } catch {
    await updateSyncStatus(record.id, 'failed');
    return false;
  }
}