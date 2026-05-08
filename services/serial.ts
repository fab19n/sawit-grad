import AsyncStorage from '@react-native-async-storage/async-storage';
import { SNO_START, SNO_KEY } from '../constants/theme';

export async function peekNextSNO(): Promise<string> {
  const stored = await AsyncStorage.getItem(SNO_KEY);
  const current = parseInt(stored ?? String(SNO_START), 10);
  return String(current + 1);
}

export async function claimSNO(): Promise<string> {
  const stored = await AsyncStorage.getItem(SNO_KEY);
  const current = parseInt(stored ?? String(SNO_START), 10);
  const next = current + 1;
  await AsyncStorage.setItem(SNO_KEY, String(next));
  return String(next);
}