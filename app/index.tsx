import { View, Text } from 'react-native';
import { COLORS } from '../constants/theme';

export default function HomeScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: COLORS.warm,
      alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 24, fontWeight: '700',
        color: COLORS.dark }}>SawitGrad</Text>
      <Text style={{ color: COLORS.muted, marginTop: 8 }}>Home — coming next</Text>
    </View>
  );
}