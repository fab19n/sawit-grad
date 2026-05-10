import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView, Alert,
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, MILL_NAME } from '../constants/theme';
import { login } from '../services/auth';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
  const insets  = useSafeAreaInsets();
  const router  = useRouter();
  const { refreshAuth } = useAuth();

  const [email,       setEmail]       = useState('');
  const [password,    setPassword]    = useState('');
  const [showPass,    setShowPass]    = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [errorMsg,    setErrorMsg]    = useState('');

  async function handleLogin() {
    // Clear any previous error message before attempting
    setErrorMsg('');

    if (!email.trim() || !password.trim()) {
      setErrorMsg('Sila masukkan email dan kata laluan.');
      return;
    }

    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      // Navigate to home and replace the login screen in the stack
      // so the user can't press back to return to the login page
      await refreshAuth(); // Update auth context with new credentials
      router.replace('/');
    } else {
      setErrorMsg(result.message || 'Log masuk gagal.');
    }
    setLoading(false);
  }

  return (
    <KeyboardAvoidingView
      style={s.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[s.content, { paddingTop: insets.top + 40 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo area */}
        <View style={s.logoWrap}>
          <View style={s.logoCircle}>
            <Ionicons name="leaf" size={40} color={COLORS.gold} />
          </View>
          <Text style={s.appName}>SawitGrad</Text>
          <Text style={s.millName}>{MILL_NAME}</Text>
        </View>

        {/* Login card */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Log Masuk</Text>
          <Text style={s.cardSub}>Masukkan kelayakan anda untuk meneruskan</Text>

          {/* Error banner — only visible when there's an error */}
          {errorMsg.length > 0 && (
            <View style={s.errorBanner}>
              <Ionicons name="alert-circle-outline" size={16} color={COLORS.failed} />
              <Text style={s.errorTxt}>{errorMsg}</Text>
            </View>
          )}

          {/* Email field */}
          <View style={s.fieldWrap}>
            <Text style={s.fieldLabel}>Email</Text>
            <View style={s.inputWrap}>
              <Ionicons name="mail-outline" size={18} color={COLORS.muted} style={s.inputIcon} />
              <TextInput
                style={s.input}
                value={email}
                onChangeText={v => { setEmail(v); setErrorMsg(''); }}
                placeholder="email@example.com"
                placeholderTextColor={COLORS.accent}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
              />
            </View>
          </View>

          {/* Password field */}
          <View style={s.fieldWrap}>
            <Text style={s.fieldLabel}>Kata Laluan</Text>
            <View style={s.inputWrap}>
              <Ionicons name="lock-closed-outline" size={18} color={COLORS.muted} style={s.inputIcon} />
              <TextInput
                style={[s.input, { flex: 1 }]}
                value={password}
                onChangeText={v => { setPassword(v); setErrorMsg(''); }}
                placeholder="Kata laluan anda"
                placeholderTextColor={COLORS.accent}
                secureTextEntry={!showPass}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="password"
              />
              {/* Toggle password visibility — important for outdoor use
                  where users might mistype without realising */}
              <TouchableOpacity
                onPress={() => setShowPass(p => !p)}
                style={s.eyeBtn}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={showPass ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={COLORS.muted}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Login button */}
          <TouchableOpacity
            style={[s.loginBtn, loading && s.loginBtnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading
              ? <ActivityIndicator color={COLORS.gold} size="small" />
              : <>
                  <Ionicons name="log-in-outline" size={20} color={COLORS.gold} />
                  <Text style={s.loginBtnTxt}>Log Masuk</Text>
                </>
            }
          </TouchableOpacity>
        </View>

        {/* Version tag */}
        <Text style={s.version}>SawitGrad v1.0.0</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  screen:       { flex: 1, backgroundColor: COLORS.dark },
  content:      { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 },
  logoWrap:     { alignItems: 'center', marginBottom: 36 },
  logoCircle:   { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(240,217,106,0.12)', borderWidth: 2, borderColor: 'rgba(196,154,10,0.4)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  appName:      { color: COLORS.gold, fontSize: 32, fontWeight: '700', letterSpacing: 1 },
  millName:     { color: 'rgba(240,217,106,0.5)', fontSize: 12, textAlign: 'center', marginTop: 6, lineHeight: 18 },
  card:         { backgroundColor: COLORS.surface, borderRadius: 16, padding: 24, borderWidth: 1.5, borderColor: COLORS.border },
  cardTitle:    { fontSize: 20, fontWeight: '700', color: COLORS.dark, marginBottom: 6 },
  cardSub:      { fontSize: 13, color: COLORS.muted, marginBottom: 24 },
  errorBanner:  { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.failedBg, borderRadius: 8, padding: 12, marginBottom: 16 },
  errorTxt:     { fontSize: 13, color: COLORS.failed, fontWeight: '600', flex: 1 },
  fieldWrap:    { marginBottom: 16 },
  fieldLabel:   { fontSize: 11, fontWeight: '700', color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  inputWrap:    { flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderColor: COLORS.border, borderRadius: 10, backgroundColor: '#fff', paddingHorizontal: 12, height: 54 },
  inputIcon:    { marginRight: 8 },
  input:        { flex: 1, fontSize: 16, fontWeight: '600', color: COLORS.dark },
  eyeBtn:       { padding: 4 },
  loginBtn:     { backgroundColor: COLORS.dark, borderRadius: 10, height: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 8, borderWidth: 1.5, borderColor: COLORS.accent },
  loginBtnDisabled: { opacity: 0.6 },
  loginBtnTxt:  { color: COLORS.gold, fontSize: 16, fontWeight: '700' },
  version:      { color: 'rgba(240,217,106,0.3)', fontSize: 11, textAlign: 'center', marginTop: 32 },
});