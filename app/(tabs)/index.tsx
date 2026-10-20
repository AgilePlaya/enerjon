import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import Svg, { Rect, Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { AppHeader } from '../../src/components/AppHeader';
import { FloatingAddButton } from '../../src/components/FloatingAddButton';
import { THEME } from '../../src/constants/theme';
import { getAllFuelEntries, getPrimaryVehicle, getFuelEntriesForVehicle } from '../../src/db/client';
import { FuelEntry, EfficiencySummary } from '../../src/types';
import { computeEfficiencySummary } from '../../src/services/calculations';
import { formatCurrency, formatVolume, formatEfficiency } from '../../src/constants/units';
import { Vehicle } from '../../src/types';

const SCREEN_WIDTH = Dimensions.get('window').width;

export interface DashboardScreenProps {
  showHeader?: boolean;
  onNavigateTab?: (index: number) => void;
  activeVehicle?: Vehicle | null;
}

export default function DashboardScreen({
  showHeader = true,
  onNavigateTab,
  activeVehicle,
}: DashboardScreenProps = {}) {
  const router = useRouter();
  const [entries, setEntries] = useState<FuelEntry[]>([]);
  const [summary, setSummary] = useState<EfficiencySummary | null>(null);
  const [trendView, setTrendView] = useState<'weekly' | 'monthly'>('monthly');

  const loadData = useCallback(async () => {
    try {
      const primary = activeVehicle || (await getPrimaryVehicle());
      const all = await getFuelEntriesForVehicle(primary?.id);
      setEntries(all.length > 0 ? all : await getAllFuelEntries());
      const summ = computeEfficiencySummary(all.length > 0 ? all : await getAllFuelEntries());
      setSummary(summ);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    }
  }, [activeVehicle]);

  useEffect(() => {
    loadData();
  }, [loadData, activeVehicle]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  return (
    <View style={styles.screen}>
      {showHeader && <AppHeader onVehicleChanged={() => loadData()} />}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* CARD 1: EFFICIENCY INDEX */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardLabel}>EFFICIENCY INDEX</Text>
            <View style={styles.trendBadge}>
              <Feather name="trending-up" size={14} color={THEME.colors.primary} />
              <Text style={styles.trendBadgeText}>+{summary?.yieldChangePercent ?? 12}% vs last month</Text>
            </View>
          </View>

          <View style={styles.heroMetricRow}>
            <Text style={styles.heroNumber}>{summary?.currentYield ?? 18.2}</Text>
            <Text style={styles.heroUnit}>km/L</Text>
          </View>

          {/* SVG 7-Bar Chart */}
          <View style={styles.barChartContainer}>
            <Svg height="90" width={SCREEN_WIDTH - 80}>
              {[
                { height: 42, active: false },
                { height: 56, active: false },
                { height: 38, active: false },
                { height: 68, active: false },
                { height: 50, active: false },
                { height: 84, active: true },
                { height: 62, active: false },
              ].map((bar, idx) => {
                const totalBars = 7;
                const barWidth = 24;
                const availableWidth = SCREEN_WIDTH - 80;
                const gap = (availableWidth - totalBars * barWidth) / (totalBars - 1);
                const x = idx * (barWidth + gap);
                const y = 90 - bar.height;

                return (
                  <Rect
                    key={idx}
                    x={x}
                    y={y}
                    width={barWidth}
                    height={bar.height}
                    rx={6}
                    fill={bar.active ? THEME.colors.primary : '#1A2938'}
                  />
                );
              })}
            </Svg>
          </View>
        </View>

        {/* CARD 2: MONTHLY SPEND */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>MONTHLY SPEND</Text>
          <Text style={styles.spendHeroNumber}>
            {formatCurrency(summary?.monthlySpend ?? 12450)}
          </Text>
          <Text style={styles.cardSubText}>
            Across {summary?.refuelCount ?? 4} refueling stops
          </Text>

          <View style={styles.spendDetailRow}>
            <Text style={styles.detailLabel}>Avg Price/L</Text>
            <Text style={styles.detailValue}>
              {formatCurrency(summary?.avgPricePerUnit ?? 102.50)}
            </Text>
          </View>

          {/* Dual-color Progress Bar */}
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: '65%' }]} />
          </View>

          <View style={styles.spendDetailRow}>
            <Text style={styles.detailLabel}>Fuel Vol</Text>
            <Text style={styles.detailValue}>
              {formatVolume(summary?.totalFuelVolume ?? 121.5)}
            </Text>
          </View>
        </View>

        {/* CARD 3: FUEL PRICE TRENDS */}
        <View style={styles.card}>
          <View style={styles.trendHeaderRow}>
            <View>
              <Text style={styles.trendTitle}>Fuel Price Trends</Text>
              <Text style={styles.cardSubText}>3-month market fluctuation analysis</Text>
            </View>
          </View>

          <View style={styles.segmentedControl}>
            <TouchableOpacity
              style={[styles.segmentBtn, trendView === 'weekly' && styles.segmentBtnActive]}
              onPress={() => setTrendView('weekly')}
              activeOpacity={0.7}
            >
              <Text style={[styles.segmentText, trendView === 'weekly' && styles.segmentTextActive]}>
                Weekly
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.segmentBtn, trendView === 'monthly' && styles.segmentBtnActive]}
              onPress={() => setTrendView('monthly')}
              activeOpacity={0.7}
            >
              <Text style={[styles.segmentText, trendView === 'monthly' && styles.segmentTextActive]}>
                Monthly
              </Text>
            </TouchableOpacity>
          </View>

          {/* SVG Smooth Curve Area Chart */}
          <View style={styles.chartAreaWrapper}>
            <Svg height="140" width={SCREEN_WIDTH - 80}>
              <Defs>
                <LinearGradient id="cyanGradient" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0%" stopColor="#00C2FF" stopOpacity="0.45" />
                  <Stop offset="100%" stopColor="#00C2FF" stopOpacity="0.0" />
                </LinearGradient>
              </Defs>
              {/* Spline Area Fill */}
              <Path
                d={`M 0 100 Q 60 40, 110 90 T 210 20 T 300 120 L 300 140 L 0 140 Z`}
                fill="url(#cyanGradient)"
              />
              {/* Spline Glowing Stroke */}
              <Path
                d={`M 0 100 Q 60 40, 110 90 T 210 20 T 300 120`}
                stroke="#00C2FF"
                strokeWidth={3}
                fill="none"
              />
            </Svg>

            <View style={styles.chartXAxis}>
              <Text style={styles.axisLabel}>AUGUST</Text>
              <Text style={styles.axisLabel}>SEPTEMBER</Text>
              <Text style={styles.axisLabel}>OCTOBER</Text>
            </View>
          </View>
        </View>

        {/* SECTION: RECENT LOG ENTRIES */}
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionTitleWithIcon}>
            <MaterialCommunityIcons name="history" size={20} color={THEME.colors.primary} />
            <Text style={styles.sectionTitle}>Recent Log Entries</Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              if (onNavigateTab) onNavigateTab(2);
              else router.push('/(tabs)/history');
            }}
          >
            <Text style={styles.seeAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        {entries.slice(0, 3).map((entry) => (
          <View key={entry.id} style={styles.logCard}>
            <View style={styles.logLeftCol}>
              <View style={styles.stationIconCircle}>
                <MaterialCommunityIcons name="gas-station" size={18} color={THEME.colors.primary} />
              </View>
              <View>
                <Text style={styles.stationName}>{entry.gas_station}</Text>
                <Text style={styles.logMeta}>
                  {entry.date} • {formatVolume(entry.fuel_amount)} • {formatCurrency(entry.total_cost)}
                </Text>
              </View>
            </View>

            <View style={styles.logRightCol}>
              <Text style={styles.yieldValue}>{formatEfficiency(entry.calculated_efficiency ?? 18.2)}</Text>
              <Text style={styles.yieldTag}>YIELD</Text>
            </View>
          </View>
        ))}

        {/* Space for floating dock */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Add Button */}
      <FloatingAddButton
        onPress={() => (onNavigateTab ? onNavigateTab(1) : router.push('/(tabs)/new-entry'))}
      />
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
  card: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radii.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    marginBottom: 16,
    ...THEME.shadows.card,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
    letterSpacing: 1,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: THEME.colors.primarySubtle,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: THEME.radii.full,
    borderWidth: 1,
    borderColor: 'rgba(0, 194, 255, 0.2)',
  },
  trendBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.colors.primary,
  },
  heroMetricRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginVertical: 4,
  },
  heroNumber: {
    fontSize: 48,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    letterSpacing: -1,
  },
  heroUnit: {
    fontSize: 20,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
  },
  barChartContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  spendHeroNumber: {
    fontSize: 38,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    marginTop: 6,
    letterSpacing: -0.5,
  },
  cardSubText: {
    fontSize: 13,
    color: THEME.colors.textMuted,
    marginTop: 2,
    marginBottom: 14,
  },
  spendDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  detailLabel: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: THEME.colors.chartTrack,
    marginVertical: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: THEME.colors.primary,
    borderRadius: 3,
  },
  trendHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  trendTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.inputBackground,
    borderRadius: THEME.radii.md,
    padding: 3,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: THEME.radii.sm,
  },
  segmentBtnActive: {
    backgroundColor: THEME.colors.card,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorderActive,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.textMuted,
  },
  segmentTextActive: {
    color: THEME.colors.primary,
  },
  chartAreaWrapper: {
    alignItems: 'center',
  },
  chartXAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 8,
    paddingHorizontal: 8,
  },
  axisLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.textMuted,
    letterSpacing: 0.8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  sectionTitleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.colors.primary,
  },
  logCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radii.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    marginBottom: 12,
  },
  logLeftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  stationIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: THEME.colors.inputBackground,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
  },
  stationName: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  logMeta: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  logRightCol: {
    alignItems: 'flex-end',
  },
  yieldValue: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.primary,
  },
  yieldTag: {
    fontSize: 9,
    fontWeight: '700',
    color: THEME.colors.textMuted,
    letterSpacing: 0.8,
    marginTop: 2,
  },
});

