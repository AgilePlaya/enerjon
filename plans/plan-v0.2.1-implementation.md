# Enerjon - v0.2.1 Implementation Plan
## Bottom Dock Alignment, Vehicle Switcher Dropdown & Nav Redistribution

## 1. Executive Summary & Objective

In **v0.2.1**, we resolve persistent bottom navigation bar misalignment, redistribute top-right utilities to the bottom dock, and transform the top-right header into an interactive **Vehicle Switcher Dropdown** that enables switching active vehicles, creating new vehicles, and managing the vehicle fleet.

### Key Deliverables in v0.2.1:
1. **Pixel-Perfect Bottom Dock Alignment**:
   - Eliminate React Navigation's default `BottomTabBar` layout quirks by introducing a dedicated **`CustomBottomDockTabBar`** component.
   - Achieve 100% optical symmetry, even tab widths (`flex: 1`), and uniform vertical centering without icon constraint clipping.
2. **Top-Right Navigation Redistribution**:
   - Remove the icon cluster (cloud sync, notifications, profile) from the top-right of `AppHeader`.
   - Relocate Cloud Backup, Sync status, and app settings into the bottom dock as a 5th dedicated tab: **`SYNC`** (or **`MORE`**).
3. **Interactive Top-Right Vehicle Switcher Dropdown**:
   - Display the active vehicle in a sleek header pill: `[Car Icon] Tata Nexon ▼`.
   - On tap, launch an interactive bottom-sheet / modal allowing the user to:
     - Switch active vehicle with immediate live data reactivity across all screens.
     - Add new vehicles with custom name, fuel type (Petrol, Diesel, CNG, Hybrid, EV), plate, and units.
     - Edit or delete existing saved vehicles.

---

## 2. Root Cause Analysis: Bottom Navbar Misalignment

### Why React Navigation Default BottomTabBar Was Misaligned:
1. **Compound Icon Hack**:
   - In React Navigation `<Tabs>`, `tabBarIcon` is designed strictly for a single icon glyph (`size: 24`).
   - When custom compound views (`<TabItem>` containing both an icon and a text label) are returned from `tabBarIcon` with `tabBarShowLabel: false`, React Navigation's internal icon slot applies fixed layout constraints that vertically squeeze or displace the label.
2. **Conflicting Safe-Area Insets**:
   - When applying `position: 'absolute'` in `tabBarStyle`, React Navigation's internal tab bar wrapper still injects default padding and safe-area adjustments that conflict with custom manual offsets, leading to off-center vertical alignment on Android phones.
3. **Unequal Width Distribution**:
   - On narrower phone screens (e.g. 360–380dp wide devices), fixed min-width tab items cause uneven gaps between tabs.

### The Architectural Solution:
Implement a native **Custom Tab Bar Renderer** via `tabBar={(props) => <CustomBottomDock {...props} />}`:
- Total layout control using React Native Flexbox (`flexDirection: 'row'`, `alignItems: 'center'`).
- Each tab button receives `flex: 1` with centered content (`alignItems: 'center'`, `justifyContent: 'center'`).
- The active tab renders a soft cyan pill highlight (`#00C2FF1A`) centered around its icon and label.
- Dynamic bottom offset calculated via `Math.max(insets.bottom, 12) + 6`.

---

## 3. UI/UX Architecture & Specifications

### A. Top-Right Vehicle Switcher Pill (`src/components/AppHeader.tsx`)

#### Visual Appearance:
- **Pill Container**:
  - Background: `#131F2A` (Card surface)
  - Border: `1px solid rgba(255, 255, 255, 0.08)`
  - Border Radius: `20px`
  - Padding: `6px 12px`
  - Flex Row: Car icon (`Ionicons name="car-sport"` or `MaterialCommunityIcons name="car-side"` in cyan), vehicle name (e.g. `"Tata Nexon"` truncated to 12 chars), and a small chevron down.

#### Dropdown Modal / Bottom Sheet (`VehicleSwitcherModal.tsx`):
- **Header**: `"Vehicle Fleet"` with close icon.
- **Vehicle Selection List**:
  - Cards showing vehicle name, license plate, fuel type badge (`PETROL`, `DIESEL`, `CNG`, `EV`), and an active checkmark for the currently selected vehicle.
  - Tapping a card marks it as primary (`is_primary = 1`), updates SQLite, closes the modal, and triggers a live refresh of all screens.
- **Quick Action Row**:
  - `+ Add New Vehicle`: Opens an in-line creation form (Name, License Plate, Fuel Type, Currency, Units).
  - `Edit Vehicles`: Allows renaming, changing fuel type, or deleting secondary vehicles.

---

### B. Redistributed Bottom Dock (`app/(tabs)/_layout.tsx`)

The floating bottom dock will feature 5 symmetrically distributed tabs:

| Tab | Label | Icon | Functionality |
| :---: | :---: | :---: | :--- |
| 1 | **DASH** | `Ionicons name="grid"` | Primary Dashboard (efficiency index, monthly spend, price trends) |
| 2 | **REFUEL** | `MaterialCommunityIcons name="gas-station"` | New Refuel Logger with real-time volume calculation |
| 3 | **LOGS** | `MaterialCommunityIcons name="history"` | Chronological refueling logs with search & delete |
| 4 | **STATS** | `Ionicons name="stats-chart"` | Analytics, station price donut chart, 6-month bars, eco score |
| 5 | **SYNC** | `Ionicons name="cloud-done"` | Cloud Backup to Vercel, Sync status, backup restore & settings |

#### Optical Alignment Specifications:
- Container:
  - `height: 62`
  - `borderRadius: 31`
  - `flexDirection: 'row'`
  - `alignItems: 'center'`
  - `justifyContent: 'space-evenly'`
- Tab Items:
  - `flex: 1`
  - `alignItems: 'center'`
  - `justifyContent: 'center'`
  - `height: 48`
  - `borderRadius: 16`
- Typography:
  - `fontSize: 9.5`
  - `fontWeight: '700'`
  - `includeFontPadding: false`
  - `lineHeight: 12`
  - `marginTop: 2`
- Active State:
  - `backgroundColor: 'rgba(0, 194, 255, 0.12)'`
  - `borderWidth: 1`
  - `borderColor: 'rgba(0, 194, 255, 0.25)'`

---

## 4. Database Layer Enhancements (`src/db/client.ts`)

To support multi-vehicle switching and management:

```typescript
// 1. Set Active Primary Vehicle
export async function setActiveVehicle(vehicleId: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE vehicles SET is_primary = 0;');
  await db.runAsync('UPDATE vehicles SET is_primary = 1, updated_at = ? WHERE id = ?;', [
    new Date().toISOString(),
    vehicleId,
  ]);
}

// 2. Add New Vehicle
export async function createVehicle(params: {
  name: string;
  license_plate?: string;
  fuel_type: FuelType;
  fuel_unit: FuelUnit;
  distance_unit: DistanceUnit;
  currency_symbol: CurrencySymbol;
}): Promise<Vehicle> { ... }

// 3. Update Vehicle
export async function updateVehicle(vehicle: Vehicle): Promise<void> { ... }

// 4. Delete Vehicle (if more than 1 exists)
export async function deleteVehicle(vehicleId: string): Promise<void> { ... }
```

---

## 5. Implementation Steps & Roadmap (v0.2.1)

- [x] **Phase 1: Database Operations for Fleet Management**
  - Implement `setActiveVehicle`, `createVehicle`, `updateVehicle`, and `deleteVehicle` in `src/db/client.ts`.
  - Add multi-vehicle seed data (e.g. secondary vehicle `Hyundai Creta SX`).

- [x] **Phase 2: Custom Bottom Dock Component (`CustomBottomDockTabBar`)**
  - Create `src/components/CustomBottomDock.tsx` replacing React Navigation's default `BottomTabBar`.
  - Implement 5-tab symmetrical layout (`DASH`, `REFUEL`, `LOGS`, `STATS`, `SYNC`).
  - Wire the `SYNC` tab to open the Vercel Cloud Backup & Settings screen/modal.

- [x] **Phase 3: Vehicle Switcher Dropdown & Modal**
  - Create `src/components/VehicleSwitcherModal.tsx`:
    - List of saved vehicles with active checkmark.
    - Inline vehicle creation form with Indian defaults (`Petrol`, `Liters`, `km`, `₹`).
    - Vehicle editing and deletion controls.
  - Refactor `src/components/AppHeader.tsx`:
    - Remove top-right icons (cloud, bell, avatar).
    - Add the vehicle switcher pill button in the top right.
    - Connect pill button to open `VehicleSwitcherModal`.

- [x] **Phase 4: Screen Re-activity & State Integration**
  - Ensure all screens (`index.tsx`, `new-entry.tsx`, `history.tsx`, `statistics.tsx`) filter data by the active `vehicle_id`.
  - Provide a vehicle selection listener so switching vehicles immediately updates dashboard metrics and log lists.

- [x] **Phase 5: Multi-Device Verification**
  - Verify symmetrical alignment on Android phone via Expo Go.
  - Test adding a new vehicle, switching between vehicles, and verifying fuel entries filter accordingly.
  - Run `npx tsc --noEmit` and `npx expo-doctor` to ensure 100% compliance.
