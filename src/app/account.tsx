import { Redirect, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getAuthenticatedRoleId, getAuthenticatedUserId, getAuthenticatedUserProfile, isAuthenticated, setAuthenticated } from '@/services/api';

export default function AccountScreen() {
  const [loading, setLoading] = useState(true);

  useEffect(() => { setLoading(false); }, []);

  if (!isAuthenticated()) return <Redirect href="/" />;

  const profile = getAuthenticatedUserProfile();
  const roleId = getAuthenticatedRoleId();
  const userId = getAuthenticatedUserId();
  const displayName = profile.firstName || profile.username || 'Account';
  const roleLabel = roleId === 2 ? 'Merchant' : 'Admin';
  const hasProfileDetails = Boolean(profile.username || profile.email || profile.phoneNumber);

  const signOut = () => { setAuthenticated(false); router.replace('/'); };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <Text style={styles.title}>My Account</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <Text style={styles.stateText}>Loading account…</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
          <View style={styles.profileCard}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text></View>
            <Text style={styles.name}>{displayName}</Text>
            <Text style={styles.role}>{roleLabel}</Text>
          </View>

          {hasProfileDetails ? (
            <View style={styles.detailsCard}>
              {profile.username ? <View style={styles.row}><Text style={styles.label}>Username</Text><Text style={styles.value}>{profile.username}</Text></View> : null}
              {profile.email ? <View style={styles.row}><Text style={styles.label}>Email</Text><Text style={styles.value}>{profile.email}</Text></View> : null}
              {profile.phoneNumber ? <View style={styles.row}><Text style={styles.label}>Phone</Text><Text style={styles.value}>{profile.phoneNumber}</Text></View> : null}
              <View style={[styles.row, styles.rowLast]}><Text style={styles.label}>Account ID</Text><Text style={styles.value}>{userId || '—'}</Text></View>
            </View>
          ) : (
            <View style={styles.errorCard}>
              <Text style={styles.errorTitle}>Account details unavailable</Text>
              <Text style={styles.errorText}>Your profile details aren’t available in this session. Please sign in again to refresh them.</Text>
            </View>
          )}

          <Pressable onPress={signOut} style={styles.signOut}><Text style={styles.signOutText}>Sign out</Text></Pressable>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F3F7F4' },
  header: { height: 62, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, backgroundColor: '#176B45' },
  back: { width: 42 },
  backText: { fontSize: 34, color: '#FFF' },
  title: { fontSize: 22, fontWeight: '800', color: '#FFF' },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 25 },
  stateText: { color: '#718078', fontSize: 12, textAlign: 'center' },

  page: { width: '100%', maxWidth: 780, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40 },

  profileCard: { alignItems: 'center', marginBottom: 20 },
  avatar: { width: 74, height: 74, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: '#176B45', marginBottom: 12 },
  avatarText: { color: '#FFFFFF', fontWeight: '800', fontSize: 28 },
  name: { fontSize: 20, fontWeight: '800', color: '#173D2D' },
  role: { fontSize: 12, fontWeight: '700', color: '#4F8069', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.8 },

  detailsCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 6, borderWidth: 1, borderColor: '#E5ECE7' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F0F4F1' },
  rowLast: { borderBottomWidth: 0 },
  label: { color: '#7C8D84', fontSize: 12, fontWeight: '700' },
  value: { color: '#244536', fontSize: 13, fontWeight: '700', maxWidth: '65%', textAlign: 'right' },

  errorCard: { backgroundColor: '#FCEBEC', borderRadius: 16, padding: 18 },
  errorTitle: { color: '#A94442', fontSize: 14, fontWeight: '800', marginBottom: 6 },
  errorText: { color: '#8A5457', fontSize: 12, lineHeight: 17 },

  signOut: { alignSelf: 'center', paddingHorizontal: 20, paddingVertical: 14, marginTop: 24 },
  signOutText: { color: '#64766D', fontSize: 13, fontWeight: '700' },
});
