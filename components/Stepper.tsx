import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../constants/theme';

interface Props {
  value:       number;
  onChange:    (v: number) => void;
  decimal?:    boolean;
  small?:      boolean;
}

export default function Stepper({ value, onChange, decimal = false, small = false }: Props) {
  const adjust = (d: number) => {
    const step = decimal ? 0.01 : 1;
    const next = Math.max(0, parseFloat((value + d * step).toFixed(decimal ? 2 : 0)));
    onChange(next);
  };

  return (
    <View style={[s.wrap, small && s.wrapSm]}>
      <TextInput
        style={[s.input, small && s.inputSm]}
        value={value === 0 ? '' : String(value)}
        onChangeText={t => {
          const n = decimal ? parseFloat(t) : parseInt(t, 10);
          if (!isNaN(n) && n >= 0) onChange(n);
          else if (t === '' || t === '0') onChange(0);
        }}
        keyboardType="numeric"
        placeholder="0"
        placeholderTextColor={COLORS.accent}
        selectTextOnFocus
      />
      <View style={[s.btns, small && s.btnsSm]}>
        <TouchableOpacity
          style={[s.btn, small && s.btnSm]}
          onPress={() => adjust(+1)}
          activeOpacity={0.7}
        >
          <Text style={[s.btnTxt, small && s.btnTxtSm]}>＋</Text>
        </TouchableOpacity>
        <View style={s.divider} />
        <TouchableOpacity
          style={[s.btn, small && s.btnSm]}
          onPress={() => adjust(-1)}
          activeOpacity={0.7}
        >
          <Text style={[s.btnTxt, small && s.btnTxtSm]}>－</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap:      { flexDirection: 'row', borderWidth: 2, borderColor: COLORS.accent, borderRadius: 8, overflow: 'hidden', height: 52 },
  wrapSm:    { height: 46 },
  input:     { flex: 1, fontSize: 18, fontWeight: '700', color: COLORS.dark, paddingHorizontal: 14, backgroundColor: '#fff' },
  inputSm:   { fontSize: 16, paddingHorizontal: 10 },
  btns:      { width: 36, backgroundColor: '#F5EFD6', borderLeftWidth: 2, borderLeftColor: COLORS.accent },
  btnsSm:    { width: 28 },
  btn:       { flex: 1, alignItems: 'center', justifyContent: 'center' },
  btnSm:     {},
  btnTxt:    { fontSize: 18, fontWeight: '700', color: COLORS.dark, lineHeight: 22 },
  btnTxtSm:  { fontSize: 14 },
  divider:   { height: 1.5, backgroundColor: COLORS.accent },
});