import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, MILL_NAME } from '../constants/theme';
import { useRecords } from '../hooks/useRecords';
import EntryCard from '../components/EntryCard';
import SyncBadge from '../components/SyncBadge';
import { useRefreshOnFocus } from '../hooks/useRefreshOnFocus';
import { useAuth } from '../context/AuthContext';

export default function HomeScreen() {
  const insets  = useSafeAreaInsets();
  const router  = useRouter();
  const { records, loading, refresh } = useRecords();
  useRefreshOnFocus(refresh);

  const today     = new Date().toISOString().split('T')[0];
  const month     = today.slice(0, 7);
  const submitted = records.filter(r => !r.isDraft);
  const todayRecs = submitted.filter(r => r.date === today);
  const monthRecs = submitted.filter(r => r.date?.startsWith(month));
  const pending   = submitted.filter(r => r.syncStatus === 'pending' || r.syncStatus === 'failed');
  const recent    = submitted.slice(0, 3);
  const { user, logout } = useAuth();

  return (
    <View style={s.screen}>
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 14 }]}>
        <View style={s.headerRow}>
          <View>
            <Text style={s.headerSub}>{MILL_NAME}</Text>
            <Text style={s.headerTitle}>Penggredan</Text>
          </View>
            <TouchableOpacity
              style={s.avatar}
              onPress={() => {
                Alert.alert(
                  'Log Keluar',
                  `Log keluar sebagai ${user?.name}?`,
                  [
                    { text: 'Batal', style: 'cancel' },
                    { text: 'Log Keluar', style: 'destructive', onPress: logout },
                  ]
                );
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="person-outline" size={20} color={COLORS.gold} />
            </TouchableOpacity>
        </View>
        {pending.length > 0 && (
          <View style={s.syncBanner}>
            <Ionicons name="cloud-upload-outline" size={18} color={COLORS.accent} />
            <Text style={s.syncBannerTxt}>
              {pending.length} rekod menunggu untuk dimuat naik
            </Text>
          </View>
        )}
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={COLORS.accent} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats */}
        <View style={s.statsRow}>
          <View style={s.statCard}>
            <Text style={s.statLabel}>Hari Ini</Text>
            <Text style={s.statNum}>{todayRecs.length}</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statLabel}>Bulan Ini</Text>
            <Text style={s.statNum}>{monthRecs.length}</Text>
          </View>
          <View style={[s.statCard, s.statWarn]}>
            <Text style={[s.statLabel, { color: COLORS.pending }]}>Pending</Text>
            <Text style={[s.statNum, { color: COLORS.pending }]}>{pending.length}</Text>
          </View>
        </View>

        {/* Recent entries */}
        <View style={s.sectionRow}>
          <Text style={s.sectionTitle}>Rekod Terkini</Text>
          <TouchableOpacity onPress={() => router.push('/history')}>
            <Text style={s.seeAll}>Lihat semua <Ionicons name="arrow-forward" size={13} /></Text>
          </TouchableOpacity>
        </View>

        {recent.length > 0 ? (
          recent.map(r => (
            <EntryCard
              key={r.id}
              record={r}
              onPress={() => router.push(`/history/${r.id}`)}
            />
          ))
        ) : (
          <View style={s.empty}>
            <Ionicons name="clipboard-outline" size={48} color={COLORS.accent} style={{ opacity: 0.5 }} />
            <Text style={s.emptyTxt}>Belum ada rekod.{'\n'}Cipta borang pertama anda!</Text>
          </View>
        )}

        {/* New entry button */}
        <TouchableOpacity
          style={s.newBtn}
          onPress={() => router.push('/form')}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={22} color={COLORS.gold} />
          <Text style={s.newBtnTxt}>Borang Penggredan Baru</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  screen:        { flex: 1, backgroundColor: COLORS.warm },
  header:        { backgroundColor: COLORS.dark, paddingHorizontal: 20, paddingBottom: 18 },
  headerRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerSub:     { color: 'rgba(240,217,106,0.55)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 3 },
  headerTitle:   { color: COLORS.gold, fontSize: 22, fontWeight: '700' },
  avatar:        { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(240,217,106,0.1)', alignItems: 'center', justifyContent: 'center' },
  syncBanner:    { marginTop: 14, padding: 10, backgroundColor: 'rgba(196,154,10,0.16)', borderRadius: 8, borderWidth: 1, borderColor: 'rgba(196,154,10,0.45)', flexDirection: 'row', alignItems: 'center', gap: 10 },
  syncBannerTxt: { color: COLORS.accent, fontSize: 13, fontWeight: '700' },
  scroll:        { flex: 1 },
  content:       { padding: 14, paddingBottom: 32 },
  statsRow:      { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard:      { flex: 1, backgroundColor: '#F5EFD6', borderRadius: 10, padding: 14, alignItems: 'center', borderWidth: 1.5, borderColor: COLORS.border },
  statWarn:      { backgroundColor: 'rgba(196,154,10,0.1)', borderColor: COLORS.accent },
  statLabel:     { fontSize: 10, fontWeight: '700', color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 6 },
  statNum:       { fontSize: 26, fontWeight: '700', color: COLORS.dark },
  sectionRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle:  { fontSize: 15, fontWeight: '700', color: COLORS.dark },
  seeAll:        { fontSize: 13, fontWeight: '700', color: COLORS.accent },
  empty:         { alignItems: 'center', paddingVertical: 40 },
  emptyTxt:      { fontSize: 14, color: COLORS.muted, fontWeight: '600', textAlign: 'center', marginTop: 12, lineHeight: 22 },
  newBtn:        { backgroundColor: COLORS.dark, borderRadius: 10, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 8 },
  newBtnTxt:     { color: COLORS.gold, fontSize: 15, fontWeight: '700' },
});