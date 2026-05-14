import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Image, Alert, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEffect, useState, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, MILL_NAME } from '../../constants/theme';
import { getRecord } from '../../services/db';
import { uploadSingle } from '../../services/upload';
import { GradingRecord, GradingRow } from '../../types/grading';
import SyncBadge from '../../components/SyncBadge';
import { useRefreshOnFocus } from '../../hooks/useRefreshOnFocus';

function fmt(v: any) { return (v === null || v === undefined || v === '') ? '—' : String(v); }
function fmtD(d: string) {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  return `${day}.${m}.${y.slice(2)}`;
}
function fmtDT(iso: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${pad2(d.getDate())}.${pad2(d.getMonth()+1)}.${String(d.getFullYear()).slice(2)}  ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}
function pad2(n: number) { return String(n).padStart(2,'0'); }

function InfoRow({ label, value, shade }: { label: string; value: string; shade?: boolean }) {
  return (
    <View style={[r.row, shade && r.shaded]}>
      <Text style={r.lbl}>{label}</Text>
      <Text style={r.val}>{value}</Text>
    </View>
  );
}

function GradeRow({ label, data, shade, last }: { label: string; data?: GradingRow; shade?: boolean; last?: boolean }) {
  return (
    <View style={[r.gRow, shade && r.shaded, last && r.last]}>
      <Text style={r.gLbl}>{label}</Text>
      <Text style={r.gVal}>{fmt(data?.bil)}</Text>
      <Text style={r.gVal}>{fmt(data?.pct)}</Text>
    </View>
  );
}

function TotRow({ label, data }: { label: string; data?: GradingRow }) {
  return (
    <View style={r.totRow}>
      <Text style={r.totLbl}>{label}</Text>
      <Text style={r.totVal}>{fmt(data?.bil)}</Text>
      <Text style={r.totVal}>{fmt(data?.pct)}</Text>
    </View>
  );
}

function GrandRow({ label, data }: { label: string; data?: GradingRow }) {
  return (
    <View style={r.grandRow}>
      <Text style={r.grandLbl}>{label}</Text>
      <Text style={r.grandVal}>{fmt(data?.bil)}</Text>
      <Text style={r.grandVal}>{fmt(data?.pct)}</Text>
    </View>
  );
}

export default function HistoryDetailScreen() {
  const { id }  = useLocalSearchParams<{ id: string }>();
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const [rec, setRec]           = useState<GradingRecord | null>(null);
  const [retrying, setRetry]    = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // ── Always reload on focus so edits are immediately reflected ──
  const loadRecord = useCallback(async () => {
    if (id) {
      const data = await getRecord(id);
      setRec(data);
    }
  }, [id]);

  useEffect(() => { loadRecord(); }, [loadRecord]);
  useRefreshOnFocus(loadRecord);

  async function handleRetry() {
    if (!rec) return;
    setRetry(true);
    const ok = await uploadSingle(rec);
    await loadRecord();
    setRetry(false);
    Alert.alert(ok ? 'Berjaya' : 'Gagal', ok ? 'Rekod berjaya dimuat naik.' : 'Muat naik gagal.');
  }

  if (!rec) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.warm }}>
        <ActivityIndicator color={COLORS.accent} size="large" />
      </View>
    );
  }

  const status = rec.isDraft ? 'draft' : rec.syncStatus;

  return (
    <View style={r.screen}>
      {/* Header */}
      <View style={[r.header, { paddingTop: insets.top + 14 }]}>
        <View style={r.headerRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <TouchableOpacity style={r.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
              <Ionicons name="arrow-back" size={20} color={COLORS.gold} />
            </TouchableOpacity>
            <View>
              <Text style={r.headerSub}>{rec.isDraft ? 'Draf' : 'Rekod Penggredan'}</Text>
              <Text style={r.headerSno}>#{rec.id}</Text>
            </View>
          </View>
          {!rec.isDraft && (
            <TouchableOpacity
              style={r.editBtn}
              onPress={() => router.push(`/form?editId=${rec.id}`)}
              activeOpacity={0.8}
            >
              <Ionicons name="pencil-outline" size={17} color={COLORS.gold} />
              <Text style={r.editBtnTxt}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={r.scroll} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

        {/* Banner */}
        <View style={r.banner}>
          <View style={r.bannerTop}>
            <View>
              <Text style={r.bannerMill}>{MILL_NAME}</Text>
              <Text style={r.bannerForm}>Borang Penggredan</Text>
            </View>
            <SyncBadge status={status} isEdited={rec.isEdited} />
          </View>
          <View style={r.snoBadge}>
            <Text style={r.snoTxt}>#{rec.id}</Text>
          </View>
          {/* Edit count indicator */}
          {rec.isEdited && rec.editCount > 0 && (
            <Text style={r.editCountTxt}>
              Versi {rec.editCount + 1}  ·  Diedit {rec.editCount}x
            </Text>
          )}
        </View>

        {/* Info */}
        <View style={r.card}>
          <View style={r.dtRow}>
            <View style={r.dtCell}>
              <Text style={r.dtLbl}>Tarikh</Text>
              <Text style={r.dtVal}>{fmtD(rec.date)}</Text>
            </View>
            <View style={[r.dtCell, { borderLeftWidth: 1.5, borderLeftColor: COLORS.border }]}>
              <Text style={r.dtLbl}>Masa</Text>
              <Text style={r.dtVal}>{rec.time || '—'}</Text>
            </View>
          </View>
          <InfoRow label="Nama Pembekal"     value={fmt(rec.namaLesen)} />
          <InfoRow label="No. Lesen MPOB"    value={fmt(rec.noLesenMPOB)}    shade />
          <InfoRow label="No. Kenderaan"     value={fmt(rec.noKenderaan)} />
          <InfoRow label="No. Tiket Timbang" value={fmt(rec.noTiketTimbang)} shade />
          <InfoRow label="Bilangan Sampel"   value={fmt(rec.bilanganSampel)} />
          <InfoRow label="Berat Bersih (KG)" value={fmt(rec.beratBersih)}    shade />
        </View>

        {/* Penetapan */}
        <View style={r.card}>
          <View style={r.cardHd}><Text style={r.cardHdTxt}>Penetapan Kadar Perahan Asas</Text></View>
          <InfoRow label="Purata Berat Tandan" value={fmt(rec.purataBerat) + ' KG'} />
          <InfoRow label="BOER"                value={fmt(rec.boer) + ' %'}          shade />
          <InfoRow label="BKER"                value={fmt(rec.bker) + ' %'} />
        </View>

        {/* Section A */}
        <View style={r.card}>
          <View style={r.cardHd}><Text style={r.cardHdTxt}>Muatan Basah / Tandan Tidak Segar</Text></View>
          <View style={r.gHead}>
            <Text style={[r.gHCol, { flex: 2, textAlign: 'left' }]}>Penggredan</Text>
            <Text style={r.gHCol}>Bil.</Text>
            <Text style={r.gHCol}>%</Text>
          </View>
          <GradeRow label="(1) Tandan Masak"   data={rec.tandanMasak} />
          <GradeRow label="(2) Tandan Mengkal"  data={rec.tandanMengkal}  shade />
          <GradeRow label="(3) Tandan Busuk"    data={rec.tandanBusuk} />
          <GradeRow label="(4) Tandan Kosong"   data={rec.tandanKosong}   shade last />
          <TotRow label="JUMLAH (B)" data={rec.jumlahB} />
        </View>

        {/* Section B */}
        <View style={r.card}>
          <View style={[r.cardHd, { backgroundColor: COLORS.mid }]}><Text style={r.cardHdTxt}>Kualiti Tandan</Text></View>
          <View style={r.gHead}>
            <Text style={[r.gHCol, { flex: 2, textAlign: 'left' }]}>Penggredan</Text>
            <Text style={r.gHCol}>Bil.</Text>
            <Text style={r.gHCol}>%</Text>
          </View>
          <GradeRow label="(1) Tandan Kotor"    data={rec.tandanKotor} />
          <GradeRow label="(2) Tandan Lama"     data={rec.tandanLama}     shade />
          <GradeRow label="(3) Tandan Dura"     data={rec.tandanDura} />
          <GradeRow label="(4) Tangkai Panjang" data={rec.tandanTangkai}  shade />
          <GradeRow label="(5) Partenokarpi"    data={rec.partenokarpi}   last />
          <TotRow label="JUMLAH (C)" data={rec.jumlahC} />
          <GrandRow label="JUMLAH BESAR (A+B+C)" data={rec.jumlahBesar} />
        </View>

        {/* Summary */}
        <View style={r.card}>
          <InfoRow label="GOER" value={fmt(rec.goer)} />
          {rec.catatan ? (
            <View style={{ padding: 14, borderTopWidth: 1, borderTopColor: COLORS.border }}>
              <Text style={r.lbl}>Catatan</Text>
              <Text style={{ fontSize: 14, fontStyle: 'italic', color: COLORS.dark, marginTop: 4 }}>{rec.catatan}</Text>
            </View>
          ) : null}
          <View style={{ flexDirection: 'row', padding: 14, gap: 12, borderTopWidth: 1, borderTopColor: COLORS.border }}>
            <View style={{ flex: 1 }}>
              <Text style={r.lbl}>Nama Penggred</Text>
              <Text style={r.sigVal}>{fmt(rec.namaPenggred)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={r.lbl}>Pemandu / Pemilik</Text>
              <Text style={r.sigVal}>{fmt(rec.namaPemandu)}</Text>
            </View>
          </View>
        </View>

        {/* Photos */}
        {(rec.photos || []).some(Boolean) && (
          <View style={r.card}>
            <View style={r.cardHd}><Text style={r.cardHdTxt}>Gambar FFB</Text></View>
            <View style={{ flexDirection: 'row', gap: 8, padding: 12 }}>
              {(rec.photos || [null, null, null]).map((p, i) =>
                p ? (
                  <Image key={i} source={{ uri: p }} style={r.photo} />
                ) : (
                  <View key={i} style={r.photoEmpty}>
                    <Ionicons name="image-outline" size={22} color={COLORS.muted} style={{ opacity: 0.4 }} />
                  </View>
                )
              )}
            </View>
          </View>
        )}

        {/* ── Edit History Timeline ────────────────────────────── */}
        {rec.isEdited && rec.editCount > 0 && (
          <View style={r.card}>

            {/* Toggle header — always visible */}
            <TouchableOpacity
              style={r.historyHeader}
              onPress={() => setShowHistory(v => !v)}
              activeOpacity={0.7}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="time-outline" size={16} color={COLORS.gold} />
                <Text style={r.historyTitle}>Riwayat Edit ({rec.editCount}x)</Text>
              </View>
              <Ionicons
                name={showHistory ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={COLORS.accent}
              />
            </TouchableOpacity>

            {/* Expandable body — only renders when showHistory is true */}
            {showHistory && (
              <View style={r.historyBody}>

                {/* Current version — colour driven by sync status */}
                {(() => {
                  const STATUS_CONFIG: Record<string, { dot: string; border: string; note: string }> = {
                    synced:  { dot: COLORS.syncedBg, border: COLORS.synced,  note: 'Diedit dan disegerakkan'   },
                    pending: { dot: '#FFF3CD',       border: '#F0C040',      note: 'Diedit — menunggu sync'    },
                    failed:  { dot: COLORS.failedBg, border: COLORS.failed,  note: 'Diedit — muat naik gagal'  },
                    draft:   { dot: '#EEF2F7',       border: '#94A3B8',      note: 'Draf — belum dihantar'     },
                  };
                  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
                  return (
                    <View style={r.timelineRow}>
                      <View style={[r.timelineDot, { backgroundColor: cfg.dot, borderColor: cfg.border }]} />
                      <View style={r.timelineLine} />
                      <View style={r.timelineContent}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                          <Text style={r.timelineLabel}>Versi semasa</Text>
                          <View style={[r.versionPill, { backgroundColor: cfg.dot, borderColor: cfg.border }]}>
                            <Text style={[r.versionPillTxt, { color: cfg.border }]}>
                              V{rec.editCount + 1}
                            </Text>
                          </View>
                        </View>
                        <Text style={r.timelineTime}>
                          {rec.editedAt ? fmtDT(rec.editedAt) : '—'}
                        </Text>
                        <Text style={r.timelineNote}>{cfg.note}</Text>
                      </View>
                    </View>
                  );
                })()}

                {/* Original version — always synced/submitted */}
                <View style={[r.timelineRow, { marginBottom: 0 }]}>
                  <View style={[r.timelineDot, {
                    backgroundColor: COLORS.syncedBg,
                    borderColor:     COLORS.synced,
                  }]} />
                  <View style={r.timelineContent}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <Text style={r.timelineLabel}>Rekod asal</Text>
                      <View style={[r.versionPill, {
                        backgroundColor: COLORS.syncedBg,
                        borderColor:     COLORS.synced,
                      }]}>
                        <Text style={[r.versionPillTxt, { color: COLORS.synced }]}>V1</Text>
                      </View>
                    </View>
                    <Text style={r.timelineTime}>
                      {fmtD(rec.date)} · {rec.time}
                    </Text>
                    <Text style={r.timelineNote}>Dihantar dan disegerakkan</Text>
                  </View>
                </View>

              </View>
            )}

          </View>
        )}

        {/* Sync strip */}
        {!rec.isDraft && (
          <View style={r.syncStrip}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Ionicons
                name={rec.syncStatus === 'synced' ? 'cloud-done-outline' : rec.syncStatus === 'failed' ? 'cloud-offline-outline' : 'cloud-upload-outline'}
                size={26} color={COLORS.accent}
              />
              <View>
                <Text style={r.syncTitle}>
                  {rec.syncStatus === 'synced' ? 'Berjaya Dimuat Naik' : rec.syncStatus === 'failed' ? 'Muat Naik Gagal' : 'Menunggu Muat Naik'}
                </Text>
                <Text style={r.syncSub}>
                  {rec.syncStatus === 'synced' ? 'Data telah disegerakkan' : 'Akan dicuba apabila dalam talian'}
                </Text>
              </View>
            </View>
            {rec.syncStatus !== 'synced' && (
              <TouchableOpacity style={r.retryBtn} onPress={handleRetry} disabled={retrying}>
                {retrying
                  ? <ActivityIndicator size="small" color={COLORS.gold} />
                  : <Text style={r.retryTxt}>Retry</Text>
                }
              </TouchableOpacity>
            )}
          </View>
        )}

      </ScrollView>
    </View>
  );
}

const r = StyleSheet.create({
  screen:       { flex: 1, backgroundColor: COLORS.warm },
  header:       { backgroundColor: COLORS.dark, paddingHorizontal: 20, paddingBottom: 16 },
  headerRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn:      { width: 40, height: 40, borderRadius: 8, backgroundColor: 'rgba(240,217,106,0.12)', alignItems: 'center', justifyContent: 'center' },
  headerSub:    { color: 'rgba(240,217,106,0.55)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 },
  headerSno:    { color: COLORS.gold, fontSize: 17, fontWeight: '700', letterSpacing: 2, fontVariant: ['tabular-nums'] },
  editBtn:      { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(196,154,10,0.18)', borderWidth: 1.5, borderColor: 'rgba(196,154,10,0.55)', borderRadius: 9, paddingHorizontal: 14, paddingVertical: 9 },
  editBtnTxt:   { color: COLORS.gold, fontSize: 13, fontWeight: '700' },
  scroll:       { flex: 1 },
  banner:       { backgroundColor: COLORS.dark, margin: 14, borderRadius: 10, padding: 14, borderWidth: 1.5, borderColor: COLORS.mid },
  bannerTop:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  bannerMill:   { color: 'rgba(240,217,106,0.55)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 },
  bannerForm:   { color: '#fff', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5 },
  snoBadge:     { backgroundColor: COLORS.accent, alignSelf: 'flex-start', paddingHorizontal: 18, paddingVertical: 6, borderRadius: 6, marginBottom: 6 },
  snoTxt:       { color: COLORS.dark, fontFamily: 'monospace', fontSize: 18, fontWeight: '700', letterSpacing: 3 },
  editCountTxt: { color: 'rgba(240,217,106,0.55)', fontSize: 11, marginTop: 4 },
  card:         { backgroundColor: COLORS.surface, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 10, overflow: 'hidden', marginHorizontal: 14, marginBottom: 12 },
  cardHd:       { backgroundColor: COLORS.dark, paddingVertical: 9, paddingHorizontal: 14 },
  cardHdTxt:    { color: COLORS.gold, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  dtRow:        { flexDirection: 'row' },
  dtCell:       { flex: 1, padding: 12 },
  dtLbl:        { fontSize: 10, fontWeight: '700', color: COLORS.muted, textTransform: 'uppercase', marginBottom: 4 },
  dtVal:        { fontSize: 17, fontWeight: '700', color: COLORS.dark },
  row:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderTopWidth: 1, borderTopColor: COLORS.border },
  shaded:       { backgroundColor: '#FBF7EC' },
  last:         { borderBottomWidth: 0 },
  lbl:          { fontSize: 11, fontWeight: '700', color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.3 },
  val:          { fontSize: 15, fontWeight: '700', color: COLORS.dark, textAlign: 'right' },
  sigVal:       { fontSize: 14, fontWeight: '700', color: COLORS.dark, marginTop: 4 },
  gHead:        { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#F5EFD6', borderTopWidth: 1, borderTopColor: COLORS.border },
  gHCol:        { flex: 1, fontSize: 10, fontWeight: '700', color: COLORS.mid, textTransform: 'uppercase', textAlign: 'center' },
  gRow:         { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 9, borderTopWidth: 1, borderTopColor: COLORS.border },
  gLbl:         { flex: 2, fontSize: 12, fontWeight: '700', color: COLORS.dark },
  gVal:         { flex: 1, fontSize: 13, fontWeight: '700', color: COLORS.dark, textAlign: 'center' },
  totRow:       { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 9, backgroundColor: '#F0E8B0', borderTopWidth: 1.5, borderTopColor: COLORS.accent },
  totLbl:       { flex: 2, fontSize: 12, fontWeight: '700', color: COLORS.dark },
  totVal:       { flex: 1, fontSize: 13, fontWeight: '700', color: COLORS.dark, textAlign: 'center' },
  grandRow:     { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 9, backgroundColor: COLORS.dark, borderTopWidth: 1.5, borderTopColor: COLORS.accent },
  grandLbl:     { flex: 2, fontSize: 12, fontWeight: '700', color: COLORS.gold },
  grandVal:     { flex: 1, fontSize: 13, fontWeight: '700', color: COLORS.gold, textAlign: 'center' },
  photo:        { flex: 1, aspectRatio: 1, borderRadius: 8, borderWidth: 1.5, borderColor: COLORS.border },
  photoEmpty:   { flex: 1, aspectRatio: 1, borderRadius: 8, backgroundColor: '#F5EFD6', borderWidth: 1.5, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },

  // Edit history timeline
  historyHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, backgroundColor: COLORS.dark },
  historyTitle:   { color: COLORS.gold, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  historyBody:    { padding: 16 },
  timelineRow:    { flexDirection: 'row', marginBottom: 20, position: 'relative' },
  timelineDot:    { width: 12, height: 12, borderRadius: 6, backgroundColor: '#FFF3CD', borderWidth: 2, borderColor: '#F0C040', marginTop: 3, marginRight: 12, flexShrink: 0 },
  timelineLine:   { position: 'absolute', left: 5, top: 15, width: 2, height: 36, backgroundColor: COLORS.border },
  timelineContent:{ flex: 1 },
  timelineLabel:  { fontSize: 13, fontWeight: '700', color: COLORS.dark },
  timelineTime:   { fontSize: 12, color: COLORS.muted, marginTop: 2 },
  timelineNote:   { fontSize: 11, color: COLORS.muted, fontStyle: 'italic', marginTop: 2 },
  versionPill:    { backgroundColor: '#FFF3CD', borderWidth: 1, borderColor: '#F0C040', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 },
  versionPillTxt: { fontSize: 10, fontWeight: '700', color: '#5B4300' },

  syncStrip:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(196,154,10,0.09)', borderWidth: 2, borderColor: 'rgba(196,154,10,0.4)', borderRadius: 10, padding: 14, marginHorizontal: 14, marginBottom: 24 },
  syncTitle:    { fontSize: 13, fontWeight: '700', color: COLORS.pending },
  syncSub:      { fontSize: 12, color: '#9C7200' },
  retryBtn:     { backgroundColor: COLORS.dark, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 9 },
  retryTxt:     { fontSize: 12, fontWeight: '700', color: COLORS.gold },
});