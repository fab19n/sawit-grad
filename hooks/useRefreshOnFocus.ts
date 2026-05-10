import { useCallback } from 'react';
import { useFocusEffect } from 'expo-router';

export function useRefreshOnFocus(refresh: () => void) {
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );
}