import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { SyncStatus } from '../types/grading';

interface Props { status: SyncStatus | 'draft' }

const CONFIG = {
  synced:  { bg: COLORS.syncedBg,  color: COLORS.synced,  icon: 'cloud-done-outline',   label: 'Synced'   },
  pending: { bg: COLORS.pendingBg, color: COLORS.pending, icon: 'cloud-upload-outline',  label: 'Pending'  },
  failed:  { bg: COLORS.failedBg,  color: COLORS.failed,  icon: 'cloud-offline-outline', label: 'Gagal'    },
  draft:   { bg: '#EEF2F7',        color: '#475569',       icon: 'create-outline',        label: 'Draf'     },
} as const;

export default function SyncBadge({ status }: Props) {
  const c = CONFIG[status] ?? CONFIG.pending;
  return (
    <View style={[s.wrap, { backgroundColor: c.bg }]}>
      <Ionicons name={c.icon as any} size={12} color={c.color} />
      <Text style={[s.txt, { color: c.color }]}>{c.label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20 },
  txt:  { fontSize: 11, fontWeight: '700' },
});