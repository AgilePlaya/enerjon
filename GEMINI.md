# Enerjon - Agent Memory & Project Guidelines

This file records persistent architectural conventions, design decisions, and learnings for **enerjon**. All agents working on this codebase must adhere to these guidelines.

---

## 1. Product & Platform Scope

- **Product Name**: `enerjon` (strictly lowercase).
- **Core Purpose**: Fuel efficiency logging, station price analytics, and fleet management for phone users.
- **Target Environment**: Expo SDK 57, React Native 0.86.3, React 19.2.3.
- **Testing Target**: Android Play Store **Expo Go v57.0.9**.
- **Form Factor**: Phone-only screens (Android & iOS).
- **Localization**: Strictly Indian regional units:
  - Currency: `₹` (INR)
  - Distance: `km`
  - Fuel Volume: `liters` (`L`)
  - Fuel Efficiency: `km/L`
  - Default stations: `IndianOil`, `Bharat Petroleum`, `HP`, `Shell`.

---

## 2. Design System & Border Radius Rules

- **Unified Element Radius (~20px)**:
  - To maintain visual consistency and fluid modern squircle aesthetics, all primary buttons, the floating bottom dock, cards, pills, and major action targets must use `THEME.radii.lg` (`20px`).
  - **Floating Bottom Dock**: `height: 62`, `borderRadius: 22` (`THEME.radii.lg + 2`).
  - **Action & Submit Buttons**: `borderRadius: 20` (`THEME.radii.lg`).
  - **Cards & Metric Containers**: `borderRadius: 20` (`THEME.radii.lg`).
  - **Header Vehicle Pill**: `borderRadius: 20` (`THEME.radii.lg`).
  - **Input Fields & Metric Chips**: `borderRadius: 16` (`THEME.radii.md`).
- **Color Palette**:
  - Background: `#0B131B` (Deep Navy / Charcoal)
  - Surface / Card: `#131F2A` (Rich Dark Slate)
  - Primary Accent: `#00C2FF` (Electric Cyan)
  - Primary Glow: `rgba(0, 194, 255, 0.25)`
  - Primary Subtle: `rgba(0, 194, 255, 0.12)`
  - Success: `#34D399` (Emerald Green)
  - Danger: `#F87171` (Coral Red)
  - Muted Text: `#64748B` / Secondary Text: `#94A3B8`
- **Safe-Area Insets (Punch-Hole & Notches)**:
  - **Top Clearance**: Always calculate dynamic padding:
    `Math.max(insets.top, Platform.OS === 'android' ? (RNStatusBar.currentHeight || 28) : 20) + 8`
    Never use static pixel margins at the top.
  - **Bottom Dock Offset**: Dynamic floating anchor:
    `Math.max(insets.bottom, 12) + 6`

---

## 3. Navigation & Interaction Architecture

- **Horizontal Swipe Navigation (`SwipeableTabContainer`)**:
  - All 5 core pages (`DASH`, `REFUEL`, `LOGS`, `STATS`, `SYNC`) are hosted inside a high-performance native horizontal `ScrollView` with `pagingEnabled={true}`.
  - Users can smoothly swipe between screens with native momentum and snap physics.
  - Swiping updates the active index and transitions the active dock highlight.
  - Tapping any dock tab smoothly scrolls the pager to that page index (`0` to `4`).
- **Persistent Bottom Dock**:
  - The `<CustomBottomDock>` remains visible across all screens, **including the Cloud Sync screen**.
  - All screen scroll views must use `paddingBottom: 110` (or `100`) so content scrolls completely clear of the floating dock.

---

## 4. Vehicle Fleet Management (2W vs 4W)

- **Vehicle Categorization**:
  - Vehicles support `category: '2-wheeler' | '4-wheeler'`.
  - Stored in SQLite `vehicles.category` column (with automatic migration).
- **Dynamic Iconography**:
  - `2-wheeler`: Render `MaterialCommunityIcons name="motorbike"`.
  - `4-wheeler`: Render `Ionicons name="car-sport"`.
- **UI Surfaces**:
  - **Top-Right Header Pill**: Displays the corresponding 2W or 4W icon next to the active vehicle name.
  - **VehicleSwitcherModal**: Allows switching active vehicles, viewing fleet cards with category badges (`2W` vs `4W`), and adding/editing vehicles with a segmented category toggle (`[ 🏍️ 2-Wheeler ] [ 🚗 4-Wheeler ]`).
- **Screen Reactivity**:
  - Changing the active vehicle from the top header updates all 5 pages simultaneously without page reload.

---

## 5. Offline-First Database & Vercel Sync

- **Local Storage**: `expo-sqlite` database (`enerjon.db`).
- **Foreign Keys**: `fuel_entries.vehicle_id` references `vehicles(id) ON DELETE CASCADE`.
- **Cloud Backup**: Vercel serverless endpoints (`/api/backup`, `/api/restore`) backing up local SQLite records in JSON format.

---

## 6. Git Commit Protocol & Cryptographic Signing

- **Header Constraint**: Exactly one line, strictly <= 64 characters.
- **Body Constraint**: Comprehensive details covering every modified module,
  with each line strictly wrapped to a maximum of 80 characters.
- **Git Trailers**:
  - `Signed-off-by: AgilePlaya <60707646+AgilePlaya@users.noreply.github.com>`
  - `Co-authored-by: Gemini <gemini@google.com>`
- **GPG Verification**:
  - All commits must be cryptographically signed (`git commit -S`).
  - Git configured with `commit.gpgsign=true` and key `155D18DE49EBA3D1`.
  - Windows `keyboxd` disabled in `~/.gnupg/common.conf` (`# use-keyboxd`)
    to enable native `pubring.kbx` keyring operations without daemon errors.


