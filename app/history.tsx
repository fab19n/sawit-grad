import { View, Text } from 'react-native';
import { COLORS } from '../constants/theme';

export default function HistoryScreen() {
  return (
    <View style={{ flex:1, backgroundColor: COLORS.warm,
      alignItems:'center', justifyContent:'center' }}>
      <Text style={{ color: COLORS.dark, fontWeight:'700' }}>History — coming next</Text>
    </View>
  );
}