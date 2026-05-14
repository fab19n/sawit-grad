import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { GradingRecord } from '../types/grading';
import SyncBadge from './SyncBadge';

interface Props {
  record:     GradingRecord;
  onPress:    () => void;
  showBadge?: boolean;
}

function fmtDate(d: string) {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  return `${day}.${m}.${y.slice(2)}`;
}

export default function EntryCard({ record, onPress, showBadge = true }: Props) {
  const status = record.isDraft ? 'draft' : record.syncStatus;
  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.7}>
      <View style={s.top}>
        <View style={s.topLeft}>
          <Text style={s.sno}>#{record.id}</Text>
          {showBadge && (
            <SyncBadge
              status={status}
              isEdited={record.isEdited}
            />
          )}
        </View>
        <Text style={s.time}>{fmtDate(record.date)} · {record.time || '—'}</Text>
      </View>
      <View style={s.bot}>
        <View>
          <Text style={s.supplier}>{record.namaLesen || '(Tiada nama)'}</Text>
          <Text style={s.detail}>
            <Ionicons name="car-outline" size={12} /> {record.noKenderaan || '—'}
            {'   '}
            <Ionicons name="layers-outline" size={12} /> {record.jumlahBesar?.bil ?? 0} tandan
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={COLORS.accent} />
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  card:     { backgroundColor: COLORS.surface, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12, padding: 14, marginBottom: 10 },
  top:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 },
  topLeft:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sno:      { fontSize: 15, fontWeight: '700', color: COLORS.dark, fontVariant: ['tabular-nums'] },
  time:     { fontSize: 12, fontWeight: '700', color: COLORS.muted },
  bot:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  supplier: { fontSize: 14, fontWeight: '700', color: COLORS.dark, marginBottom: 3 },
  detail:   { fontSize: 12, fontWeight: '600', color: COLORS.muted },
});