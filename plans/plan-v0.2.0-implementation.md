# Enerjon - v0.2 Implementation Plan
## Safe Area Ergonomics, Edge-to-Edge Display & Navbar Optical Alignment

## 1. Executive Summary & Problem Analysis

During dogfooding and testing on physical Android devices via Expo Go, two critical UI/UX issues were observed:

1. **Top Screen Clipping & Notch / Camera Collision**:
   - The app's viewport begins at the physical top glass edge (`y = 0`) of the phone display.
   - On modern Android devices (Android 14/15) where edge-to-edge display is enforced, `AppHeader` starts with static padding (`paddingTop: 12`), causing the Enerjon brand logo, notification bell, and profile buttons to collide directly with the system notification icons, status bar clock, and the physical selfie camera punch-hole cutout.
2. **Navbar Alignment & Visual Imbalance**:
   - In `AppHeader.tsx`, the brand logo icon and typography are misaligned across the vertical center axis due to unconstrained Android font metrics (`includeFontPadding`).
   - In the right-hand action cluster, icon buttons feature disparate optical weights and non-uniform icon dimensions (cloud: 20px, bell: 20px, avatar: 26px).
   - In the bottom navigation dock (`app/(tabs)/_layout.tsx`), compound views (icon + label) rendered inside React Navigation's default `tabBarIcon` slot cause slight vertical offsets and touch-target squishing across different screen widths.
   - The bottom dock's fixed bottom offset (`16px`) risks touching or conflicting with Android gesture navigation bars and iOS home indicators.

**Objective of v0.2**:
Implement industry-standard mobile design patterns and safe-area architecture to deliver a polished, edge-to-edge experience that adapts dynamically to every phone display form factor (punch-hole cameras, teardrop notches, Dynamic Islands, and navigation bars).

---

## 2. App Design Best Practices Research (Industry Standards)

### A. Safe Area & Edge-to-Edge Architecture
Modern mobile design guidelines (Google Material Design 3 and Apple Human Interface Guidelines) mandate that applications draw background surfaces edge-to-edge behind system chrome while strictly constraining interactive content within hardware-safe zones.

1. **Never Hardcode Status Bar or Notch Heights**:
   - Hardware cutout shapes vary dramatically across manufacturers (Samsung Infinity-O punch holes, Google Pixel camera cutouts, OnePlus corners, Apple Dynamic Island).
   - Insets range from `24dp` on basic displays up to `54dp` on modern high-DPI curved/punch-hole screens.
   - **Best Practice**: Always use `useSafeAreaInsets()` from `react-native-safe-area-context` to dynamically query the device's hardware safe perimeter.
2. **Transparent System Bars with Content Bleed**:
   - Enerjon's signature deep obsidian background (`#0B131B`) should bleed seamlessly into the status bar area at the top and the navigation bar area at the bottom.
   - Use `<StatusBar style="light" translucent backgroundColor="transparent" />` from `expo-status-bar`.
3. **Safe Area Insets Distribution Rule**:
   - **Headers / Top App Bars**: Apply `paddingTop: insets.top + buffer` so the background color extends to the top edge while the interactive elements (logo, buttons) remain fully below the notification icons and camera cutout.
   - **Floating Bottom Docks**: Apply `bottom: Math.max(insets.bottom, 12) + 8` to ensure the floating dock clears both the Android gesture navigation pill and the iOS home indicator without excessive blank space.
   - **Scrollable Content**: Apply dynamic bottom padding (`DOCK_HEIGHT + DOCK_OFFSET + insets.bottom + 16`) so lists can be scrolled completely clear of the floating dock.

---

### B. Navbar & Header Optical Alignment Standards
1. **Vertical Centering & Standard App Bar Height**:
   - Material Design specifies a standard top app bar height of `56dp` to `64dp` for mobile phones.
   - All children inside the header must be strictly aligned with `alignItems: 'center'` in a single horizontal row (`flexDirection: 'row'`).
2. **Android Font Metric Normalization**:
   - By default, Android applies font padding (`includeFontPadding: true`) to text components, causing non-uniform vertical space above and below text characters. This causes text next to an icon to look vertically dropped or raised.
   - **Fix**: Apply `includeFontPadding: false` and explicit `lineHeight` matching the font size to ensure identical baseline centering between icons and typography.
3. **Harmonized Icon & Button Shells**:
   - Action buttons must share identical outer dimensions (e.g. `38x38` circle with `borderRadius: 19`) and identical internal icon bounding boxes (e.g. `20x20` centered).
   - This ensures visual harmony across cloud, notification, and profile icons.
4. **Touch Target Accessibility**:
   - Minimum interactive touch target size is `44x44dp` (iOS) / `48x48dp` (Android).
   - Use `hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}` on compact 36–38dp button shells to guarantee effortless one-handed tapping.

---

### C. Floating Bottom Dock Ergonomics
1. **Separation of Icon and Label in React Navigation**:
   - Avoid rendering custom multi-line compound components inside `tabBarIcon` with `tabBarShowLabel: false`. React Navigation's internal icon slot applies fixed layout constraints that cause vertical clipping on some DPIs.
   - **Best Practice**: Either:
     - Use React Navigation's native `tabBarLabel` and `tabBarItemStyle` with custom styling, OR
     - Implement a dedicated custom tab bar component via `tabBar={(props) => <FloatingDockTabBar {...props} />}`.
2. **Uniform Tab Distribution**:
   - Each tab button should occupy `flex: 1` with a centered column layout (`alignItems: 'center', justifyContent: 'center'`).
   - Active state indicator should be a sleek rounded pill that encloses both icon and label symmetrically without shifting sibling tabs.

---

## 3. Technical Specifications & File-by-File Changes

### A. `src/components/AppHeader.tsx` (Top Navigation Bar)

#### Issues in v0.1:
- Static `paddingTop: 12` ignores device status bar, notch, and punch-hole camera.
- Brand logo (28x28 icon + 22px text) lacks baseline alignment and font padding normalization.
- Right action buttons have mismatched icon sizes (20px vs 26px) and inconsistent optical centers.

#### v0.2 Specification:
```tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, StatusBar as RNStatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { THEME } from '../constants/theme';

export function AppHeader({ showSearchIcon = false }: { title?: string; showSearchIcon?: boolean }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Dynamic top padding guaranteeing clearance below punch-holes & status bar
  const topPadding = Math.max(
    insets.top,
    Platform.OS === 'android' ? (RNStatusBar.currentHeight || 24) : 20
  ) + 6;

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      {/* Brand Cluster */}
      <View style={styles.brandRow}>
        <View style={styles.iconCircle}>
          <MaterialCommunityIcons name="speedometer" size={18} color={THEME.colors.primary} />
        </View>
        <Text style={styles.brandText}>enerjon</Text>
      </View>

      {/* Action Cluster */}
      <View style={styles.actionCluster}>
        {showSearchIcon ? (
          <TouchableOpacity style={styles.iconButton} activeOpacity={0.7} hitSlop={styles.hitSlop}>
            <Ionicons name="search" size={19} color={THEME.colors.textPrimary} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.iconButton}
            activeOpacity={0.7}
            hitSlop={styles.hitSlop}
            onPress={() => router.push('/modal')}
          >
            <Ionicons name="cloud-outline" size={19} color={THEME.colors.textSecondary} />
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.iconButton} activeOpacity={0.7} hitSlop={styles.hitSlop}>
          <View style={styles.bellWrapper}>
            <Ionicons name="notifications-outline" size={19} color={THEME.colors.textPrimary} />
            <View style={styles.unreadDot} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.iconButton} activeOpacity={0.7} hitSlop={styles.hitSlop}>
          <Ionicons name="person-outline" size={19} color={THEME.colors.textPrimary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
```

Key Fixes in Styles:
- Set `height: 52 + topPadding` to lock the visual bar to a consistent `52dp` content height.
- `brandText`: Add `includeFontPadding: false` and `lineHeight: 24` to vertically align typography with the 28x28 icon circle.
- Harmonize all 3 action buttons to `36x36` with identical icon size `19px`.

---

### B. `app/_layout.tsx` (Root Safe Area & System Chrome)

#### Issues in v0.1:
- `<StatusBar style="light" />` did not set `translucent` or `backgroundColor="transparent"`, leading to inconsistent drawing on Android devices with edge-to-edge system bars.

#### v0.2 Specification:
```tsx
<SafeAreaProvider style={styles.container}>
  <StatusBar style="light" translucent backgroundColor="transparent" />
  <Stack ... />
</SafeAreaProvider>
```

---

### C. `app/(tabs)/_layout.tsx` (Floating Bottom Dock)

#### Issues in v0.1:
- Static `bottom: Platform.OS === 'ios' ? 24 : 16` ignores dynamic Android gesture navigation handle heights.
- Putting custom `<TabItem>` (containing both icon + label) inside `tabBarIcon` causes vertical constraint clipping.

#### v0.2 Specification:
- Use `useSafeAreaInsets()` to calculate `bottom`:
  ```tsx
  const insets = useSafeAreaInsets();
  const bottomOffset = Math.max(insets.bottom, 12) + 6;
  ```
- Use a dedicated custom tab bar component (`tabBar={(props) => <FloatingDockTabBar {...props} />}`) OR configure React Navigation options:
  - `tabBarShowLabel: false`
  - Explicit `tabBarItemStyle: { height: 56, justifyContent: 'center', alignItems: 'center' }`
  - Perfectly centered tab buttons with consistent horizontal margins and hitSlop.

---

### D. `app/modal.tsx` (Vercel Cloud Backup Modal)

#### Issues in v0.1:
- Modal starts with static `paddingTop: 20`, colliding with the Android status bar and selfie camera cutout when presented full-screen or as a modal page.

#### v0.2 Specification:
- Add `useSafeAreaInsets()` to dynamically compute top padding:
  ```tsx
  const insets = useSafeAreaInsets();
  const modalTopPadding = Math.max(insets.top, Platform.OS === 'android' ? 24 : 16) + 8;
  ```
- Apply to `headerRow` so close button and title are comfortably clear of any hardware punch-hole.

---

### E. Floating Add Button (`src/components/FloatingAddButton.tsx`)

#### Issues in v0.1:
- `bottom: 95` was hardcoded, causing the FAB to sit either too close or too far from the bottom dock on phones with tall gesture navigation insets.

#### v0.2 Specification:
- Dynamic calculation based on dock position:
  ```tsx
  const insets = useSafeAreaInsets();
  const fabBottom = Math.max(insets.bottom, 12) + 6 + 64 + 14; // Inset + Dock offset + Dock height + spacing
  ```

---

## 4. Step-by-Step Implementation Roadmap (v0.2)

- [ ] **Phase 1: Global Safe Area & Edge-to-Edge Sync**
  - Update `app/_layout.tsx` with `<StatusBar style="light" translucent backgroundColor="transparent" />`.
  - Verify `SafeAreaProvider` encloses the entire navigation stack.

- [ ] **Phase 2: AppHeader Optical & Top Inset Alignment**
  - Refactor `src/components/AppHeader.tsx`:
    - Inject `useSafeAreaInsets()` and compute dynamic top padding.
    - Normalize typography with `includeFontPadding: false` and explicit `lineHeight`.
    - Standardize action buttons (`36x36` shells, `19px` icons) for consistent visual weight.
    - Add `hitSlop` to all action buttons for improved one-hand usability.

- [ ] **Phase 3: Floating Bottom Dock Refactoring**
  - Refactor `app/(tabs)/_layout.tsx`:
    - Inject `useSafeAreaInsets()` for dynamic bottom positioning (`Math.max(insets.bottom, 12) + 6`).
    - Resolve tab icon & label alignment so they render without constraint clipping.
    - Refactor `src/components/FloatingAddButton.tsx` to dynamically anchor above the floating dock.

- [ ] **Phase 4: Modal & Screen Clearance Refinement**
  - Update `app/modal.tsx` header with dynamic `topPadding`.
  - Verify bottom scroll padding across all 4 screens (`index.tsx`, `new-entry.tsx`, `history.tsx`, `statistics.tsx`) to guarantee no card is blocked by the floating dock.

- [ ] **Phase 5: Multi-Device Verification**
  - Verify layout on physical Android phone via Expo Go (confirming selfie camera clearance).
  - Run `npx tsc --noEmit` to verify type safety.
  - Run `npx expo-doctor` to ensure SDK 57 compliance.

