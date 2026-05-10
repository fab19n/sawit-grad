import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, TextInput, RefreshControl, Modal,
  ActivityIndicator,
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { useRecords } from '../hooks/useRecords';
import { uploadAll, UploadProgress } from '../services/upload';
import EntryCard from '../components/EntryCard';
import { GradingRecord } from '../types/grading';
import { useRefreshOnFocus } from '../hooks/useRefreshOnFocus';

type Filter = 'all' | 'synced' | 'pending' | 'failed' | 'draft';

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { records, loading, refresh } = useRecords();
  useRefreshOnFocus(refresh);

  const [search,  setSearch]  = useState('');
  const [filter,  setFilter]  = useState<Filter>('all');
  const [uploading, setUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [progress, setProgress]   = useState<UploadProgress | null>(null);
  const [uploadDone, setUploadDone] = useState(false);
  const [doneCount, setDoneCount]  = useState(0);

  const pending = records.filter(
    r => !r.isDraft && (r.syncStatus === 'pending' || r.syncStatus === 'failed')
  );

  const filtered: GradingRecord[] = records.filter(r => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      r.id.includes(q) ||
      (r.namaLesen || '').toLowerCase().includes(q) ||
      (r.noKenderaan || '').toLowerCase().includes(q);

    const status = r.isDraft ? 'draft' : r.syncStatus;
    const matchFilter = filter === 'all' || status === filter;

    return matchSearch && matchFilter;
  });

  async function startUpload() {
    if (uploading || pending.length === 0) return;
    setUploading(true);
    setUploadDone(false);
    setProgress(null);
    await uploadAll(
      p => setProgress(p),
      count => { setDoneCount(count); setUploadDone(true); setUploading(false); refresh(); },
      _err => { setUploading(false); }
    );
  }

  function closeUpload() {
    if (uploading) return;
    setShowUpload(false);
    setProgress(null);
    setUploadDone(false);
  }

  const FILTERS: { key: Filter; label: string }[] = [
    { key: 'all',     label: 'Semua'   },
    { key: 'synced',  label: 'Synced'  },
    { key: 'pending', label: 'Pending' },
    { key: 'failed',  label: 'Gagal'   },
    { key: 'draft',   label: 'Draf'    },
  ];

  return (
    <View style={s.screen}>
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 14 }]}>
        <View style={s.headerTop}>
          <View>
            <Text style={s.sub}>Rekod Penggredan</Text>
            <Text style={s.title}>Sejarah</Text>
          </View>
          <TouchableOpacity
            style={s.uploadBtn}
            onPress={() => { setShowUpload(true); }}
            activeOpacity={0.8}
          >
            <Ionicons name="cloud-upload-outline" size={18} color={COLORS.gold} />
            <Text style={s.uploadBtnTxt}>
              Muat Naik{pending.length > 0 ? ` (${pending.length})` : ''}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={s.searchWrap}>
          <Ionicons name="search-outline" size={16} color="rgba(240,217,106,0.5)" style={s.searchIcon} />
          <TextInput
            style={s.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Cari S/NO atau pembekal..."
            placeholderTextColor="rgba(240,217,106,0.4)"
            autoCorrect={false}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color="rgba(240,217,106,0.5)" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.pillsScroll}
        contentContainerStyle={s.pillsContent}
      >
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[s.pill, filter === f.key && s.pillActive]}
            onPress={() => setFilter(f.key)}
            activeOpacity={0.7}
          >
            <Text style={[s.pillTxt, filter === f.key && s.pillTxtActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* List */}
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} tintColor={COLORS.accent} />
        }
        showsVerticalScrollIndicator={false}
      >
        {filtered.length > 0 ? (
          filtered.map(r => (
            <EntryCard
              key={r.id}
              record={r}
              onPress={() => router.push(`/history/${r.id}`)}
            />
          ))
        ) : (
          <View style={s.empty}>
            <Ionicons name="search-outline" size={44} color={COLORS.accent} style={{ opacity: 0.4 }} />
            <Text style={s.emptyTxt}>Tiada rekod ditemui.</Text>
          </View>
        )}
        <View style={{ height: 16 }} />
      </ScrollView>

      {/* Upload modal */}
      <Modal visible={showUpload} transparent animationType="slide">
        <View style={s.overlay}>
          <TouchableOpacity style={s.overlayBg} onPress={closeUpload} activeOpacity={1} />
          <View style={s.sheet}>
            <View style={s.handle} />
            <Text style={s.sheetTitle}>Muat Naik Rekod</Text>
            <Text style={s.sheetSub}>
              {pending.length === 0
                ? 'Tiada rekod yang perlu dimuat naik.'
                : `${pending.length} rekod akan dimuat naik.`}
            </Text>

            {progress && !uploadDone && (
              <View style={s.progressWrap}>
                <View style={s.progressTop}>
                  <Text style={s.progressLabel}>Sedang memuat naik...</Text>
                  <Text style={s.progressCount}>{progress.current} / {progress.total}</Text>
                </View>
                <View style={s.barBg}>
                  <View style={[s.barFill, { width: `${(progress.current / progress.total) * 100}%` }]} />
                </View>
                <Text style={s.progressItem}>#{progress.recordId} — {progress.supplier}</Text>
              </View>
            )}

            {uploadDone && (
              <View style={s.doneBanner}>
                <Ionicons name="checkmark-circle" size={28} color={COLORS.synced} />
                <Text style={s.doneTxt}>{doneCount} rekod berjaya dimuat naik!</Text>
              </View>
            )}

            {!uploadDone ? (
              <View style={s.sheetBtns}>
                <TouchableOpacity style={s.btnCancel} onPress={closeUpload} disabled={uploading}>
                  <Text style={s.btnCancelTxt}>Batal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.btnStart, pending.length === 0 && s.btnDisabled]}
                  onPress={startUpload}
                  disabled={uploading || pending.length === 0}
                >
                  {uploading
                    ? <ActivityIndicator color={COLORS.gold} />
                    : <>
                        <Ionicons name="cloud-upload-outline" size={18} color={COLORS.gold} />
                        <Text style={s.btnStartTxt}>Mula Muat Naik</Text>
                      </>
                  }
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={s.btnStart} onPress={closeUpload}>
                <Text style={s.btnStartTxt}>Tutup</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  screen:        { flex: 1, backgroundColor: COLORS.warm },
  header:        { backgroundColor: COLORS.dark, paddingHorizontal: 20, paddingBottom: 16 },
  headerTop:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 14 },
  sub:           { color: 'rgba(240,217,106,0.55)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 3 },
  title:         { color: COLORS.gold, fontSize: 22, fontWeight: '700' },
  uploadBtn:     { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: 'rgba(196,154,10,0.18)', borderWidth: 1.5, borderColor: 'rgba(196,154,10,0.55)', borderRadius: 9, paddingHorizontal: 14, paddingVertical: 9 },
  uploadBtnTxt:  { color: COLORS.gold, fontSize: 13, fontWeight: '700' },
  searchWrap:    { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1.5, borderColor: 'rgba(196,154,10,0.4)', borderRadius: 10, paddingHorizontal: 12, height: 50 },
  searchIcon:    { marginRight: 8 },
  searchInput:   { flex: 1, fontSize: 15, color: COLORS.gold, fontWeight: '500' },
  pillsScroll:   { backgroundColor: COLORS.warm, maxHeight: 52 },
  pillsContent:  { paddingHorizontal: 14, paddingVertical: 8, gap: 8, flexDirection: 'row' },
  pill:          { height: 36, paddingHorizontal: 16, borderRadius: 20, borderWidth: 2, borderColor: COLORS.accent, justifyContent: 'center', alignItems: 'center' },
  pillActive:    { backgroundColor: COLORS.dark, borderColor: COLORS.dark },
  pillTxt:       { fontSize: 13, fontWeight: '700', color: COLORS.muted },
  pillTxtActive: { color: COLORS.gold },
  scroll:        { flex: 1 },
  content:       { padding: 14 },
  empty:         { alignItems: 'center', paddingVertical: 60 },
  emptyTxt:      { fontSize: 14, color: COLORS.muted, fontWeight: '600', marginTop: 12 },
  overlay:       { flex: 1, justifyContent: 'flex-end' },
  overlayBg:     { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet:         { backgroundColor: COLORS.surface, borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 20, paddingBottom: 36, borderTopWidth: 2, borderTopColor: COLORS.accent },
  handle:        { width: 40, height: 4, backgroundColor: COLORS.accent, borderRadius: 2, alignSelf: 'center', marginBottom: 18, opacity: 0.5 },
  sheetTitle:    { fontSize: 17, fontWeight: '700', color: COLORS.dark, marginBottom: 4 },
  sheetSub:      { fontSize: 13, color: COLORS.muted, marginBottom: 16 },
  progressWrap:  { backgroundColor: '#F5EFD6', borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 10, padding: 14, marginBottom: 16 },
  progressTop:   { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel: { fontSize: 13, fontWeight: '700', color: COLORS.dark },
  progressCount: { fontSize: 13, fontWeight: '700', color: COLORS.accent },
  barBg:         { backgroundColor: COLORS.border, borderRadius: 4, height: 8, marginBottom: 6, overflow: 'hidden' },
  barFill:       { backgroundColor: COLORS.dark, height: '100%', borderRadius: 4 },
  progressItem:  { fontSize: 11, color: COLORS.muted, fontStyle: 'italic' },
  doneBanner:    { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.syncedBg, borderWidth: 1.5, borderColor: '#A5D6A7', borderRadius: 10, padding: 14, marginBottom: 16 },
  doneTxt:       { fontSize: 14, fontWeight: '700', color: COLORS.synced },
  sheetBtns:     { flexDirection: 'row', gap: 10 },
  btnCancel:     { flex: 1, padding: 14, borderRadius: 10, borderWidth: 2, borderColor: COLORS.dark, alignItems: 'center' },
  btnCancelTxt:  { fontSize: 14, fontWeight: '700', color: COLORS.dark },
  btnStart:      { flex: 1, padding: 14, borderRadius: 10, backgroundColor: COLORS.dark, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  btnDisabled:   { opacity: 0.4 },
  btnStartTxt:   { fontSize: 14, fontWeight: '700', color: COLORS.gold },
});