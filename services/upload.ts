import { Alert } from 'react-native';
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

export async function uploadAll(
  onProgress: (p: UploadProgress) => void,
  onDone:     (count: number) => void,
  onError:    (err: string) => void
): Promise<void> {
  try {
    const pending = await getPendingRecords();
    if (pending.length === 0) { onDone(0); return; }

    onProgress({
      current:  1,
      total:    pending.length,
      recordId: pending[0].id,
      supplier: pending[0].namaLesen || '(Tanpa nama)',
    });

    const token = await getToken();
    if (!token) { onError('Sesi tamat. Sila log masuk semula.'); return; }

    const controller = new AbortController();
    const timeoutId  = setTimeout(() => controller.abort(), 30000);

    const res = await fetch(`${API_URL}/api/records/sync`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body:    JSON.stringify({ records: pending }),
      signal:  controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      onError(errData.message || `Ralat pelayan: ${res.status}`);
      return;
    }

    const data = await res.json();
    if (!data.success) { onError(data.message || 'Muat naik gagal.'); return; }

    const synced    = data.results?.synced    ?? 0;
    const failed    = data.results?.failed    ?? 0;
    // The server returns a list of serialNos that collided with an existing
    // record from a different device — these are flagged, not silently dropped.
    const conflicts: string[] = data.results?.conflicts ?? [];

    for (let i = 0; i < pending.length; i++) {
      const record = pending[i];
      onProgress({
        current:  i + 1,
        total:    pending.length,
        recordId: record.id,
        supplier: record.namaLesen || '(Tanpa nama)',
      });

      if (conflicts.includes(record.id)) {
        // Mark locally as 'conflict' so the badge shows amber in the history list
        await updateSyncStatus(record.id, 'conflict');
      } else {
        await updateSyncStatus(record.id, failed === 0 ? 'synced' : 'failed');
      }
    }

    // Alert the grader after the loop completes — one alert listing all conflicts,
    // not one per record, to avoid a cascade of popups.
    if (conflicts.length > 0) {
      Alert.alert(
        'Konflik Dikesan',
        `No. Siri berikut telah wujud dalam sistem dari peranti lain:\n\n${conflicts.map(c => `• #${c}`).join('\n')}\n\nRekod anda telah disimpan dan akan disemak oleh pengurus.`,
        [{ text: 'Faham', style: 'default' }]
      );
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

export async function uploadSingle(record: GradingRecord): Promise<boolean> {
  try {
    const token = await getToken();
    if (!token) return false;

    const controller = new AbortController();
    const timeoutId  = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(`${API_URL}/api/records/sync`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body:    JSON.stringify({ records: [record] }),
      signal:  controller.signal,
    });

    clearTimeout(timeoutId);
    const data = await res.json();

    if (!data.success) {
      await updateSyncStatus(record.id, 'failed');
      return false;
    }

    const conflicts: string[] = data.results?.conflicts ?? [];
    if (conflicts.includes(record.id)) {
      await updateSyncStatus(record.id, 'conflict');
      Alert.alert(
        'Konflik Dikesan',
        `No. Siri #${record.id} telah wujud dari peranti lain. Rekod anda telah disimpan dan akan disemak oleh pengurus.`,
        [{ text: 'Faham' }]
      );
      return false; // Not a sync failure, but not cleanly synced either
    }

    if (data.results?.synced > 0) {
      await updateSyncStatus(record.id, 'synced');
      return true;
    }

    await updateSyncStatus(record.id, 'failed');
    return false;
  } catch {
    await updateSyncStatus(record.id, 'failed');
    return false;
  }
}