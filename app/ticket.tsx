import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, TextInput, RefreshControl,
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { useRecords } from '../hooks/useRecords';
import { GradingRecord } from '../types/grading';
import { useRefreshOnFocus } from '../hooks/useRefreshOnFocus';

type Filter = 'all' | 'today' | 'week';

function fmtDate(d: string) {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  return `${day}.${m}.${y.slice(2)}`;
}

export default function TicketScreen() {
  const insets  = useSafeAreaInsets();
  const router  = useRouter();
  const { records, loading, refresh } = useRecords();
  useRefreshOnFocus(refresh);
  
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const todayStr = new Date().toISOString().split('T')[0];
  const weekStr  = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];

  const tickets: GradingRecord[] = records.filter(r => {
    if (r.isDraft) return false;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      r.id.includes(q) ||
      (r.namaLesen || '').toLowerCase().includes(q) ||
      (r.noKenderaan || '').toLowerCase().includes(q);
    const matchFilter =
      filter === 'all' ||
      (filter === 'today' && r.date === todayStr) ||
      (filter === 'week'  && r.date >= weekStr);
    return matchSearch && matchFilter;
  });

  const FILTERS: { key: Filter; label: string }[] = [
    { key: 'all',   label: 'Semua'     },
    { key: 'today', label: 'Hari Ini'  },
    { key: 'week',  label: 'Minggu Ini'},
  ];

  return (
    <View style={s.screen}>
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 14 }]}>
        <Text style={s.sub}>Semua Tiket</Text>
        <Text style={[s.title, { marginBottom: 14 }]}>Tiket</Text>
        <View style={s.searchWrap}>
          <Ionicons name="search-outline" size={16} color="rgba(240,217,106,0.5)" style={{ marginRight: 8 }} />
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
        style={{ maxHeight: 52, backgroundColor: COLORS.warm }}
        contentContainerStyle={{ paddingHorizontal: 14, paddingVertical: 8, gap: 8, flexDirection: 'row' }}
      >
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[s.pill, filter === f.key && s.pillActive]}
            onPress={() => setFilter(f.key)}
            activeOpacity={0.7}
          >
            <Text style={[s.pillTxt, filter === f.key && s.pillTxtActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* List */}
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={COLORS.accent} />}
        showsVerticalScrollIndicator={false}
      >
        {tickets.length > 0 ? tickets.map(r => (
          <TouchableOpacity
            key={r.id}
            style={s.card}
            onPress={() => router.push(`/ticket/${r.id}`)}
            activeOpacity={0.7}
          >
            <View style={s.cardTop}>
              <Text style={s.sno}>#{r.id}</Text>
              <Text style={s.time}>{fmtDate(r.date)} · {r.time || '—'}</Text>
            </View>
            <View style={s.cardBot}>
              <View>
                <Text style={s.supplier}>{r.namaLesen || '(Tiada nama)'}</Text>
                <Text style={s.detail}>
                  <Ionicons name="car-outline" size={12} /> {r.noKenderaan || '—'}
                  {'   '}
                  <Ionicons name="layers-outline" size={12} /> {r.jumlahBesar?.bil ?? 0} tandan
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={COLORS.accent} />
            </View>
          </TouchableOpacity>
        )) : (
          <View style={s.empty}>
            <Ionicons name="document-text-outline" size={44} color={COLORS.accent} style={{ opacity: 0.4 }} />
            <Text style={s.emptyTxt}>Tiada tiket ditemui.</Text>
          </View>
        )}
        <View style={{ height: 16 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  screen:      { flex: 1, backgroundColor: COLORS.warm },
  header:      { backgroundColor: COLORS.dark, paddingHorizontal: 20, paddingBottom: 16 },
  sub:         { color: 'rgba(240,217,106,0.55)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 3 },
  title:       { color: COLORS.gold, fontSize: 22, fontWeight: '700' },
  searchWrap:  { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1.5, borderColor: 'rgba(196,154,10,0.4)', borderRadius: 10, paddingHorizontal: 12, height: 50 },
  searchInput: { flex: 1, fontSize: 15, color: COLORS.gold, fontWeight: '500' },
  pill:        { height: 36, paddingHorizontal: 16, borderRadius: 20, borderWidth: 2, borderColor: COLORS.accent, justifyContent: 'center' },
  pillActive:  { backgroundColor: COLORS.dark, borderColor: COLORS.dark },
  pillTxt:     { fontSize: 13, fontWeight: '700', color: COLORS.muted },
  pillTxtActive:{ color: COLORS.gold },
  scroll:      { flex: 1 },
  content:     { padding: 14 },
  card:        { backgroundColor: COLORS.surface, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12, padding: 14, marginBottom: 10 },
  cardTop:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 },
  sno:         { fontSize: 15, fontWeight: '700', color: COLORS.dark, fontVariant: ['tabular-nums'] },
  time:        { fontSize: 12, fontWeight: '700', color: COLORS.muted },
  cardBot:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  supplier:    { fontSize: 14, fontWeight: '700', color: COLORS.dark, marginBottom: 3 },
  detail:      { fontSize: 12, fontWeight: '600', color: COLORS.muted },
  empty:       { alignItems: 'center', paddingVertical: 60 },
  emptyTxt:    { fontSize: 14, color: COLORS.muted, fontWeight: '600', marginTop: 12 },
});