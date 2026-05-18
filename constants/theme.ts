import Constants from 'expo-constants';

export const COLORS = {
  dark:     '#2B2200',
  mid:      '#4A3A00',
  lite:     '#6B5200',
  accent:   '#C49A0A',
  gold:     '#F0D96A',
  surface:  '#FFFEF8',
  warm:     '#FBF7EC',
  border:   '#E8D48A',
  muted:    '#6B5C2E',
  synced:   '#0D5C3A',
  syncedBg: '#DCF5E8',
  failed:   '#8B2020',
  failedBg: '#FDDEDE',
  pending:  '#7A5800',
  pendingBg:'rgba(196,154,10,0.15)',
};

export const MILL_NAME  = 'Sri Aman Palm Oil Mill Sdn Bhd';
export const SNO_START  = 139333;
export const SNO_KEY    = 'sg_sno_counter';
export const DB_NAME    = 'sawitgrad.db';

// In development, dynamically read the Metro bundler host IP.
// This is the same IP Expo uses to serve the JS bundle to your phone —
// guaranteed to be the correct local network IP regardless of which
// adapter or network you're on.
// In production APK builds, __DEV__ is false so it always uses Render.
function getApiUrl(): string {
  if (!__DEV__) {
    return 'https://sawit-grad-api.onrender.com';
  }
  // Constants.expoConfig.hostUri gives "192.168.x.x:8081"
  // We strip the port and replace with our API port 5000
  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  if (host) {
    return `http://${host}:5000`;
  }
  // Fallback if hostUri is unavailable
  return 'http://localhost:5000';
}

export const API_URL = getApiUrl();
