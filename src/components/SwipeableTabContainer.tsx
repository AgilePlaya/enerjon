import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
  Platform,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { usePathname } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { AppHeader } from './AppHeader';
import { CustomBottomDock } from './CustomBottomDock';
import { THEME } from '../constants/theme';
import { Vehicle } from '../types';
import { getPrimaryVehicle } from '../db/client';

// Screen Views
import DashboardScreen from '../../app/(tabs)/index';
import NewEntryScreen from '../../app/(tabs)/new-entry';
import HistoryScreen from '../../app/(tabs)/history';
import StatisticsScreen from '../../app/(tabs)/statistics';
import { SyncScreen } from '../screens/SyncScreen';

export interface SwipeableTabContainerProps {
  initialPage?: number;
}

export function SwipeableTabContainer({ initialPage = 0 }: SwipeableTabContainerProps) {
  const { width } = useWindowDimensions();
  const pathname = usePathname();
  const [activeIndex, setActiveIndex] = useState(initialPage);
  const [activeVehicle, setActiveVehicle] = useState<Vehicle | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const pagerRef = useRef<ScrollView>(null);
  const isScrollingByTab = useRef(false);

  // Load active vehicle on mount
  useEffect(() => {
    async function loadVehicle() {
      try {
        const v = await getPrimaryVehicle();
        setActiveVehicle(v);
      } catch (e) {
        console.error('Failed to load primary vehicle in pager', e);
      }
    }
    loadVehicle();
  }, [refreshTrigger]);

  // Navigate to initial page based on prop or route pathname
  useEffect(() => {
    let target = initialPage;
    if (pathname.includes('new-entry')) target = 1;
    else if (pathname.includes('history')) target = 2;
    else if (pathname.includes('statistics')) target = 3;
    else if (pathname.includes('sync')) target = 4;

    if (target >= 0 && target <= 4) {
      setTimeout(() => {
        pagerRef.current?.scrollTo({ x: target * width, animated: false });
        setActiveIndex(target);
      }, 50);
    }
  }, [pathname, initialPage, width]);

  const scrollToPage = useCallback(
    async (pageIndex: number) => {
      if (pageIndex < 0 || pageIndex > 4) return;
      isScrollingByTab.current = true;
      setActiveIndex(pageIndex);

      pagerRef.current?.scrollTo({ x: pageIndex * width, animated: true });

      setTimeout(() => {
        isScrollingByTab.current = false;
      }, 400);
    },
    [width]
  );

  const handleMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (isScrollingByTab.current) return;
    const offsetX = e.nativeEvent.contentOffset.x;
    const newIndex = Math.round(offsetX / width);
    if (newIndex >= 0 && newIndex <= 4 && newIndex !== activeIndex) {
      setActiveIndex(newIndex);
      if (Platform.OS !== 'web') {
        try {
          Haptics.selectionAsync();
        } catch {}
      }
    }
  };

  const handleVehicleChanged = (vehicle: Vehicle) => {
    setActiveVehicle(vehicle);
    setRefreshTrigger((k) => k + 1);
  };

  const handleEntrySaved = () => {
    setRefreshTrigger((k) => k + 1);
    scrollToPage(2); // Auto-glide to LOGS tab after saving refueling
  };

  return (
    <View style={styles.container}>
      {/* 1. FIXED TOP HEADER WITH VEHICLE SWITCHER PILL */}
      <AppHeader onVehicleChanged={handleVehicleChanged} />

      {/* 2. BUTTERY-SMOOTH HORIZONTAL SWIPEABLE PAGER */}
      <ScrollView
        ref={pagerRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
        scrollEventThrottle={16}
        nestedScrollEnabled={true}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        style={styles.pagerScroll}
      >
        {/* PAGE 0: DASHBOARD */}
        <View style={{ width, height: '100%' }}>
          <DashboardScreen
            showHeader={false}
            activeVehicle={activeVehicle}
            onNavigateTab={scrollToPage}
          />
        </View>

        {/* PAGE 1: REFUEL LOGGER */}
        <View style={{ width, height: '100%' }}>
          <NewEntryScreen
            showHeader={false}
            activeVehicle={activeVehicle}
            onEntrySaved={handleEntrySaved}
          />
        </View>

        {/* PAGE 2: LOGS / HISTORY */}
        <View style={{ width, height: '100%' }}>
          <HistoryScreen
            showHeader={false}
            activeVehicle={activeVehicle}
            onNavigateTab={scrollToPage}
          />
        </View>

        {/* PAGE 3: STATISTICS & ANALYTICS */}
        <View style={{ width, height: '100%' }}>
          <StatisticsScreen showHeader={false} activeVehicle={activeVehicle} />
        </View>

        {/* PAGE 4: VERCEL CLOUD SYNC & SETTINGS */}
        <View style={{ width, height: '100%' }}>
          <SyncScreen showHeader={false} activeVehicle={activeVehicle} />
        </View>
      </ScrollView>

      {/* 3. PERSISTENT CUSTOM BOTTOM DOCK (VISIBLE ON ALL SCREENS INCL. SYNC) */}
      <CustomBottomDock activeIndex={activeIndex} onTabPress={scrollToPage} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  pagerScroll: {
    flex: 1,
  },
});
