import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, MILL_NAME } from '../constants/theme';
import { GradingRecord, GradingRow } from '../types/grading';
import { saveRecord } from '../services/db';
import { peekNextSNO, claimSNO } from '../services/serial';
import GradingTableRow from '../components/GradingTableRow';
import Stepper from '../components/Stepper';
import { useFocusEffect } from 'expo-router';


const EMPTY_ROW: GradingRow = { bil: 0, pct: 0, penalti: 0 };

function todayStr() { return new Date().toISOString().split('T')[0]; }
function nowTime()  {
  const n = new Date();
  return `${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}`;
}

export default function FormScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [sno,     setSno]     = useState('...');
  const [saving,  setSaving]  = useState(false);

  // Header fields
  const [date,    setDate]    = useState(todayStr());
  const [time,    setTime]    = useState(nowTime());

  // Supplier
  const [namaLesen,      setNamaLesen]      = useState('');
  const [noLesenMPOB,    setNoLesenMPOB]    = useState('');
  const [noKenderaan,    setNoKenderaan]    = useState('');
  const [noTiket,        setNoTiket]        = useState(0);
  const [bilSampel,      setBilSampel]      = useState(0);
  const [beratBersih,    setBeratBersih]    = useState(0);

  // Penetapan
  const [purataBerat,    setPurataBerat]    = useState(0);
  const [boer,           setBoer]           = useState(0);
  const [bker,           setBker]           = useState(0);

  // Section A
  const [tandanMasak,   setTandanMasak]    = useState<GradingRow>({...EMPTY_ROW});
  const [tandanMengkal, setTandanMengkal]  = useState<GradingRow>({...EMPTY_ROW});
  const [tandanBusuk,   setTandanBusuk]    = useState<GradingRow>({...EMPTY_ROW});
  const [tandanKosong,  setTandanKosong]   = useState<GradingRow>({...EMPTY_ROW});

  // Section B
  const [tandanKotor,   setTandanKotor]    = useState<GradingRow>({...EMPTY_ROW});
  const [tandanLama,    setTandanLama]     = useState<GradingRow>({...EMPTY_ROW});
  const [tandanDura,    setTandanDura]     = useState<GradingRow>({...EMPTY_ROW});
  const [tandanTangkai, setTandanTangkai]  = useState<GradingRow>({...EMPTY_ROW});
  const [partenokarpi,  setPartenokarpi]   = useState<GradingRow>({...EMPTY_ROW});

  // Totals (computed)
  const [goer,          setGoer]           = useState(0);
  const [catatan,       setCatatan]        = useState('');
  const [namaPenggred,  setNamaPenggred]   = useState('');
  const [namaPemandu,   setNamaPemandu]    = useState('');

  // Photos
  const [photos, setPhotos] = useState<(string|null)[]>([null, null, null]);

  useFocusEffect(
    useCallback(() => {
      setDate(todayStr());
      setTime(nowTime());
      setNamaLesen('');
      setNoLesenMPOB('');
      setNoKenderaan('');
      setNoTiket(0);
      setBilSampel(0);
      setBeratBersih(0);
      setPurataBerat(0);
      setBoer(0);
      setBker(0);
      setTandanMasak({...EMPTY_ROW});
      setTandanMengkal({...EMPTY_ROW});
      setTandanBusuk({...EMPTY_ROW});
      setTandanKosong({...EMPTY_ROW});
      setTandanKotor({...EMPTY_ROW});
      setTandanLama({...EMPTY_ROW});
      setTandanDura({...EMPTY_ROW});
      setTandanTangkai({...EMPTY_ROW});
      setPartenokarpi({...EMPTY_ROW});
      setGoer(0);
      setCatatan('');
      setNamaPenggred('');
      setNamaPemandu('');
      setPhotos([null, null, null]);
      peekNextSNO().then(setSno);
    }, [])
  );

  useEffect(() => {
    peekNextSNO().then(setSno);
  }, []);

  // Live totals
  const jumlahB: GradingRow = {
    bil:     tandanMasak.bil + tandanMengkal.bil + tandanBusuk.bil + tandanKosong.bil,
    pct:     tandanMasak.pct + tandanMengkal.pct + tandanBusuk.pct + tandanKosong.pct,
    penalti: tandanMasak.penalti + tandanMengkal.penalti + tandanBusuk.penalti + tandanKosong.penalti,
  };
  const jumlahC: GradingRow = {
    bil:     tandanKotor.bil + tandanLama.bil + tandanDura.bil + tandanTangkai.bil + partenokarpi.bil,
    pct:     tandanKotor.pct + tandanLama.pct + tandanDura.pct + tandanTangkai.pct + partenokarpi.pct,
    penalti: tandanKotor.penalti + tandanLama.penalti + tandanDura.penalti + tandanTangkai.penalti + partenokarpi.penalti,
  };
  const jumlahBesar: GradingRow = {
    bil:     jumlahB.bil + jumlahC.bil,
    pct:     jumlahB.pct + jumlahC.pct,
    penalti: jumlahB.penalti + jumlahC.penalti,
  };

  async function pickPhoto(slot: number) {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Kebenaran diperlukan', 'Sila benarkan akses kamera.');
      return;
    }
    Alert.alert('Pilih Sumber', 'Ambil gambar dari:', [
      {
        text: 'Kamera', onPress: async () => {
          const res = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.6, base64: true,
          });
          if (!res.canceled && res.assets[0].base64) {
            const updated = [...photos];
            updated[slot] = 'data:image/jpeg;base64,' + res.assets[0].base64;
            setPhotos(updated);
          }
        }
      },
      {
        text: 'Galeri', onPress: async () => {
          const res = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.6, base64: true,
          });
          if (!res.canceled && res.assets[0].base64) {
            const updated = [...photos];
            updated[slot] = 'data:image/jpeg;base64,' + res.assets[0].base64;
            setPhotos(updated);
          }
        }
      },
      { text: 'Batal', style: 'cancel' },
    ]);
  }

  function removePhoto(slot: number) {
    const updated = [...photos];
    updated[slot] = null;
    setPhotos(updated);
  }

  function validate(): boolean {
    if (!namaLesen.trim()) {
      Alert.alert('Medan diperlukan', 'Sila isi Nama Pembekal.');
      return false;
    }
    if (!noKenderaan.trim()) {
      Alert.alert('Medan diperlukan', 'Sila isi No. Kenderaan.');
      return false;
    }
    return true;
  }

  async function buildRecord(isDraft: boolean): Promise<GradingRecord> {
    const id = isDraft ? await peekNextSNO() : await claimSNO();
    return {
      id, isDraft, syncStatus: 'pending',
      createdAt: new Date().toISOString(),
      date, time,
      namaLesen, noLesenMPOB, noKenderaan,
      noTiketTimbang: noTiket,
      bilanganSampel: bilSampel,
      beratBersih,
      purataBerat, boer, bker,
      tandanMasak, tandanMengkal, tandanBusuk, tandanKosong,
      jumlahB,
      tandanKotor, tandanLama, tandanDura, tandanTangkai, partenokarpi,
      jumlahC, jumlahBesar,
      goer, catatan, namaPenggred, namaPemandu,
      photos,
    };
  }

  async function handleDraft() {
    setSaving(true);
    try {
      const rec = await buildRecord(true);
      await saveRecord(rec);
      Alert.alert('Draf Disimpan', `Borang #${rec.id} disimpan sebagai draf.`);
      router.push('/history');
    } catch (e) {
      Alert.alert('Ralat', 'Gagal menyimpan draf.');
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSaving(true);
    try {
      const rec = await buildRecord(false);
      await saveRecord(rec);
      router.push(`/history/${rec.id}`);
    } catch (e) {
      Alert.alert('Ralat', 'Gagal menghantar borang.');
    } finally {
      setSaving(false);
    }
  }

  // ── UI helpers ──
  const SectionBar = ({ title, lite }: { title: string; lite?: boolean }) => (
    <View style={[s.secBar, lite && s.secBarLite]}>
      <Text style={s.secBarTxt}>{title}</Text>
    </View>
  );

  const TotRow = ({ label, row }: { label: string; row: GradingRow }) => (
    <View style={s.totRow}>
      <Text style={s.totLabel}>{label}</Text>
      <Text style={s.totVal}>{row.bil}</Text>
      <Text style={s.totVal}>{row.pct}</Text>
      <Text style={s.totVal}>{row.penalti.toFixed(2)}</Text>
    </View>
  );

  const GrandRow = ({ label, row }: { label: string; row: GradingRow }) => (
    <View style={s.grandRow}>
      <Text style={s.grandLabel}>{label}</Text>
      <Text style={s.grandVal}>{row.bil}</Text>
      <Text style={s.grandVal}>{row.pct}</Text>
      <Text style={s.grandVal}>{row.penalti.toFixed(2)}</Text>
    </View>
  );

  return (
    <View style={s.screen}>
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 14 }]}>
        <View style={s.headerRow}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={20} color={COLORS.gold} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Borang Penggredan Baru</Text>
        </View>
        <View style={s.snoBadge}>
          <Text style={s.snoLabel}>S/NO</Text>
          <Text style={s.snoVal}>{sno}</Text>
        </View>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Mill banner */}
        <View style={s.millBanner}>
          <Text style={s.millName}>{MILL_NAME}</Text>
          <Text style={s.millForm}>BORANG PENGGREDAN</Text>
        </View>

        {/* Date / Time */}
        <View style={s.dtRow}>
          <View style={s.dtCell}>
            <Text style={s.fLabel}>Tarikh</Text>
            <TextInput
              style={s.dtInput}
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={COLORS.accent}
            />
          </View>
          <View style={s.dtCell}>
            <Text style={s.fLabel}>Masa</Text>
            <TextInput
              style={s.dtInput}
              value={time}
              onChangeText={setTime}
              placeholder="HH:MM"
              placeholderTextColor={COLORS.accent}
            />
          </View>
        </View>

        {/* Supplier info */}
        <View style={s.fr}>
          <Text style={s.fLabel}>Nama Pembekal <Text style={s.req}>*</Text></Text>
          <TextInput style={s.fi} value={namaLesen} onChangeText={setNamaLesen}
            placeholder="e.g. B2A Greligan" placeholderTextColor={COLORS.accent} />
        </View>

        <View style={s.fr}>
          <Text style={s.fLabel}>No. Lesen MPOB</Text>
          <TextInput style={s.fi} value={noLesenMPOB} onChangeText={setNoLesenMPOB}
            placeholder="Nombor lesen MPOB" placeholderTextColor={COLORS.accent} />
        </View>

        <View style={s.fr}>
          <View style={s.g2}>
            <View style={s.g2cell}>
              <Text style={s.fLabel}>No. Kenderaan <Text style={s.req}>*</Text></Text>
              <TextInput style={s.fi} value={noKenderaan} onChangeText={setNoKenderaan}
                placeholder="VCL 7640" placeholderTextColor={COLORS.accent}
                autoCapitalize="characters" />
            </View>
            <View style={s.g2cell}>
              <Text style={s.fLabel}>No. Tiket Timbang</Text>
              <Stepper value={noTiket} onChange={setNoTiket} small />
            </View>
          </View>
        </View>

        <View style={s.fr}>
          <View style={s.g2}>
            <View style={s.g2cell}>
              <Text style={s.fLabel}>Bilangan Sampel</Text>
              <Stepper value={bilSampel} onChange={setBilSampel} small />
            </View>
            <View style={s.g2cell}>
              <Text style={s.fLabel}>Berat Bersih (KG)</Text>
              <Stepper value={beratBersih} onChange={setBeratBersih} small />
            </View>
          </View>
        </View>

        {/* Penetapan */}
        <SectionBar title="Penetapan Kadar Perahan Asas" />
        <View style={s.fr}>
          <Text style={s.fLabel}>i. Purata Berat Tandan (KG)</Text>
          <Stepper value={purataBerat} onChange={setPurataBerat} decimal />
        </View>
        <View style={s.fr}>
          <View style={s.g2}>
            <View style={s.g2cell}>
              <Text style={s.fLabel}>BOER (%)</Text>
              <Stepper value={boer} onChange={setBoer} decimal small />
            </View>
            <View style={s.g2cell}>
              <Text style={s.fLabel}>BKER (%)</Text>
              <Stepper value={bker} onChange={setBker} decimal small />
            </View>
          </View>
        </View>

        {/* Grading table header */}
        <SectionBar title="Penggredan" lite />
        <View style={s.gtHead}>
          <Text style={[s.gtHCol, { flex: 1.8 }]}>Penggredan</Text>
          <Text style={[s.gtHCol, { flex: 1 }]}>Bil. Tandan</Text>
          <Text style={[s.gtHCol, { flex: 1 }]}>%</Text>
          <Text style={[s.gtHCol, { flex: 1 }]}>Penalti</Text>
        </View>

        {/* Section A */}
        <View style={s.gtSubHd}>
          <Text style={s.gtSubTxt}>Muatan Basah / Tandan Tidak Segar</Text>
        </View>
        <GradingTableRow label="(1) Tandan Masak"   value={tandanMasak}   onChange={setTandanMasak}   />
        <GradingTableRow label="(2) Tandan Mengkal"  value={tandanMengkal}  onChange={setTandanMengkal}  shaded />
        <GradingTableRow label="(3) Tandan Busuk"    value={tandanBusuk}    onChange={setTandanBusuk}    />
        <GradingTableRow label="(4) Tandan Kosong"   value={tandanKosong}   onChange={setTandanKosong}   shaded last />
        <TotRow label="JUMLAH (B)" row={jumlahB} />

        {/* Section B */}
        <GradingTableRow label="(1) Tandan Kotor"    value={tandanKotor}    onChange={setTandanKotor}    />
        <GradingTableRow label="(2) Tandan Lama"     value={tandanLama}     onChange={setTandanLama}     shaded />
        <GradingTableRow label="(3) Tandan Dura"     value={tandanDura}     onChange={setTandanDura}     />
        <GradingTableRow label="(4) Tangkai Panjang" value={tandanTangkai}  onChange={setTandanTangkai}  shaded />
        <GradingTableRow label="(5) Partenokarpi"    value={partenokarpi}   onChange={setPartenokarpi}   last />
        <TotRow label="JUMLAH (C)" row={jumlahC} />
        <GrandRow label="JUMLAH BESAR (A+B+C)" row={jumlahBesar} />

        {/* GOER */}
        <View style={s.fr}>
          <Text style={s.fLabel}>Kadar Perahan Minyak Digred (GOER)</Text>
          <Stepper value={goer} onChange={setGoer} decimal />
        </View>

        {/* Catatan */}
        <View style={s.fr}>
          <Text style={s.fLabel}>Catatan</Text>
          <TextInput
            style={s.ftxt}
            value={catatan}
            onChangeText={setCatatan}
            placeholder="Nota atau ulasan..."
            placeholderTextColor={COLORS.accent}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Signatures */}
        <SectionBar title="Tandatangan" />
        <View style={s.fr}>
          <View style={s.g2}>
            <View style={s.g2cell}>
              <Text style={s.fLabel}>Nama Penggred</Text>
              <TextInput style={s.fi} value={namaPenggred} onChangeText={setNamaPenggred}
                placeholder="Nama penggred" placeholderTextColor={COLORS.accent} />
            </View>
            <View style={s.g2cell}>
              <Text style={s.fLabel}>Nama Pemandu/Pemilik</Text>
              <TextInput style={s.fi} value={namaPemandu} onChangeText={setNamaPemandu}
                placeholder="Nama pemandu" placeholderTextColor={COLORS.accent} />
            </View>
          </View>
        </View>

        {/* Photos */}
        <SectionBar title="Gambar FFB — Maksimum 3 Foto" />
        <View style={s.photoWrap}>
          {[0, 1, 2].map(i => (
            <View key={i} style={s.photoSlot}>
              {photos[i] ? (
                <>
                  <TouchableOpacity onPress={() => pickPhoto(i)} activeOpacity={0.8}>
                    {/* Show placeholder since we can't render base64 inline here easily */}
                    <View style={s.photoFilled}>
                      <Ionicons name="checkmark-circle" size={28} color={COLORS.synced} />
                      <Text style={s.photoFilledTxt}>Foto {i + 1}</Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.photoRemove} onPress={() => removePhoto(i)}>
                    <Ionicons name="close-circle" size={22} color={COLORS.failed} />
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity style={s.photoEmpty} onPress={() => pickPhoto(i)} activeOpacity={0.7}>
                  <Ionicons name="camera-outline" size={30} color={COLORS.muted} />
                  <Text style={s.photoTxt}>Foto {i + 1}</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        {/* Action buttons */}
        <View style={s.btnRow}>
          <TouchableOpacity
            style={s.btnDraft}
            onPress={handleDraft}
            disabled={saving}
            activeOpacity={0.7}
          >
            <Ionicons name="save-outline" size={20} color={COLORS.dark} />
            <Text style={s.btnDraftTxt}>Simpan Draf</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.btnSubmit}
            onPress={handleSubmit}
            disabled={saving}
            activeOpacity={0.8}
          >
            {saving
              ? <ActivityIndicator color={COLORS.gold} />
              : <>
                  <Ionicons name="send-outline" size={20} color={COLORS.gold} />
                  <Text style={s.btnSubmitTxt}>Hantar</Text>
                </>
            }
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  screen:        { flex: 1, backgroundColor: COLORS.warm },
  header:        { backgroundColor: COLORS.dark, paddingHorizontal: 20, paddingBottom: 18 },
  headerRow:     { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  backBtn:       { width: 40, height: 40, borderRadius: 8, backgroundColor: 'rgba(240,217,106,0.12)', alignItems: 'center', justifyContent: 'center' },
  headerTitle:   { color: COLORS.gold, fontSize: 16, fontWeight: '700' },
  snoBadge:      { backgroundColor: 'rgba(240,217,106,0.12)', borderWidth: 1.5, borderColor: 'rgba(196,154,10,0.5)', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  snoLabel:      { color: 'rgba(240,217,106,0.6)', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2 },
  snoVal:        { color: COLORS.gold, fontSize: 24, fontWeight: '700', letterSpacing: 3, fontVariant: ['tabular-nums'] },
  scroll:        { flex: 1 },
  millBanner:    { backgroundColor: COLORS.dark, borderBottomWidth: 2, borderBottomColor: COLORS.accent, paddingVertical: 14, alignItems: 'center' },
  millName:      { color: COLORS.gold, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 4, opacity: 0.7 },
  millForm:      { color: '#fff', fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2.5 },
  dtRow:         { flexDirection: 'row', gap: 10, padding: 12, paddingHorizontal: 14, borderBottomWidth: 1.5, borderBottomColor: COLORS.border, backgroundColor: COLORS.surface },
  dtCell:        { flex: 1 },
  dtInput:       { height: 42, fontSize: 15, fontWeight: '700', color: COLORS.dark, borderWidth: 2, borderColor: COLORS.accent, borderRadius: 7, paddingHorizontal: 10, backgroundColor: '#fff' },
  fr:            { paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: 1.5, borderBottomColor: COLORS.border, backgroundColor: COLORS.surface },
  fLabel:        { fontSize: 11, fontWeight: '700', color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  req:           { color: '#C0392B' },
  fi:            { height: 52, fontSize: 16, fontWeight: '700', color: COLORS.dark, borderWidth: 2, borderColor: COLORS.accent, borderRadius: 8, paddingHorizontal: 14, backgroundColor: '#fff' },
  ftxt:          { fontSize: 16, color: COLORS.dark, borderWidth: 2, borderColor: COLORS.accent, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#fff', minHeight: 80 },
  g2:            { flexDirection: 'row', gap: 10 },
  g2cell:        { flex: 1 },
  secBar:        { backgroundColor: COLORS.mid, paddingVertical: 8, paddingHorizontal: 14, borderTopWidth: 1.5, borderTopColor: COLORS.accent, borderBottomWidth: 1.5, borderBottomColor: COLORS.accent },
  secBarLite:    { backgroundColor: COLORS.lite },
  secBarTxt:     { color: COLORS.gold, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  gtHead:        { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 7, backgroundColor: '#F5EFD6', borderBottomWidth: 1.5, borderBottomColor: COLORS.accent },
  gtHCol:        { fontSize: 10, fontWeight: '700', color: COLORS.mid, textTransform: 'uppercase', textAlign: 'center' },
  gtSubHd:       { backgroundColor: '#F5EFD6', paddingHorizontal: 12, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  gtSubTxt:      { fontSize: 11, fontWeight: '700', color: COLORS.mid, textTransform: 'uppercase', letterSpacing: 0.4 },
  totRow:        { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 9, backgroundColor: '#F0E8B0', borderTopWidth: 1.5, borderTopColor: COLORS.accent, borderBottomWidth: 1.5, borderBottomColor: COLORS.accent },
  totLabel:      { flex: 1.8, fontSize: 12, fontWeight: '700', color: COLORS.dark },
  totVal:        { flex: 1, fontSize: 13, fontWeight: '700', color: COLORS.dark, textAlign: 'center' },
  grandRow:      { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 9, backgroundColor: COLORS.dark },
  grandLabel:    { flex: 1.8, fontSize: 12, fontWeight: '700', color: COLORS.gold },
  grandVal:      { flex: 1, fontSize: 13, fontWeight: '700', color: COLORS.gold, textAlign: 'center' },
  photoWrap:     { flexDirection: 'row', gap: 10, padding: 14, backgroundColor: COLORS.surface, borderBottomWidth: 1.5, borderBottomColor: COLORS.border },
  photoSlot:     { flex: 1, aspectRatio: 1, position: 'relative' },
  photoEmpty:    { flex: 1, borderWidth: 2, borderStyle: 'dashed', borderColor: COLORS.accent, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.warm, gap: 6 },
  photoFilled:   { flex: 1, borderWidth: 2, borderColor: COLORS.synced, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.syncedBg, gap: 6, aspectRatio: 1 },
  photoFilledTxt:{ fontSize: 11, fontWeight: '700', color: COLORS.synced },
  photoTxt:      { fontSize: 11, fontWeight: '700', color: COLORS.muted },
  photoRemove:   { position: 'absolute', top: -8, right: -8, zIndex: 10 },
  btnRow:        { flexDirection: 'row', gap: 10, margin: 14 },
  btnDraft:      { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, backgroundColor: COLORS.surface, borderWidth: 2, borderColor: COLORS.dark, borderRadius: 10 },
  btnDraftTxt:   { fontSize: 14, fontWeight: '700', color: COLORS.dark },
  btnSubmit:     { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, backgroundColor: COLORS.dark, borderRadius: 10 },
  btnSubmitTxt:  { fontSize: 15, fontWeight: '700', color: COLORS.gold },
});