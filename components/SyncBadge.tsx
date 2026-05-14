import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { SyncStatus } from '../types/grading';

interface Props {
  status:    SyncStatus | 'draft';
  isEdited?: boolean;
}

const CONFIG = {
  synced:  { bg: COLORS.syncedBg,  color: COLORS.synced,  icon: 'cloud-done-outline',    label: 'Synced'  },
  pending: { bg: COLORS.pendingBg, color: COLORS.pending, icon: 'cloud-upload-outline',   label: 'Pending' },
  failed:  { bg: COLORS.failedBg,  color: COLORS.failed,  icon: 'cloud-offline-outline',  label: 'Gagal'   },
  draft:   { bg: '#EEF2F7',        color: '#475569',       icon: 'create-outline',         label: 'Draf'    },
} as const;

export default function SyncBadge({ status, isEdited = false }: Props) {
  const c = CONFIG[status] ?? CONFIG.pending;
  return (
    <View style={s.wrap}>
      <View style={[s.badge, { backgroundColor: c.bg }]}>
        <Ionicons name={c.icon as any} size={12} color={c.color} />
        <Text style={[s.txt, { color: c.color }]}>{c.label}</Text>
      </View>
      {isEdited && (
        <View style={s.editedBadge}>
          <Ionicons name="pencil-outline" size={11} color="#5B4300" />
          <Text style={s.editedTxt}>Diedit</Text>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  wrap:        { flexDirection: 'row', alignItems: 'center', gap: 5 },
  badge:       { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20 },
  txt:         { fontSize: 11, fontWeight: '700' },
  editedBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, backgroundColor: '#FFF3CD', borderWidth: 1, borderColor: '#F0C040' },
  editedTxt:   { fontSize: 11, fontWeight: '700', color: '#5B4300' },
});