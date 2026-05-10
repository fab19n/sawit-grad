import * as SecureStore from 'expo-secure-store';
import { API_URL } from '../constants/theme';

const TOKEN_KEY = 'sg_auth_token';
const USER_KEY  = 'sg_auth_user';

export interface AuthUser {
  id:     string;
  name:   string;
  email:  string;
  role:   'grader' | 'manager' | 'admin';
  millId: string;
}

export async function storeToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function storeUser(user: AuthUser): Promise<void> {
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
}

export async function getStoredUser(): Promise<AuthUser | null> {
  const raw = await SecureStore.getItemAsync(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export async function clearAuth(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(USER_KEY);
}

export async function login(
  email: string,
  password: string
): Promise<{ success: boolean; message?: string; user?: AuthUser }> {
  
  // Log the exact URL being called so we can confirm it's correct
  const url = `${API_URL}/api/auth/login`;
  console.log('🔐 Login attempt to:', url);
  console.log('📧 Email:', email);

  try {
    const controller = new AbortController();
    const timeoutId  = setTimeout(() => {
      console.log('⏰ Request timed out after 10 seconds');
      controller.abort();
    }, 10000);

    const res = await fetch(url, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ 
        email:    email.toLowerCase().trim(), 
        password: password 
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Log the HTTP status code — this tells us whether the server
    // received the request and what it thought about it
    console.log('📡 Response status:', res.status);

    // Read the raw text first before trying to parse as JSON.
    // If the server returns HTML (like an error page) instead of JSON,
    // res.json() will throw and we'll lose the actual error message.
    const rawText = await res.text();
    console.log('📨 Raw response:', rawText);

    // Now safely parse — if this throws, rawText above tells us why
    let data: any;
    try {
      data = JSON.parse(rawText);
    } catch (parseErr) {
      console.error('❌ Failed to parse response as JSON:', parseErr);
      return {
        success: false,
        message: `Pelayan memulangkan respons tidak sah. Status: ${res.status}`,
      };
    }

    console.log('✅ Parsed data:', JSON.stringify(data));

    if (!data.success) {
      return { 
        success: false, 
        // Ensure we always have a non-empty message so the error banner shows
        message: data.message || `Log masuk gagal. Kod: ${res.status}` 
      };
    }

    await storeToken(data.token);
    await storeUser(data.user);
    console.log('💾 Token and user stored successfully');

    return { success: true, user: data.user };

  } catch (err: any) {
    // Log the full error object so we know exactly what went wrong
    console.error('❌ Login fetch error:', err.name, err.message, err);
    
    if (err.name === 'AbortError') {
      return {
        success: false,
        message: 'Sambungan tamat masa (10s). Pastikan server sedang berjalan dan IP address betul.',
      };
    }

    return {
      success: false,
      message: `Ralat rangkaian: ${err.message || 'Tidak dapat menghubungi pelayan.'}`,
    };
  }
}