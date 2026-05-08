import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, MILL_NAME } from '../../constants/theme';
import { getRecord } from '../../services/db';
import { shareTicketPDF } from '../../services/pdf';
import { GradingRecord, GradingRow } from '../../types/grading';

function fmt(v: any) { return (v === null || v === undefined || v === '') ? '—' : String(v); }
function fmtD(d: string) {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  return `${day}.${m}.${y.slice(2)}`;
}

function InfoRow({ label, value, shade }: { label: string; value: string; shade?: boolean }) {
  return (
    <View style={[t.row, shade && t.shaded]}>
      <Text style={t.lbl}>{label}</Text>
      <Text style={t.val}>{value}</Text>
    </View>
  );
}

function GradeRow({ label, data, shade, last }: { label: string; data?: GradingRow; shade?: boolean; last?: boolean }) {
  return (
    <View style={[t.gRow, shade && t.shaded, last && t.last]}>
      <Text style={t.gLbl}>{label}</Text>
      <Text style={t.gVal}>{fmt(data?.bil)}</Text>
      <Text style={t.gVal}>{fmt(data?.pct)}</Text>
    </View>
  );
}

export default function TicketDetailScreen() {
  const { id }  = useLocalSearchParams<{ id: string }>();
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const [rec, setRec]       = useState<GradingRecord | null>(null);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    if (id) getRecord(id).then(setRec);
  }, [id]);

  async function handleShare() {
    if (!rec) return;
    setSharing(true);
    try {
      await shareTicketPDF(rec);
    } catch (e: any) {
      if (e?.message !== 'User canceled') {
        Alert.alert('Ralat', 'Gagal menjana PDF.');
      }
    } finally {
      setSharing(false);
    }
  }

  if (!rec) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.warm }}>
        <ActivityIndicator color={COLORS.accent} size="large" />
      </View>
    );
  }

  return (
    <View style={t.screen}>
      {/* Header */}
      <View style={[t.header, { paddingTop: insets.top + 14 }]}>
        <View style={t.headerRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <TouchableOpacity style={t.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
              <Ionicons name="arrow-back" size={20} color={COLORS.gold} />
            </TouchableOpacity>
            <View>
              <Text style={t.headerSub}>Tiket Penggredan</Text>
              <Text style={t.headerSno}>#{rec.id}</Text>
            </View>
          </View>
          <TouchableOpacity style={t.shareBtn} onPress={handleShare} disabled={sharing} activeOpacity={0.8}>
            {sharing
              ? <ActivityIndicator size="small" color={COLORS.gold} />
              : <>
                  <Ionicons name="share-outline" size={18} color={COLORS.gold} />
                  <Text style={t.shareTxt}>Kongsi</Text>
                </>
            }
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={t.scroll} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

        {/* Banner */}
        <View style={t.banner}>
          <Text style={t.bannerMill}>{MILL_NAME}</Text>
          <Text style={t.bannerForm}>Borang Penggredan</Text>
          <View style={t.snoBadge}>
            <Text style={t.snoTxt}>#{rec.id}</Text>
          </View>
        </View>

        {/* Info */}
        <View style={t.card}>
          <View style={t.dtRow}>
            <View style={t.dtCell}>
              <Text style={t.dtLbl}>Tarikh</Text>
              <Text style={t.dtVal}>{fmtD(rec.date)}</Text>
            </View>
            <View style={[t.dtCell, { borderLeftWidth: 1.5, borderLeftColor: COLORS.border }]}>
              <Text style={t.dtLbl}>Masa</Text>
              <Text style={t.dtVal}>{rec.time || '—'}</Text>
            </View>
          </View>
          <InfoRow label="Nama Pembekal"     value={fmt(rec.namaLesen)} />
          <InfoRow label="No. Lesen MPOB"    value={fmt(rec.noLesenMPOB)}     shade />
          <InfoRow label="No. Kenderaan"     value={fmt(rec.noKenderaan)} />
          <InfoRow label="No. Tiket Timbang" value={fmt(rec.noTiketTimbang)}  shade />
          <InfoRow label="Bilangan Sampel"   value={fmt(rec.bilanganSampel)} />
          <InfoRow label="Berat Bersih (KG)" value={fmt(rec.beratBersih)}     shade />
        </View>

        {/* Penetapan */}
        <View style={t.card}>
          <View style={t.cardHd}><Text style={t.cardHdTxt}>Penetapan Kadar Perahan Asas</Text></View>
          <InfoRow label="Purata Berat Tandan" value={fmt(rec.purataBerat) + ' KG'} />
          <InfoRow label="BOER"                value={fmt(rec.boer) + ' %'}          shade />
          <InfoRow label="BKER"                value={fmt(rec.bker) + ' %'} />
        </View>

        {/* Section A */}
        <View style={t.card}>
          <View style={t.cardHd}><Text style={t.cardHdTxt}>Muatan Basah / Tandan Tidak Segar</Text></View>
          <View style={t.gHead}>
            <Text style={[t.gHCol, { flex: 2, textAlign: 'left' }]}>Penggredan</Text>
            <Text style={t.gHCol}>Bil.</Text>
            <Text style={t.gHCol}>%</Text>
          </View>
          <GradeRow label="(1) Tandan Masak"   data={rec.tandanMasak} />
          <GradeRow label="(2) Tandan Mengkal"  data={rec.tandanMengkal}  shade />
          <GradeRow label="(3) Tandan Busuk"    data={rec.tandanBusuk} />
          <GradeRow label="(4) Tandan Kosong"   data={rec.tandanKosong}   shade last />
          <View style={t.totRow}>
            <Text style={t.totLbl}>JUMLAH (B)</Text>
            <Text style={t.totVal}>{fmt(rec.jumlahB?.bil)}</Text>
            <Text style={t.totVal}>{fmt(rec.jumlahB?.pct)}</Text>
          </View>
        </View>

        {/* Section B */}
        <View style={t.card}>
          <View style={[t.cardHd, { backgroundColor: COLORS.mid }]}><Text style={t.cardHdTxt}>Kualiti Tandan</Text></View>
          <View style={t.gHead}>
            <Text style={[t.gHCol, { flex: 2, textAlign: 'left' }]}>Penggredan</Text>
            <Text style={t.gHCol}>Bil.</Text>
            <Text style={t.gHCol}>%</Text>
          </View>
          <GradeRow label="(1) Tandan Kotor"    data={rec.tandanKotor} />
          <GradeRow label="(2) Tandan Lama"     data={rec.tandanLama}     shade />
          <GradeRow label="(3) Tandan Dura"     data={rec.tandanDura} />
          <GradeRow label="(4) Tangkai Panjang" data={rec.tandanTangkai}  shade />
          <GradeRow label="(5) Partenokarpi"    data={rec.partenokarpi}   last />
          <View style={t.totRow}>
            <Text style={t.totLbl}>JUMLAH (C)</Text>
            <Text style={t.totVal}>{fmt(rec.jumlahC?.bil)}</Text>
            <Text style={t.totVal}>{fmt(rec.jumlahC?.pct)}</Text>
          </View>
          <View style={t.grandRow}>
            <Text style={t.grandLbl}>JUMLAH BESAR (A+B+C)</Text>
            <Text style={t.grandVal}>{fmt(rec.jumlahBesar?.bil)}</Text>
            <Text style={t.grandVal}>{fmt(rec.jumlahBesar?.pct)}</Text>
          </View>
        </View>

        {/* Summary */}
        <View style={t.card}>
          <InfoRow label="GOER" value={fmt(rec.goer)} />
          {rec.catatan ? (
            <View style={{ padding: 14, borderTopWidth: 1, borderTopColor: COLORS.border }}>
              <Text style={t.lbl}>Catatan</Text>
              <Text style={{ fontSize: 14, fontStyle: 'italic', color: COLORS.dark, marginTop: 4 }}>{rec.catatan}</Text>
            </View>
          ) : null}
          <View style={{ flexDirection: 'row', padding: 14, gap: 12, borderTopWidth: 1, borderTopColor: COLORS.border }}>
            <View style={{ flex: 1 }}>
              <Text style={t.lbl}>Nama Penggred</Text>
              <Text style={t.sigVal}>{fmt(rec.namaPenggred)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={t.lbl}>Pemandu / Pemilik</Text>
              <Text style={t.sigVal}>{fmt(rec.namaPemandu)}</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const t = StyleSheet.create({
  screen:    { flex: 1, backgroundColor: COLORS.warm },
  header:    { backgroundColor: COLORS.dark, paddingHorizontal: 20, paddingBottom: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  backBtn:   { width: 40, height: 40, borderRadius: 8, backgroundColor: 'rgba(240,217,106,0.12)', alignItems: 'center', justifyContent: 'center' },
  headerSub: { color: 'rgba(240,217,106,0.55)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 },
  headerSno: { color: COLORS.gold, fontSize: 18, fontWeight: '700', letterSpacing: 2 },
  shareBtn:  { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: 'rgba(196,154,10,0.18)', borderWidth: 1.5, borderColor: 'rgba(196,154,10,0.55)', borderRadius: 9, paddingHorizontal: 14, paddingVertical: 9 },
  shareTxt:  { color: COLORS.gold, fontSize: 13, fontWeight: '700' },
  scroll:    { flex: 1 },
  banner:    { backgroundColor: COLORS.dark, margin: 14, borderRadius: 10, padding: 16, alignItems: 'center', borderWidth: 1.5, borderColor: COLORS.mid },
  bannerMill:{ color: 'rgba(240,217,106,0.55)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 },
  bannerForm:{ color: '#fff', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 },
  snoBadge:  { backgroundColor: COLORS.accent, paddingHorizontal: 22, paddingVertical: 7, borderRadius: 6 },
  snoTxt:    { color: COLORS.dark, fontFamily: 'monospace', fontSize: 20, fontWeight: '700', letterSpacing: 3 },
  card:      { backgroundColor: COLORS.surface, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 10, overflow: 'hidden', marginHorizontal: 14, marginBottom: 12 },
  cardHd:    { backgroundColor: COLORS.dark, paddingVertical: 9, paddingHorizontal: 14 },
  cardHdTxt: { color: COLORS.gold, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  dtRow:     { flexDirection: 'row' },
  dtCell:    { flex: 1, padding: 12 },
  dtLbl:     { fontSize: 10, fontWeight: '700', color: COLORS.muted, textTransform: 'uppercase', marginBottom: 4 },
  dtVal:     { fontSize: 17, fontWeight: '700', color: COLORS.dark },
  row:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderTopWidth: 1, borderTopColor: COLORS.border },
  shaded:    { backgroundColor: '#FBF7EC' },
  last:      { borderBottomWidth: 0 },
  lbl:       { fontSize: 11, fontWeight: '700', color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.3 },
  val:       { fontSize: 15, fontWeight: '700', color: COLORS.dark, textAlign: 'right' },
  sigVal:    { fontSize: 14, fontWeight: '700', color: COLORS.dark, marginTop: 4 },
  gHead:     { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#F5EFD6', borderTopWidth: 1, borderTopColor: COLORS.border },
  gHCol:     { flex: 1, fontSize: 10, fontWeight: '700', color: COLORS.mid, textTransform: 'uppercase', textAlign: 'center' },
  gRow:      { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 9, borderTopWidth: 1, borderTopColor: COLORS.border },
  gLbl:      { flex: 2, fontSize: 12, fontWeight: '700', color: COLORS.dark },
  gVal:      { flex: 1, fontSize: 13, fontWeight: '700', color: COLORS.dark, textAlign: 'center' },
  totRow:    { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 9, backgroundColor: '#F0E8B0', borderTopWidth: 1.5, borderTopColor: COLORS.accent },
  totLbl:    { flex: 2, fontSize: 12, fontWeight: '700', color: COLORS.dark },
  totVal:    { flex: 1, fontSize: 13, fontWeight: '700', color: COLORS.dark, textAlign: 'center' },
  grandRow:  { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 9, backgroundColor: COLORS.dark, borderTopWidth: 1.5, borderTopColor: COLORS.accent },
  grandLbl:  { flex: 2, fontSize: 12, fontWeight: '700', color: COLORS.gold },
  grandVal:  { flex: 1, fontSize: 13, fontWeight: '700', color: COLORS.gold, textAlign: 'center' },
});