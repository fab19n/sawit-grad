import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';

interface Props {
  title:       string;
  subtitle?:   string;
  showBack?:   boolean;
  onBack?:     () => void;
  rightElement?: React.ReactNode;
}

export default function ScreenHeader({
  title, subtitle, showBack, onBack, rightElement
}: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[s.wrap, { paddingTop: insets.top + 14 }]}>
      <View style={s.row}>
        <View style={s.left}>
          {showBack && (
            <TouchableOpacity style={s.backBtn} onPress={onBack} activeOpacity={0.7}>
              <Ionicons name="arrow-back" size={20} color={COLORS.gold} />
            </TouchableOpacity>
          )}
          <View>
            {subtitle && <Text style={s.sub}>{subtitle}</Text>}
            <Text style={s.title}>{title}</Text>
          </View>
        </View>
        {rightElement && <View>{rightElement}</View>}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap:    { backgroundColor: COLORS.dark, paddingHorizontal: 20, paddingBottom: 18 },
  row:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  left:    { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 8, backgroundColor: 'rgba(240,217,106,0.12)', alignItems: 'center', justifyContent: 'center' },
  sub:     { color: 'rgba(240,217,106,0.55)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 2 },
  title:   { color: COLORS.gold, fontSize: 22, fontWeight: '700' },
});