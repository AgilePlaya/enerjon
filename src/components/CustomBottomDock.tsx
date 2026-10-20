import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { THEME } from '../constants/theme';

export interface CustomBottomDockProps {
  activeIndex?: number;
  onTabPress?: (index: number) => void;
  state?: {
    index: number;
    routes: { key: string; name: string }[];
  };
  navigation?: {
    navigate: (name: string) => void;
  };
}

interface TabConfig {
  routeName: string;
  label: string;
  renderIcon: (focused: boolean, color: string) => React.ReactNode;
}

const TABS: TabConfig[] = [
  {
    routeName: 'index',
    label: 'DASH',
    renderIcon: (focused, color) => (
      <Ionicons name={focused ? 'grid' : 'grid-outline'} size={18} color={color} />
    ),
  },
  {
    routeName: 'new-entry',
    label: 'REFUEL',
    renderIcon: (focused, color) => (
      <MaterialCommunityIcons
        name={focused ? 'gas-station' : 'gas-station-outline'}
        size={19}
        color={color}
      />
    ),
  },
  {
    routeName: 'history',
    label: 'LOGS',
    renderIcon: (focused, color) => (
      <MaterialCommunityIcons name="history" size={19} color={color} />
    ),
  },
  {
    routeName: 'statistics',
    label: 'STATS',
    renderIcon: (focused, color) => (
      <Ionicons name={focused ? 'stats-chart' : 'stats-chart-outline'} size={18} color={color} />
    ),
  },
  {
    routeName: 'sync',
    label: 'SYNC',
    renderIcon: (focused, color) => (
      <Ionicons name={focused ? 'cloud-done' : 'cloud-outline'} size={18} color={color} />
    ),
  },
];

export function CustomBottomDock({ activeIndex, onTabPress, state, navigation }: CustomBottomDockProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Dynamic bottom calculation to float cleanly above Android navigation pill & iOS home bar
  const bottomOffset = Math.max(insets.bottom, 12) + 6;

  const handleTabPress = async (index: number, routeName: string, isFocused: boolean) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}

    if (onTabPress) {
      onTabPress(index);
    } else if (!isFocused && navigation) {
      navigation.navigate(routeName);
    } else if (!isFocused) {
      router.push(`/(tabs)/${routeName === 'index' ? '' : routeName}` as any);
    }
  };

  return (
    <View style={[styles.floatingDock, { bottom: bottomOffset }]}>
      {TABS.map((tab, idx) => {
        let isFocused = false;
        if (typeof activeIndex === 'number') {
          isFocused = activeIndex === idx;
        } else if (state) {
          const routeIndex = state.routes.findIndex((r: { name: string }) => r.name === tab.routeName);
          isFocused = state.index === routeIndex;
        }

        const color = isFocused ? THEME.colors.primary : THEME.colors.textMuted;

        return (
          <TouchableOpacity
            key={tab.routeName}
            style={[styles.tabButton, isFocused && styles.tabButtonActive]}
            activeOpacity={0.7}
            onPress={() => handleTabPress(idx, tab.routeName, isFocused)}
          >
            {tab.renderIcon(isFocused, color)}
            <Text style={[styles.tabLabel, { color }]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  floatingDock: {
    position: 'absolute',
    left: 16,
    right: 16,
    height: 62,
    backgroundColor: THEME.colors.dockBackground,
    borderRadius: 22, // Unified squircle radius matching cards & buttons
    borderWidth: 1,
    borderColor: THEME.colors.dockBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingHorizontal: 6,
    elevation: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.55,
    shadowRadius: 16,
  },
  tabButton: {
    flex: 1,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: THEME.radii.md,
    paddingVertical: 4,
    marginHorizontal: 2,
  },
  tabButtonActive: {
    backgroundColor: THEME.colors.primarySubtle,
    borderRadius: THEME.radii.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 194, 255, 0.25)',
  },
  tabLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.5,
    includeFontPadding: false,
    lineHeight: 12,
    textAlign: 'center',
    marginTop: 2,
  },
});
