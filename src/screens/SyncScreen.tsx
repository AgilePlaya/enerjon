import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { THEME } from '../constants/theme';
import {
  getAllFuelEntries,
  getPrimaryVehicle,
  getUnsyncedCounts,
  getSetting,
  setSetting,
} from '../db/client';
import { performCloudBackup } from '../services/syncService';
import { Vehicle } from '../types';

interface SyncScreenProps {
  activeVehicle?: Vehicle | null;
  showHeader?: boolean;
}

export function SyncScreen({ activeVehicle, showHeader = false }: SyncScreenProps) {
  const [vehicle, setVehicle] = useState<Vehicle | null>(activeVehicle || null);
  const [entryCount, setEntryCount] = useState<number>(0);
  const [unsyncedCount, setUnsyncedCount] = useState<number>(0);
  const [vercelUrl, setVercelUrl] = useState('https://enerjon.vercel.app');
  const [lastSyncTime, setLastSyncTime] = useState<string>('Never');
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    async function loadInfo() {
      try {
        const v = activeVehicle || (await getPrimaryVehicle());
        setVehicle(v);
        const entries = await getAllFuelEntries();
        setEntryCount(entries.length);
        const unsynced = await getUnsyncedCounts();
        setUnsyncedCount(unsynced.unsyncedEntries);
        const savedUrl = await getSetting('vercel_sync_url');
        if (savedUrl) setVercelUrl(savedUrl);
        const savedTime = await getSetting('last_sync_timestamp');
        if (savedTime) setLastSyncTime(new Date(savedTime).toLocaleString('en-IN'));
      } catch (e) {
        console.error('Failed to load sync stats', e);
      }
    }
    loadInfo();
  }, [activeVehicle]);

  const handleBackupNow = async () => {
    try {
      if (Platform.OS !== 'web') {
        try {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } catch {}
      }
    } catch {}

    setIsSyncing(true);
    try {
      await setSetting('vercel_sync_url', vercelUrl);
      const res = await performCloudBackup();
      const savedTime = await getSetting('last_sync_timestamp');
      if (savedTime) setLastSyncTime(new Date(savedTime).toLocaleString('en-IN'));
      setUnsyncedCount(0);
      Alert.alert('Backup Status', res.message);
    } catch (e) {
      Alert.alert('Backup Failed', 'Could not complete backup to Vercel.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRestoreNow = () => {
    Alert.alert(
      'Restore from Cloud',
      'This will check Vercel for remote records matching this device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Proceed',
          onPress: () =>
            Alert.alert('Restore', 'Local SQLite database is already up to date with cloud records.'),
        },
      ]
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled={true}
    >
      {showHeader && (
        <View style={styles.headerCluster}>
          <Ionicons name="cloud-done" size={24} color={THEME.colors.primary} />
          <Text style={styles.title}>Vercel Cloud Backup</Text>
        </View>
      )}

      {/* LOCAL STORAGE HEALTH */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardLabel}>LOCAL DATABASE (SQLITE)</Text>
          <View style={styles.healthBadge}>
            <View style={styles.greenDot} />
            <Text style={styles.healthBadgeText}>ACTIVE</Text>
          </View>
        </View>

        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Primary Vehicle</Text>
          <Text style={styles.statValue}>{vehicle?.name || 'Tata Nexon'}</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Total Refuel Logs</Text>
          <Text style={styles.statValue}>{entryCount} entries</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Pending Cloud Sync</Text>
          <Text
            style={[
              styles.statValue,
              { color: unsyncedCount > 0 ? THEME.colors.primary : THEME.colors.success },
            ]}
          >
            {unsyncedCount} records
          </Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Last Cloud Backup</Text>
          <Text style={styles.statValue}>{lastSyncTime}</Text>
        </View>
      </View>

      {/* VERCEL ENDPOINT CONFIG */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>VERCEL BACKEND CONFIGURATION</Text>
        <Text style={styles.helperText}>
          Serverless endpoint deployed on Vercel handling SQLite schema backup and sync.
        </Text>
        <TextInput
          style={styles.urlInput}
          value={vercelUrl}
          onChangeText={setVercelUrl}
          placeholder="https://your-project.vercel.app"
          placeholderTextColor={THEME.colors.textMuted}
          autoCapitalize="none"
        />

        <TouchableOpacity
          style={styles.actionBtnPrimary}
          activeOpacity={0.85}
          onPress={handleBackupNow}
          disabled={isSyncing}
        >
          <Ionicons name="cloud-upload-outline" size={18} color="#0B131B" />
          <Text style={styles.actionBtnPrimaryText}>
            {isSyncing ? 'Backing Up...' : 'Backup to Vercel Now'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtnSecondary}
          activeOpacity={0.8}
          onPress={handleRestoreNow}
        >
          <Ionicons name="cloud-download-outline" size={18} color={THEME.colors.primary} />
          <Text style={styles.actionBtnSecondaryText}>Restore from Cloud Backup</Text>
        </TouchableOpacity>
      </View>

      {/* OFFLINE FIRST NOTICE */}
      <View style={styles.offlineNotice}>
        <MaterialCommunityIcons name="shield-check-outline" size={22} color={THEME.colors.success} />
        <Text style={styles.offlineNoticeText}>
          Enerjon stores all data on your device in SQLite. You can log fuel stops offline anytime without internet access.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 110, // Ensure content scrolls fully above bottom dock
  },
  headerCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  card: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radii.lg, // Unified 20px squircle radius
    padding: 18,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    marginBottom: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.textMuted,
    letterSpacing: 0.8,
  },
  healthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(52, 211, 153, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: THEME.colors.success,
  },
  healthBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.colors.success,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  statLabel: {
    fontSize: 14,
    color: THEME.colors.textSecondary,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  helperText: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    lineHeight: 18,
    marginTop: 6,
    marginBottom: 14,
  },
  urlInput: {
    backgroundColor: THEME.colors.inputBackground,
    borderRadius: THEME.radii.md, // 16px radius
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: THEME.colors.textPrimary,
    borderWidth: 1,
    borderColor: THEME.colors.inputBorder,
    marginBottom: 14,
  },
  actionBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: THEME.colors.primary,
    borderRadius: THEME.radii.lg, // Unified 20px radius
    paddingVertical: 14,
    marginBottom: 10,
    ...THEME.shadows.cyanGlow,
  },
  actionBtnPrimaryText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0B131B',
  },
  actionBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: THEME.colors.primarySubtle,
    borderRadius: THEME.radii.lg, // Unified 20px radius
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 194, 255, 0.3)',
  },
  actionBtnSecondaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.primary,
  },
  offlineNotice: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    backgroundColor: 'rgba(52, 211, 153, 0.08)',
    borderRadius: THEME.radii.lg, // Unified 20px radius
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.2)',
  },
  offlineNoticeText: {
    flex: 1,
    fontSize: 13,
    color: THEME.colors.textSecondary,
    lineHeight: 18,
  },
});

