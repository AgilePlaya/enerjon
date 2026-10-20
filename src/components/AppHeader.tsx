import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, StatusBar as RNStatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { THEME } from '../constants/theme';
import { Vehicle } from '../types';
import { getPrimaryVehicle } from '../db/client';
import { VehicleSwitcherModal } from './VehicleSwitcherModal';

interface AppHeaderProps {
  onVehicleChanged?: (vehicle: Vehicle) => void;
}

export function AppHeader({ onVehicleChanged }: AppHeaderProps) {
  const insets = useSafeAreaInsets();
  const [activeVehicle, setActiveVehicle] = useState<Vehicle | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchActiveVehicle = useCallback(async () => {
    try {
      const v = await getPrimaryVehicle();
      setActiveVehicle(v);
    } catch (e) {
      console.error('Failed to fetch active vehicle', e);
    }
  }, []);

  useEffect(() => {
    fetchActiveVehicle();
  }, [fetchActiveVehicle]);

  const handleVehicleSelected = (vehicle: Vehicle) => {
    setActiveVehicle(vehicle);
    onVehicleChanged?.(vehicle);
  };

  // Dynamic top padding ensuring complete clearance below camera punch-holes and status bar
  const topPadding = Math.max(
    insets.top,
    Platform.OS === 'android' ? (RNStatusBar.currentHeight || 28) : 20
  ) + 8;

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      {/* Brand Cluster */}
      <View style={styles.brandRow}>
        <View style={styles.iconCircle}>
          <MaterialCommunityIcons name="speedometer" size={18} color={THEME.colors.primary} />
        </View>
        <Text style={styles.brandText}>enerjon</Text>
      </View>

      {/* Top Right: Vehicle Switcher Dropdown Pill */}
      <TouchableOpacity
        style={styles.vehiclePill}
        activeOpacity={0.8}
        onPress={() => setModalVisible(true)}
      >
        {activeVehicle?.category === '2-wheeler' ? (
          <MaterialCommunityIcons name="motorbike" size={17} color={THEME.colors.primary} />
        ) : (
          <Ionicons name="car-sport" size={15} color={THEME.colors.primary} />
        )}
        <Text style={styles.vehiclePillText} numberOfLines={1}>
          {activeVehicle ? activeVehicle.name : 'Select Vehicle'}
        </Text>
        <Ionicons name="chevron-down" size={13} color={THEME.colors.textMuted} />
      </TouchableOpacity>

      {/* Fleet Management Modal */}
      <VehicleSwitcherModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          fetchActiveVehicle();
        }}
        onVehicleSelected={handleVehicleSelected}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: THEME.colors.background,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: THEME.colors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    fontSize: 22,
    fontWeight: '700',
    color: THEME.colors.primary,
    letterSpacing: -0.5,
    includeFontPadding: false,
    lineHeight: 26,
    textAlignVertical: 'center',
  },
  vehiclePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: THEME.colors.card,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    maxWidth: 180,
  },
  vehiclePillText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    maxWidth: 110,
  },
});
