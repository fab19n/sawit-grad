import { View, Text } from 'react-native';
import { COLORS } from '../../constants/theme';
export default function TicketDetail() {
  return (
    <View style={{ flex:1, backgroundColor: COLORS.warm,
      alignItems:'center', justifyContent:'center' }}>
      <Text style={{ color: COLORS.dark, fontWeight:'700' }}>Ticket Detail</Text>
    </View>
  );
}