import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { AppHeader } from '../../src/components/AppHeader';
import { VehicleSwitcherModal } from '../../src/components/VehicleSwitcherModal';
import { THEME } from '../../src/constants/theme';
import { getPrimaryVehicle, addFuelEntry, getAllFuelEntries } from '../../src/db/client';
import { Vehicle, FuelEntry } from '../../src/types';
import { formatCurrency, formatVolume, formatDistance } from '../../src/constants/units';

export interface NewEntryScreenProps {
  showHeader?: boolean;
  activeVehicle?: Vehicle | null;
  onEntrySaved?: () => void;
}

export default function NewEntryScreen({
  showHeader = true,
  activeVehicle,
  onEntrySaved,
}: NewEntryScreenProps = {}) {
  const router = useRouter();
  const [vehicle, setVehicle] = useState<Vehicle | null>(activeVehicle || null);
  const [recentEntries, setRecentEntries] = useState<FuelEntry[]>([]);

  // Form State
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [totalCost, setTotalCost] = useState('');
  const [pricePerUnit, setPricePerUnit] = useState('102.50');
  const [odometer, setOdometer] = useState('');
  const [gasStation, setGasStation] = useState('IndianOil');
  const [isFullTank, setIsFullTank] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [vehicleModalVisible, setVehicleModalVisible] = useState(false);

  useEffect(() => {
    if (activeVehicle) {
      setVehicle(activeVehicle);
    }
  }, [activeVehicle]);

  useEffect(() => {
    async function loadInitial() {
      try {
        const v = activeVehicle || (await getPrimaryVehicle());
        setVehicle(v);
        const entries = await getAllFuelEntries();
        setRecentEntries(entries);
        if (entries.length > 0) {
          const lastOdo = entries[0].odometer;
          setOdometer(String(lastOdo + 450)); // sensible auto-advance
          setPricePerUnit(String(entries[0].price_per_unit || 102.50));
          setGasStation(entries[0].gas_station || 'IndianOil');
        } else {
          setOdometer('42851');
        }
      } catch (e) {
        console.error('Failed to load vehicle info', e);
      }
    }
    loadInitial();
  }, []);

  // Real-time estimated volume calculation
  const costNum = parseFloat(totalCost) || 0;
  const priceNum = parseFloat(pricePerUnit) || 0;
  const estimatedVolume = priceNum > 0 && costNum > 0 ? costNum / priceNum : 0;

  const handleSave = async () => {
    if (!costNum || costNum <= 0) {
      Alert.alert('Invalid Cost', 'Please enter a valid total cost in ₹');
      return;
    }
    if (!priceNum || priceNum <= 0) {
      Alert.alert('Invalid Price', 'Please enter a valid fuel price per liter');
      return;
    }
    const odoNum = parseFloat(odometer);
    if (!odoNum || odoNum <= 0) {
      Alert.alert('Invalid Odometer', 'Please enter current vehicle odometer reading');
      return;
    }

    try {
      setIsSaving(true);
      if (Platform.OS !== 'web') {
        try {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch {}
      }

      await addFuelEntry({
        vehicle_id: vehicle?.id || 'v-nexon-1',
        date,
        odometer: odoNum,
        fuel_amount: estimatedVolume,
        price_per_unit: priceNum,
        total_cost: costNum,
        is_full_tank: isFullTank ? 1 : 0,
        gas_station: gasStation || 'IndianOil',
      });

      // Clear & navigate to history
      setTotalCost('');
      if (onEntrySaved) {
        onEntrySaved();
      } else {
        router.push('/(tabs)/history');
      }
    } catch (e) {
      console.error('Failed to save fuel entry', e);
      Alert.alert('Error', 'Could not save the refueling record.');
    } finally {
      setIsSaving(false);
    }
  };

  const lastEntry = recentEntries.length > 0 ? recentEntries[0] : null;

  return (
    <View style={styles.screen}>
      {showHeader && <AppHeader onVehicleChanged={(v) => setVehicle(v)} />}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* TITLE & SUBTITLE */}
          <View style={styles.headerArea}>
            <Text style={styles.title}>New Refueling</Text>
            <Text style={styles.subtitle}>
              Log your latest trip to the station to track your vehicle's efficiency.
            </Text>
          </View>

          {/* MAIN FORM CARD */}
          <View style={styles.card}>
            {/* SELECT VEHICLE */}
            <Text style={styles.fieldLabel}>SELECT VEHICLE</Text>
            <TouchableOpacity
              style={styles.dropdownInput}
              activeOpacity={0.8}
              onPress={() => setVehicleModalVisible(true)}
            >
              <Text style={styles.dropdownText}>
                {vehicle?.name || 'Tata Nexon - Dark Edition'}
              </Text>
              <Ionicons name="chevron-down" size={18} color={THEME.colors.textMuted} />
            </TouchableOpacity>

            {/* Vehicle Fleet Selection Modal */}
            <VehicleSwitcherModal
              visible={vehicleModalVisible}
              onClose={() => setVehicleModalVisible(false)}
              onVehicleSelected={(v) => setVehicle(v)}
            />

            {/* REFUEL DATE */}
            <Text style={styles.fieldLabel}>REFUEL DATE</Text>
            <View style={styles.iconInputRow}>
              <TextInput
                style={styles.textInput}
                value={date}
                onChangeText={setDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={THEME.colors.textMuted}
              />
              <Ionicons name="calendar-outline" size={18} color={THEME.colors.textMuted} />
            </View>

            {/* TOTAL COST HERO INPUT */}
            <Text style={styles.fieldLabel}>TOTAL COST (₹)</Text>
            <View style={styles.costInputWrapper}>
              <Text style={styles.costCurrencySymbol}>₹</Text>
              <TextInput
                style={styles.costTextInput}
                value={totalCost}
                onChangeText={setTotalCost}
                placeholder="0.00"
                placeholderTextColor={THEME.colors.textMuted}
                keyboardType="numeric"
              />
            </View>

            {/* PRICE PER LITER */}
            <Text style={styles.fieldLabel}>PRICE PER LITER (₹/L)</Text>
            <View style={styles.iconInputRow}>
              <MaterialCommunityIcons name="gas-station" size={18} color={THEME.colors.textMuted} />
              <TextInput
                style={[styles.textInput, { marginLeft: 8 }]}
                value={pricePerUnit}
                onChangeText={setPricePerUnit}
                placeholder="102.50"
                placeholderTextColor={THEME.colors.textMuted}
                keyboardType="numeric"
              />
            </View>

            {/* ODOMETER */}
            <Text style={styles.fieldLabel}>ODOMETER (KM)</Text>
            <View style={styles.iconInputRow}>
              <MaterialCommunityIcons name="speedometer" size={18} color={THEME.colors.textMuted} />
              <TextInput
                style={[styles.textInput, { marginLeft: 8 }]}
                value={odometer}
                onChangeText={setOdometer}
                placeholder="42,851"
                placeholderTextColor={THEME.colors.textMuted}
                keyboardType="numeric"
              />
            </View>

            {/* GAS STATION */}
            <Text style={styles.fieldLabel}>GAS STATION</Text>
            <View style={styles.iconInputRow}>
              <MaterialCommunityIcons name="map-marker-outline" size={18} color={THEME.colors.textMuted} />
              <TextInput
                style={[styles.textInput, { marginLeft: 8 }]}
                value={gasStation}
                onChangeText={setGasStation}
                placeholder="IndianOil, BPCL, HPCL, Shell"
                placeholderTextColor={THEME.colors.textMuted}
              />
            </View>

            {/* FULL TANK TOGGLE */}
            <TouchableOpacity
              style={styles.checkboxRow}
              activeOpacity={0.7}
              onPress={() => setIsFullTank(!isFullTank)}
            >
              <Ionicons
                name={isFullTank ? 'checkbox' : 'square-outline'}
                size={20}
                color={isFullTank ? THEME.colors.primary : THEME.colors.textMuted}
              />
              <Text style={styles.checkboxLabel}>Filled up to full tank (calculates mileage)</Text>
            </TouchableOpacity>

            {/* LIVE ESTIMATED VOLUME BANNER */}
            <View style={styles.infoBanner}>
              <Ionicons name="information-circle-outline" size={20} color={THEME.colors.primary} />
              <Text style={styles.infoBannerText}>
                Estimated fuel volume: {estimatedVolume.toFixed(2)} Liters
              </Text>
            </View>

            {/* SAVE BUTTON */}
            <TouchableOpacity
              style={styles.saveBtn}
              activeOpacity={0.85}
              onPress={handleSave}
              disabled={isSaving}
            >
              <MaterialCommunityIcons name="content-save-outline" size={20} color="#0B131B" />
              <Text style={styles.saveBtnText}>
                {isSaving ? 'Saving...' : 'Save Entry'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* BOTTOM QUICK STATS ROW */}
          <View style={styles.quickStatsRow}>
            <View style={styles.quickStatCard}>
              <Text style={styles.quickStatLabel}>LAST REFUEL</Text>
              <Text style={styles.quickStatValue}>
                {lastEntry ? `${formatDistance(lastEntry.odometer)}` : '12 days ago'}
              </Text>
              <Text style={styles.quickStatSub}>
                {lastEntry ? `${formatCurrency(lastEntry.total_cost)} total` : '₹3,500 total'}
              </Text>
            </View>

            <View style={styles.quickStatCard}>
              <Text style={styles.quickStatLabel}>AVG PRICE</Text>
              <Text style={styles.quickStatValue}>₹102.40/L</Text>
              <Text style={styles.quickStatSub}>Down 1.5% MoM</Text>
            </View>
          </View>

          {/* Space for floating dock */}
          <View style={{ height: 110 }} />
        </ScrollView>
      </KeyboardAvoidingView>
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
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: THEME.colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
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
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 12,
  },
  dropdownInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: THEME.colors.inputBackground,
    borderRadius: THEME.radii.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: THEME.colors.inputBorder,
  },
  dropdownText: {
    fontSize: 15,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
  },
  iconInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.inputBackground,
    borderRadius: THEME.radii.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: THEME.colors.inputBorder,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
  },
  costInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.inputBackground,
    borderRadius: THEME.radii.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorderActive,
  },
  costCurrencySymbol: {
    fontSize: 26,
    fontWeight: '800',
    color: THEME.colors.primary,
    marginRight: 8,
  },
  costTextInput: {
    flex: 1,
    fontSize: 28,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
    marginBottom: 6,
  },
  checkboxLabel: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: THEME.colors.primarySubtle,
    borderRadius: THEME.radii.lg,
    padding: 14,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 194, 255, 0.2)',
  },
  infoBannerText: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.colors.primary,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: THEME.colors.primary,
    borderRadius: THEME.radii.lg,
    paddingVertical: 16,
    ...THEME.shadows.cyanGlow,
    marginTop: 6,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0B131B',
  },
  quickStatsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  quickStatCard: {
    flex: 1,
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radii.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
  },
  quickStatLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.textMuted,
    letterSpacing: 0.8,
  },
  quickStatValue: {
    fontSize: 17,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    marginVertical: 4,
  },
  quickStatSub: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
  },
});
