# Enerjon - v0.2.5 Implementation Plan
## Unified Border Radius, Swipeable Horizontal Pager, Persistent Bottom Dock & 2-Wheeler/4-Wheeler Fleet

## 1. Executive Summary & Objective

In **v0.2.5**, we elevate the tactile feel and visual elegance of **enerjon** with four key enhancements:
1. **Unified Design System & Border Radius**: Standardize border radius (~`20px`) across all primary interactive and container elements — including buttons, the floating bottom dock, cards, inputs, and header pills — to establish a cohesive, modern squircle design language.
2. **Persistent Bottom Dock Across All Screens**: Transition Cloud Sync into a native 5th tab page (`SYNC`), ensuring the floating bottom dock is visible at all times across all views.
3. **Fluid Horizontal Swipe Navigation**: Enable gesture-driven horizontal swiping between all 5 pages (`DASH`, `REFUEL`, `LOGS`, `STATS`, `SYNC`), synchronized seamlessly with the bottom dock's active cyan highlight pill and tap transitions.
4. **2-Wheeler & 4-Wheeler Vehicle Categorization**: Allow users to classify vehicles in their fleet as either `2-wheeler` or `4-wheeler`, dynamically updating vehicle icons (`motorbike` vs `car-sport`) in the top-right header pill, fleet management list, and creation modals.
5. **Agent Memory Persistence**: Document core design decisions, architectural patterns, and units in `GEMINI.md` to persist learnings across future development sessions.

---

## 2. Design System: Unified Border Radius (~20px)

### Visual Consistency Analysis:
Previously, UI elements used disconnected radii (`borderRadius: 31` on the dock, `12`/`14`/`16` on buttons, `20` on pills). In v0.2.5, we unify around an intentional squircle radius standard:

| UI Element | Radius Token | Value | Rationale |
| :--- | :--- | :--- | :--- |
| **Floating Bottom Dock** | `THEME.radii.lg` | `20px` (or `22px`) | Matches cards and action buttons, replacing the hyper-round capsule |
| **Primary Action Buttons** | `THEME.radii.lg` | `20px` | Bold, tactile touch targets matching the dock's curvature |
| **Dashboard & Metric Cards** | `THEME.radii.lg` | `20px` | Smooth, modern corner curvature |
| **Top Header Vehicle Pill** | `THEME.radii.lg` | `20px` | Cohesive squircle pill styling |
| **Form Input Containers** | `THEME.radii.md` | `16px`–`18px` | Slightly nested radius for inner form fields |
| **Modal Sheets & Overlays** | `THEME.radii.xl` | `24px` | Top-sheet / bottom-sheet rounded corners |
| **Dock Active Tab Highlight** | `THEME.radii.md` | `14px`–`16px` | Neatly nested inside the 20px–22px dock frame |

---

## 3. Navigation: Swipeable 5-Tab Horizontal Pager

### Architecture:
Instead of static non-swipeable scene switching, we implement a native `SwipeableTabContainer`:
- Utilizes React Native's high-performance native `ScrollView` with `horizontal={true}`, `pagingEnabled={true}`, `showsHorizontalScrollIndicator={false}`, and `scrollEventThrottle={16}`.
- Zero third-party binary dependencies, ensuring 100% compatibility with Expo Go v57.0.9 on Android and iOS.
- Contains 5 full-width pages:
  1. `DASH` (Index 0): Live efficiency, monthly spend, recent logs, station trends.
  2. `REFUEL` (Index 1): Fast refuel logger with real-time volume calculation.
  3. `LOGS` (Index 2): Chronological list with search, delete, and vehicle filtering.
  4. `STATS` (Index 3): Detailed analytics, donut breakdown, 6-month bars, eco score.
  5. `SYNC` (Index 4): Vercel cloud backup, SQLite database health, restore & backup triggers.
- **Bi-directional Synchronization**:
  - **Swipe ➔ Dock**: Swiping left/right fires `onMomentumScrollEnd`, updating the active index and sliding the cyan dock highlight pill.
  - **Dock ➔ Pager**: Tapping any dock tab triggers `scrollTo({ x: index * screenWidth, animated: true })`.
- **Persistent Visibility**: The `<CustomBottomDock>` is pinned above the safe-area insets and remains visible continuously across all 5 pages including `SYNC`.

---

## 4. Vehicle Fleet: 2-Wheeler vs 4-Wheeler

### Database & Type Specifications:
1. **Type Definition**:
   ```typescript
   export type VehicleCategory = '2-wheeler' | '4-wheeler';
   ```
2. **Schema Migration**:
   ```sql
   ALTER TABLE vehicles ADD COLUMN category TEXT NOT NULL DEFAULT '4-wheeler';
   ```
3. **Dynamic Iconography**:
   - `2-wheeler`: `MaterialCommunityIcons name="motorbike"`
   - `4-wheeler`: `Ionicons name="car-sport"`
4. **Interactive Fleet UI**:
   - **Header Pill**: Shows motorcycle icon for 2-wheelers and car icon for 4-wheelers.
   - **Add/Edit Modal**: Features a segmented chip toggle:
     `[ 🏍️ 2-Wheeler ]   [ 🚗 4-Wheeler ]`
   - **Seed Fleet**: Includes `Royal Enfield Classic 350` (2W) alongside `Tata Nexon` (4W) and `Hyundai Creta` (4W).

---

## 5. Agent Memory Persistence (`GEMINI.md`)

Document persistent rules for the project:
- Dark theme palette & electric cyan primary `#00C2FF`.
- Indian localized units (`₹`, `km`, `liters`, `km/L`).
- Unified `20px` border radius rules for buttons, docks, and cards.
- Multi-vehicle support (2W / 4W).
- Expo SDK 57 / Expo Go v57.0.9 platform constraints.

---

## 6. Implementation Steps & Roadmap

- [x] **Phase 1: Database & Type Upgrades for 2W/4W**
  - Update `Vehicle` interface in `src/types/index.ts` to include `category: VehicleCategory`.
  - Update `src/db/schema.ts` and `src/db/client.ts` with SQLite migration for `category`.
  - Add 2-wheeler seed vehicle (`Royal Enfield Classic 350`).

- [x] **Phase 2: Vehicle Switcher & Header 2W/4W Support**
  - Add 2-wheeler / 4-wheeler segmented selector in `src/components/VehicleSwitcherModal.tsx`.
  - Update `src/components/AppHeader.tsx` to render motorbike or car icon dynamically based on active vehicle's category.

- [x] **Phase 3: Unified Border Radius Theme & Component Styling**
  - Update `src/constants/theme.ts` with refined border radius scale.
  - Apply uniform `20px` border radius to `CustomBottomDock`, buttons, cards, and input fields.

- [x] **Phase 4: Sync Tab & Persistent Bottom Dock**
  - Create `src/screens/SyncScreen.tsx` and `app/(tabs)/sync.tsx` containing the full Vercel Cloud Backup interface.
  - Wire the 5th tab `SYNC` directly into tab navigation so the dock never disappears.

- [x] **Phase 5: Horizontal Swipe Pager (`SwipeableTabContainer`)**
  - Build `src/components/SwipeableTabContainer.tsx` with high-performance native paging.
  - Connect swipe momentum events with dock active index.
  - Wrap tab navigation so swiping between DASH, REFUEL, LOGS, STATS, and SYNC is fluid and frictionless.

- [x] **Phase 6: Agent Memory & Verification**
  - Create `GEMINI.md` in the workspace root documenting design rules and learnings.
  - Run `npx tsc --noEmit` to verify type safety.
  - Verify multi-vehicle 2W/4W switching and swipe fluidity.
