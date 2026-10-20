import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AppHeader } from '../../src/components/AppHeader';
import { FloatingAddButton } from '../../src/components/FloatingAddButton';
import { THEME } from '../../src/constants/theme';
import { getAllFuelEntries, deleteFuelEntry, getPrimaryVehicle, getFuelEntriesForVehicle } from '../../src/db/client';
import { FuelEntry } from '../../src/types';
import { formatCurrency, formatVolume, formatDistance } from '../../src/constants/units';
import { Vehicle } from '../../src/types';

export interface HistoryScreenProps {
  showHeader?: boolean;
  activeVehicle?: Vehicle | null;
  onNavigateTab?: (index: number) => void;
}

export default function HistoryScreen({
  showHeader = true,
  activeVehicle,
  onNavigateTab,
}: HistoryScreenProps = {}) {
  const [entries, setEntries] = useState<FuelEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const loadEntries = useCallback(async () => {
    try {
      const primary = activeVehicle || (await getPrimaryVehicle());
      const all = await getFuelEntriesForVehicle(primary?.id);
      setEntries(all.length > 0 ? all : await getAllFuelEntries());
    } catch (e) {
      console.error('Failed to load history entries', e);
    }
  }, [activeVehicle]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries, activeVehicle]);

  useFocusEffect(
    useCallback(() => {
      loadEntries();
    }, [loadEntries])
  );

  const handleDelete = (id: string, station: string) => {
    Alert.alert(
      'Delete Entry',
      `Are you sure you want to delete refueling log at ${station}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteFuelEntry(id);
            loadEntries();
          },
        },
      ]
    );
  };

  const filteredEntries = entries.filter((e) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      e.gas_station.toLowerCase().includes(query) ||
      (e.notes && e.notes.toLowerCase().includes(query)) ||
      e.date.includes(query)
    );
  });

  return (
    <View style={styles.screen}>
      {showHeader && <AppHeader onVehicleChanged={() => loadEntries()} />}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* TITLE & SUBTITLE */}
        <View style={styles.headerArea}>
          <Text style={styles.title}>Logs</Text>
          <Text style={styles.subtitle}>Tracking your vehicle energy consumption.</Text>
        </View>

        {/* SEARCH & FILTER ROW */}
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color={THEME.colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search events..."
              placeholderTextColor={THEME.colors.textMuted}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color={THEME.colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity style={styles.filterButton} activeOpacity={0.7}>
            <MaterialCommunityIcons name="tune-variant" size={20} color={THEME.colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* LOG ENTRIES CARDS */}
        {filteredEntries.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.logCard}
            activeOpacity={0.8}
            onLongPress={() => handleDelete(item.id, item.gas_station)}
          >
            {/* TOP ROW: DATE & TOTAL COST */}
            <View style={styles.cardTopRow}>
              <View>
                <Text style={styles.dateLabel}>{item.date.toUpperCase()}</Text>
                <Text style={styles.stationTitle}>{item.gas_station}</Text>
              </View>
              <View style={styles.costBadgeCol}>
                <Text style={styles.costAmount}>{formatCurrency(item.total_cost)}</Text>
                <Text style={styles.costTag}>TOTAL COST</Text>
              </View>
            </View>

            {/* BOTTOM CHIPS: VOLUME & ODOMETER */}
            <View style={styles.chipsRow}>
              <View style={styles.metricChip}>
                <MaterialCommunityIcons name="gas-station" size={16} color={THEME.colors.primary} />
                <View>
                  <Text style={styles.chipMicroLabel}>VOLUME</Text>
                  <Text style={styles.chipValue}>{formatVolume(item.fuel_amount)}</Text>
                </View>
              </View>

              <View style={styles.metricChip}>
                <MaterialCommunityIcons name="speedometer" size={16} color={THEME.colors.primary} />
                <View>
                  <Text style={styles.chipMicroLabel}>ODOMETER</Text>
                  <Text style={styles.chipValue}>{formatDistance(item.odometer)}</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        {filteredEntries.length === 0 && (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="gas-station-off" size={48} color={THEME.colors.textMuted} />
            <Text style={styles.emptyTitle}>No Refuel Logs Found</Text>
            <Text style={styles.emptySubtitle}>
              Tap the electric cyan + button to log your first refueling stop.
            </Text>
          </View>
        )}

        {/* Space for floating dock */}
        <View style={{ height: 110 }} />
      </ScrollView>

      {/* Floating Add Button */}
      <FloatingAddButton onPress={() => (onNavigateTab ? onNavigateTab(1) : undefined)} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  headerArea: {
    marginBottom: 18,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: THEME.colors.textMuted,
    marginTop: 4,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radii.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: THEME.colors.textPrimary,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: THEME.radii.md,
    backgroundColor: THEME.colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
  },
  logCard: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radii.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    marginBottom: 16,
    ...THEME.shadows.card,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  dateLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.textMuted,
    letterSpacing: 0.8,
  },
  stationTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    marginTop: 4,
  },
  costBadgeCol: {
    alignItems: 'flex-end',
  },
  costAmount: {
    fontSize: 24,
    fontWeight: '800',
    color: THEME.colors.primary,
  },
  costTag: {
    fontSize: 9,
    fontWeight: '700',
    color: THEME.colors.textMuted,
    letterSpacing: 0.8,
    marginTop: 2,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metricChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.inputBackground,
    borderRadius: THEME.radii.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
  },
  chipMicroLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: THEME.colors.textMuted,
    letterSpacing: 0.8,
  },
  chipValue: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginTop: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 13,
    color: THEME.colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
});

