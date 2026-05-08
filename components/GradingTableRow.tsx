import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants/theme';
import { GradingRow } from '../types/grading';
import Stepper from './Stepper';

interface Props {
  label:    string;
  value:    GradingRow;
  onChange: (v: GradingRow) => void;
  shaded?:  boolean;
  last?:    boolean;
}

export default function GradingTableRow({ label, value, onChange, shaded, last }: Props) {
  return (
    <View style={[s.row, shaded && s.shaded, last && s.last]}>
      <Text style={s.label}>{label}</Text>
      <View style={s.steppers}>
        <View style={s.cell}>
          <Stepper
            small
            value={value.bil}
            onChange={v => onChange({ ...value, bil: v })}
          />
        </View>
        <View style={s.cell}>
          <Stepper
            small
            value={value.pct}
            onChange={v => onChange({ ...value, pct: v })}
          />
        </View>
        <View style={s.cell}>
          <Stepper
            small
            decimal
            value={value.penalti}
            onChange={v => onChange({ ...value, penalti: v })}
          />
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  row:      { borderBottomWidth: 1, borderBottomColor: COLORS.border, backgroundColor: '#FFFEF8', paddingHorizontal: 12, paddingVertical: 8 },
  shaded:   { backgroundColor: '#FBF8EE' },
  last:     { borderBottomWidth: 0 },
  label:    { fontSize: 12, fontWeight: '700', color: COLORS.dark, marginBottom: 7 },
  steppers: { flexDirection: 'row', gap: 6 },
  cell:     { flex: 1 },
});