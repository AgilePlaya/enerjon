import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SyncScreen } from '../../src/screens/SyncScreen';
import { THEME } from '../../src/constants/theme';

export default function SyncTabScreen() {
  return (
    <View style={styles.container}>
      <SyncScreen showHeader={true} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
});

