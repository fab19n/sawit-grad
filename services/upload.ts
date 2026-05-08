import { getPendingRecords, updateSyncStatus } from './db';
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

    for (let i = 0; i < pending.length; i++) {
      const rec: GradingRecord = pending[i];
      onProgress({
        current:  i + 1,
        total:    pending.length,
        recordId: rec.id,
        supplier: rec.namaLesen || '(Tanpa nama)',
      });
      // Simulate network call — replace with real API later
      await new Promise(res => setTimeout(res, 800));
      await updateSyncStatus(rec.id, 'synced');
    }
    onDone(pending.length);
  } catch (e: any) {
    onError(e.message ?? 'Upload gagal');
  }
}

export async function uploadSingle(id: string): Promise<boolean> {
  try {
    await new Promise(res => setTimeout(res, 800));
    await updateSyncStatus(id, 'synced');
    return true;
  } catch {
    await updateSyncStatus(id, 'failed');
    return false;
  }
}