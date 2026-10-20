import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import Svg, { Rect, Circle } from 'react-native-svg';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AppHeader } from '../../src/components/AppHeader';
import { THEME } from '../../src/constants/theme';
import { getAllFuelEntries, getPrimaryVehicle, getFuelEntriesForVehicle } from '../../src/db/client';
import { FuelEntry, EfficiencySummary, MonthlySpendData, StationPriceComparison } from '../../src/types';
import {
  computeEfficiencySummary,
  computeMonthlySpendHistory,
  computeStationPriceComparison,
} from '../../src/services/calculations';
import { formatCurrency, formatDistance } from '../../src/constants/units';
import { Vehicle } from '../../src/types';

const SCREEN_WIDTH = Dimensions.get('window').width;

export interface StatisticsScreenProps {
  showHeader?: boolean;
  activeVehicle?: Vehicle | null;
}

export default function StatisticsScreen({
  showHeader = true,
  activeVehicle,
}: StatisticsScreenProps = {}) {
  const router = useRouter();
  const [summary, setSummary] = useState<EfficiencySummary | null>(null);
  const [monthlyHistory, setMonthlyHistory] = useState<MonthlySpendData[]>([]);
  const [stationComparison, setStationComparison] = useState<StationPriceComparison[]>([]);

  const loadStats = useCallback(async () => {
    try {
      const primary = activeVehicle || (await getPrimaryVehicle());
      const all = await getFuelEntriesForVehicle(primary?.id);
      const entriesToUse = all.length > 0 ? all : await getAllFuelEntries();
      setSummary(computeEfficiencySummary(entriesToUse));
      setMonthlyHistory(computeMonthlySpendHistory(entriesToUse));
      setStationComparison(computeStationPriceComparison(entriesToUse));
    } catch (e) {
      console.error('Failed to load statistics', e);
    }
  }, [activeVehicle]);

  useEffect(() => {
    loadStats();
  }, [loadStats, activeVehicle]);

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [loadStats])
  );

  return (
    <View style={styles.screen}>
      {showHeader && <AppHeader onVehicleChanged={() => loadStats()} />}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER AREA */}
        <View style={styles.headerArea}>
          <Text style={styles.superTitle}>PERFORMANCE OVERVIEW</Text>
          <View style={styles.titleRow}>
            <Text style={styles.titleWhite}>Efficiency </Text>
            <Text style={styles.titleCyan}>Trends</Text>
          </View>
        </View>

        {/* TOP KPI BADGES */}
        <View style={styles.kpiRow}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiValue}>+{summary?.yieldChangePercent ?? 14}%</Text>
            <Text style={styles.kpiLabel}>EFFICIENCY</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiValue}>
              {Math.round((summary?.totalDistanceRun ?? 2400) / 100) / 10}k
            </Text>
            <Text style={styles.kpiLabel}>KM RUN</Text>
          </View>
        </View>

        {/* CARD 1: MONTHLY FUEL SPENDING */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Monthly Fuel Spending</Text>
            <View style={styles.pillBadge}>
              <Text style={styles.pillBadgeText}>Last 6 Months</Text>
            </View>
          </View>
          <Text style={styles.cardSubtitle}>Comparison of last 6 months against budget</Text>

          {/* 6-BAR SVG CHART */}
          <View style={styles.barChartWrapper}>
            <Svg height="130" width={SCREEN_WIDTH - 80}>
              {monthlyHistory.map((item, idx) => {
                const totalBars = 6;
                const barWidth = 32;
                const availableWidth = SCREEN_WIDTH - 80;
                const gap = (availableWidth - totalBars * barWidth) / (totalBars - 1);
                const x = idx * (barWidth + gap);
                // Scale height between 30 and 110 based on amount
                const maxAmount = Math.max(...monthlyHistory.map((m) => m.amount), 15000);
                const barHeight = Math.max(30, Math.round((item.amount / maxAmount) * 110));
                const y = 110 - barHeight;

                return (
                  <Rect
                    key={idx}
                    x={x}
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    rx={6}
                    fill={item.isCurrent ? THEME.colors.primary : '#1A2938'}
                  />
                );
              })}
            </Svg>

            {/* X-AXIS LABELS */}
            <View style={styles.barXAxis}>
              {monthlyHistory.map((item, idx) => (
                <Text
                  key={idx}
                  style={[
                    styles.barLabel,
                    item.isCurrent && { color: THEME.colors.primary, fontWeight: '800' },
                  ]}
                >
                  {item.month}
                </Text>
              ))}
            </View>
          </View>
        </View>

        {/* CARD 2: AVERAGE MONTHLY COST */}
        <View style={styles.card}>
          <Text style={styles.microLabel}>AVERAGE MONTHLY COST</Text>
          <Text style={styles.metricNumber}>
            {formatCurrency(summary?.monthlySpend ?? 12480)}
          </Text>
          <View style={styles.badgeRow}>
            <Feather name="trending-down" size={14} color={THEME.colors.primary} />
            <Text style={styles.badgeText}>-4.2% from last month</Text>
          </View>
        </View>

        {/* CARD 3: TOTAL MILEAGE */}
        <View style={styles.card}>
          <Text style={styles.microLabel}>TOTAL MILEAGE</Text>
          <Text style={styles.metricNumber}>{formatDistance(18840)}</Text>
          <View style={styles.badgeRow}>
            <Ionicons name="checkmark-circle" size={14} color={THEME.colors.primary} />
            <Text style={styles.badgeText}>On track for annual goal</Text>
          </View>
        </View>

        {/* CARD 4: PRICE PER STATION (DONUT CHART) */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Price per Station</Text>
            <MaterialCommunityIcons name="dots-vertical" size={20} color={THEME.colors.textMuted} />
          </View>

          {/* SVG DONUT CHART */}
          <View style={styles.donutContainer}>
            <View style={styles.donutSvgWrapper}>
              <Svg width="160" height="160" viewBox="0 0 160 160">
                {/* Background Track */}
                <Circle
                  cx="80"
                  cy="80"
                  r="62"
                  stroke="#1A2938"
                  strokeWidth="12"
                  fill="none"
                />
                {/* Primary Station Arc */}
                <Circle
                  cx="80"
                  cy="80"
                  r="62"
                  stroke={THEME.colors.primary}
                  strokeWidth="12"
                  strokeDasharray="280 390"
                  strokeLinecap="round"
                  fill="none"
                />
              </Svg>
              <View style={styles.donutCenterText}>
                <Text style={styles.donutCenterLabel}>AVG PRICE</Text>
                <Text style={styles.donutCenterValue}>
                  ₹{summary?.avgPricePerUnit.toFixed(2) ?? '102.40'}
                </Text>
              </View>
            </View>

            {/* STATION LEGEND LIST */}
            <View style={styles.stationLegendList}>
              {stationComparison.map((st, idx) => (
                <View key={idx} style={styles.stationLegendRow}>
                  <View style={styles.legendLeft}>
                    <View style={[styles.colorDot, { backgroundColor: st.color }]} />
                    <Text style={styles.legendStationName}>{st.station}</Text>
                  </View>
                  <Text style={styles.legendPrice}>₹{st.avgPrice.toFixed(2)}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* CARD 5: EFFICIENCY RECOMMENDATION */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Efficiency Recommendation</Text>
          <Text style={styles.recommendationText}>
            Based on your recent highway logs, shifting cruising speed from 100km/h down to 85km/h could save an estimated ₹1,200 per month.
          </Text>

          <View style={styles.recommendationBadgesRow}>
            <View style={styles.recSubCard}>
              <MaterialCommunityIcons name="leaf" size={20} color={THEME.colors.primary} />
              <View>
                <Text style={styles.recMicroLabel}>CURRENT ECO SCORE</Text>
                <Text style={styles.recValue}>{summary?.ecoScore ?? 82}/100</Text>
              </View>
            </View>

            <View style={styles.recSubCard}>
              <Feather name="zap" size={20} color={THEME.colors.primary} />
              <View>
                <Text style={styles.recMicroLabel}>POTENTIAL SAVING</Text>
                <Text style={styles.recValue}>{summary?.potentialSavingsPercent ?? 12}%</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.detailedLogsBtn}
            activeOpacity={0.85}
            onPress={() => router.push('/(tabs)/history')}
          >
            <Text style={styles.detailedLogsBtnText}>View Detailed Log History</Text>
          </TouchableOpacity>
        </View>

        {/* Space for floating dock */}
        <View style={{ height: 110 }} />
      </ScrollView>
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
    marginBottom: 16,
  },
  superTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.textMuted,
    letterSpacing: 1.2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 4,
  },
  titleWhite: {
    fontSize: 32,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  titleCyan: {
    fontSize: 32,
    fontWeight: '800',
    color: THEME.colors.primary,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radii.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
  },
  kpiValue: {
    fontSize: 26,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.textMuted,
    letterSpacing: 0.8,
    marginTop: 2,
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
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  cardSubtitle: {
    fontSize: 13,
    color: THEME.colors.textMuted,
    marginTop: 2,
    marginBottom: 16,
  },
  pillBadge: {
    backgroundColor: THEME.colors.inputBackground,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: THEME.radii.full,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
  },
  pillBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
  },
  barChartWrapper: {
    marginTop: 8,
    alignItems: 'center',
  },
  barXAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
    paddingHorizontal: 6,
  },
  barLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: THEME.colors.textMuted,
    width: 32,
    textAlign: 'center',
  },
  microLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.textMuted,
    letterSpacing: 0.8,
  },
  metricNumber: {
    fontSize: 32,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    marginVertical: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.primary,
  },
  donutContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  donutSvgWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 160,
    height: 160,
  },
  donutCenterText: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutCenterLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.textMuted,
    letterSpacing: 0.8,
  },
  donutCenterValue: {
    fontSize: 20,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    marginTop: 2,
  },
  stationLegendList: {
    width: '100%',
    marginTop: 18,
    gap: 10,
  },
  stationLegendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  legendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendStationName: {
    fontSize: 14,
    color: THEME.colors.textSecondary,
    fontWeight: '600',
  },
  legendPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  recommendationText: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    lineHeight: 19,
    marginTop: 8,
    marginBottom: 16,
  },
  recommendationBadgesRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  recSubCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.inputBackground,
    borderRadius: THEME.radii.lg,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
  },
  recMicroLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: THEME.colors.textMuted,
    letterSpacing: 0.6,
  },
  recValue: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    marginTop: 2,
  },
  detailedLogsBtn: {
    backgroundColor: THEME.colors.primary,
    borderRadius: THEME.radii.full,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...THEME.shadows.cyanGlow,
  },
  detailedLogsBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0B131B',
  },
});

