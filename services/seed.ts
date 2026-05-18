import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL, SNO_KEY } from '../constants/theme';
import { seedRecords } from './db';
import { GradingRecord } from '../types/grading';

// Called once after a successful login.
// Fetches all records (without photos) for this mill, seeds them into
// local SQLite so the grader can immediately share any prior ticket as PDF,
// and bumps the serial number counter so new records don't collide with
// numbers already taken on the server.
export async function seedFromServer(token: string): Promise<void> {
  const controller = new AbortController();
  // 20s timeout — this is a background operation, not blocking the UI
  const timeoutId = setTimeout(() => controller.abort(), 20000);

  try {
    const res = await fetch(`${API_URL}/api/records/lite`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    if (!res.ok) return; // Fail silently — seed is best-effort at login

    const data = await res.json();
    if (!data.success || !Array.isArray(data.records)) return;

    // Map server records to the local GradingRecord shape.
    // Photos are excluded from the /lite endpoint, so we set an empty array.
    const local: GradingRecord[] = data.records.map((r: any) => ({
      id:             r.serialNo,
      isDraft:        false,
      syncStatus:     'synced' as const,
      createdAt:      r.deviceCreatedAt ?? r.createdAt,
      isEdited:       r.isEdited  ?? false,
      editCount:      r.editCount ?? 0,
      editedAt:       r.editedAt  ?? null,
      date:           r.date,      time:           r.time,
      namaLesen:      r.namaLesen, noLesenMPOB:    r.noLesenMPOB,
      noKenderaan:    r.noKenderaan,
      noTiketTimbang: r.noTiketTimbang, bilanganSampel: r.bilanganSampel,
      beratBersih:    r.beratBersih,    purataBerat:    r.purataBerat,
      boer:           r.boer,           bker:           r.bker,
      tandanMasak:    r.tandanMasak,    tandanMengkal:  r.tandanMengkal,
      tandanBusuk:    r.tandanBusuk,    tandanKosong:   r.tandanKosong,
      jumlahB:        r.jumlahB,        tandanKotor:    r.tandanKotor,
      tandanLama:     r.tandanLama,     tandanDura:     r.tandanDura,
      tandanTangkai:  r.tandanTangkai,  partenokarpi:   r.partenokarpi,
      jumlahC:        r.jumlahC,        jumlahBesar:    r.jumlahBesar,
      goer:           r.goer,           catatan:        r.catatan,
      namaPenggred:   r.namaPenggred,   namaPemandu:    r.namaPemandu,
      photos:         [],
    }));

    await seedRecords(local);

    // Bump the serial number counter to at least the highest number seen on
    // the server. This prevents a fresh-device grader from being assigned a
    // number that is already taken by a record synced from another device.
    if (local.length > 0) {
      const maxSNO = local.reduce((max, r) => {
        const n = parseInt(r.id, 10);
        return isNaN(n) ? max : Math.max(max, n);
      }, 0);

      if (maxSNO > 0) {
        const stored = await AsyncStorage.getItem(SNO_KEY);
        const localCounter = parseInt(stored ?? '0', 10);
        if (maxSNO > localCounter) {
          await AsyncStorage.setItem(SNO_KEY, String(maxSNO));
        }
      }
    }
  } catch {
    // Seed failure must never block login. The grader gets in either way;
    // conflicts will be caught by the server-side detection as a safety net.
    clearTimeout(timeoutId);
  }
}