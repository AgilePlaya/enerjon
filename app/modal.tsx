import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Platform, StatusBar as RNStatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SyncScreen } from '../src/screens/SyncScreen';
import { THEME } from '../src/constants/theme';

export default function ModalScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const modalTopPadding = Math.max(
    insets.top,
    Platform.OS === 'android' ? (RNStatusBar.currentHeight || 28) : 20
  ) + 8;

  return (
    <View style={styles.container}>
      <View style={[styles.headerRow, { paddingTop: modalTopPadding }]}>
        <View style={styles.titleWrapper}>
          <Ionicons name="cloud-done" size={24} color={THEME.colors.primary} />
          <Text style={styles.title}>Vercel Cloud Backup</Text>
        </View>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="close" size={22} color={THEME.colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <SyncScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.cardBorder,
  },
  titleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: THEME.colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
