export type SyncStatus = 'pending' | 'synced' | 'failed';

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

  // Edit tracking
  isEdited:       boolean;
  editCount:      number;
  editedAt:       string | null;

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