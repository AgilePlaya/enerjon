import React from 'react';
import { StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { THEME } from '../constants/theme';

export interface FloatingAddButtonProps {
  onPress?: () => void;
}

export function FloatingAddButton({ onPress }: FloatingAddButtonProps = {}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handlePress = async () => {
    if (Platform.OS !== 'web') {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch {
        // Safe fallback if haptics is unavailable
      }
    }
    if (onPress) {
      onPress();
    } else {
      router.push('/(tabs)/new-entry');
    }
  };

  // Dynamically position above the floating dock regardless of device safe-area insets
  const dockBottom = Math.max(insets.bottom, 12) + 6;
  const fabBottom = dockBottom + 64 + 14;

  return (
    <TouchableOpacity
      style={[styles.fab, { bottom: fabBottom }]}
      activeOpacity={0.85}
      onPress={handlePress}
    >
      <Ionicons name="add" size={32} color="#0B131B" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    width: 58,
    height: 58,
    borderRadius: THEME.radii.lg, // Unified 20px squircle
    backgroundColor: THEME.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...THEME.shadows.cyanGlow,
    zIndex: 99,
  },
});
