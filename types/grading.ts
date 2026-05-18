export type SyncStatus = 'pending' | 'synced' | 'failed' | 'conflict'; // ← only change

// One entry per edit session, computed locally in form.tsx before sync.
// The server receives these and pushes only the new ones into MongoDB.
export interface EditHistoryEntry {
  editedAt:  string;
  editCount: number;
  oldValues: Record<string, any>;
  newValues: Record<string, any>;
}

export interface GradingRow {
  bil:     number;
  pct:     number;
  penalti: number;
}

export interface GradingRecord {
  id:             string;
  isDraft:        boolean;
  syncStatus:     SyncStatus;
  createdAt:      string;

  isEdited:       boolean;
  editCount:      number;
  editedAt:       string | null;
  editHistory:    EditHistoryEntry[];   // ← this was the missing field

  date:           string;
  time:           string;
  namaLesen:      string;
  noLesenMPOB:    string;
  noKenderaan:    string;
  noTiketTimbang: number;
  bilanganSampel: number;
  beratBersih:    number;
  purataBerat:    number;
  boer:           number;
  bker:           number;
  tandanMasak:    GradingRow;
  tandanMengkal:  GradingRow;
  tandanBusuk:    GradingRow;
  tandanKosong:   GradingRow;
  jumlahB:        GradingRow;
  tandanKotor:    GradingRow;
  tandanLama:     GradingRow;
  tandanDura:     GradingRow;
  tandanTangkai:  GradingRow;
  partenokarpi:   GradingRow;
  jumlahC:        GradingRow;
  jumlahBesar:    GradingRow;
  goer:           number;
  catatan:        string;
  namaPenggred:   string;
  namaPemandu:    string;
  photos:         (string | null)[];
}