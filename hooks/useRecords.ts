import { useState, useEffect, useCallback } from 'react';
import { getAllRecords } from '../services/db';
import { GradingRecord } from '../types/grading';

export function useRecords() {
  const [records, setRecords]   = useState<GradingRecord[]>([]);
  const [loading, setLoading]   = useState(true);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const all = await getAllRecords();
      setRecords(all);
    } catch (e) {
      console.error('useRecords error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { records, loading, refresh };
}