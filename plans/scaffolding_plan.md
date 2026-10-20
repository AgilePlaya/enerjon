# Enerjon - Scaffolding & Architecture Plan

## 1. Project Overview & Objective
**Enerjon** (referred to in legacy design mocks as *Fuel Prism*) is a mobile application built with React Native and Expo, targeted at both Android and iOS phone devices. Its primary purpose is to help vehicle owners track:
- Fuel usage, volume (liters/gallons), and fuel prices
- Vehicle mileage (odometer readings) and fuel efficiency (km/L, L/100km, or MPG)
- Vehicle health, performance, maintenance, and operating expenses
- Historical records, statistics, and expense breakdowns

> **Brand Note**: The product name is officially **Enerjon**. All references to "Fuel Prism" in original Figma render mocks are superseded by **Enerjon**.

### Testing & Deployment Target
- **Expo Go**: The app is designed and engineered to run directly in **Expo Go** on physical mobile devices during development and testing without requiring custom native compilation.
- **Form Factor**: Phone-only mobile UX (portrait-optimized, responsive to notches, dynamic islands, and home indicators).
- **Future Distribution**: Production builds generated via EAS (Expo Application Services) targeting Google Play Store (Android) and Apple App Store (iOS).

---

## 2. Selected Architecture & Software Stack (Confirmed)

### A. Database & Persistence: Hybrid Architecture (Offline-First + Vercel Cloud Backup)
- **Local Database (Client)**: **`expo-sqlite`** (Expo's modern SQLite module)
  - **Why**: 100% offline-ready when logging fuel at gas stations with low reception; instant query response times for dashboard metrics and history lists; 100% Expo Go native support.
  - **Local Tables**: `vehicles`, `fuel_entries`, `maintenance_entries`, `app_settings`.
- **Cloud Backend & Backup**: **Vercel Serverless / Edge Functions + Vercel Postgres (Neon)**
  - **Why**: Directly matches user requirements for Vercel hosting and automated backups.
  - **Sync Mechanism**: A lightweight sync client in `src/services/syncService.ts`:
    - Reads unsynced records (`synced_at IS NULL`).
    - Sends batches to `/api/sync/push` on Vercel.
    - Pulls remote updates from `/api/sync/pull` and updates local SQLite.
    - Export / Backup feature: One-tap JSON/SQL export & cloud backup trigger in modal.

---

### B. Navigation & Routing: Expo Router (v4)
- **Structure**: Modern file-based routing built on top of React Navigation.
- **Floating Bottom Dock**:
  - `(tabs)/index.tsx`: **DASH** (Figma: `Updated Dashboard.png`)
  - `(tabs)/new-entry.tsx`: **REFUEL** (Figma: `New Entry.png`)
  - `(tabs)/history.tsx`: **LOGS** (Figma: `History.png`)
  - `(tabs)/statistics.tsx`: **STATS** (Figma: `Statistics.png`)
- **Modals / Stack**:
  - `modal.tsx`: Cloud Backup & Sync with Vercel URL config and SQLite local inspection.

---

### C. UI & Styling Framework: NativeWind (v4) / Tailwind CSS & Vector Icons
- **Theme Palette**:
  - Deep obsidian dark background (`#0B131B`)
  - Rich dark card containers (`#131F2A`) with subtle translucent borders (`rgba(255, 255, 255, 0.06)`)
  - Glowing electric cyan accents (`#00C2FF`)
  - Muted slate typography (`#94A3B8`, `#64748B`)
- **Figma Reference Mapping**:
  - Top header (`AppHeader.tsx`) with Enerjon branding, notifications, and profile.
  - Floating Action Button (`FloatingAddButton.tsx`) with cyan glow on Dashboard and Logs screens.
  - Interactive SVG visualizations (`react-native-svg`) for the Efficiency bar chart, Fuel price trend curve, and Price per Station donut chart.

---

## 3. Data Schema & Core Domain Models

### 1. `vehicles`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | TEXT PRIMARY KEY | UUID string (e.g. `'v-nexon-1'`) |
| `name` | TEXT NOT NULL | Vehicle name (e.g. `"Tata Nexon - Dark Edition"`) |
| `license_plate` | TEXT | Registration number (e.g. `"KA-01-EQ-7700"`) |
| `fuel_type` | TEXT NOT NULL | `'petrol' \| 'diesel' \| 'cng' \| 'hybrid' \| 'electric'` |
| `fuel_unit` | TEXT NOT NULL | Default Indian unit: `'liters'` (`'liters' \| 'gal'`) |
| `distance_unit` | TEXT NOT NULL | Default Indian unit: `'km'` (`'km' \| 'mi'`) |
| `currency_symbol`| TEXT NOT NULL | Default Indian unit: `'₹'` (`'₹' \| '$' \| '€' \| '£'`) |
| `is_primary` | INTEGER NOT NULL | 1 if active vehicle, 0 otherwise |
| `created_at` | TEXT NOT NULL | ISO date string |
| `updated_at` | TEXT NOT NULL | ISO date string |
| `synced_at` | TEXT | Nullable timestamp of last Vercel sync |

### 2. `fuel_entries`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | TEXT PRIMARY KEY | UUID string (e.g. `'f-1'`) |
| `vehicle_id` | TEXT NOT NULL | FK -> `vehicles(id)` |
| `date` | TEXT NOT NULL | ISO date string (e.g. `"2026-10-20"`) |
| `odometer` | REAL NOT NULL | Current odometer reading in km |
| `fuel_amount` | REAL NOT NULL | Quantity filled in liters |
| `price_per_unit` | REAL NOT NULL | Price per liter (e.g. `102.50`) |
| `total_cost` | REAL NOT NULL | Total cost in ₹ (`fuel_amount * price_per_unit`) |
| `is_full_tank` | INTEGER NOT NULL | 1 if full tank (used to calculate efficiency) |
| `gas_station` | TEXT | Station name (e.g. IndianOil, BPCL, HPCL, Shell India) |
| `notes` | TEXT | Optional notes |
| `calculated_efficiency` | REAL | Calculated km/L since last full tank |
| `created_at` | TEXT NOT NULL | ISO date string |
| `updated_at` | TEXT NOT NULL | ISO date string |
| `synced_at` | TEXT | Nullable timestamp of last Vercel sync |

---

## 4. Repository Scaffolding Structure

```text
enerjon/
├── app/                        # Expo Router pages
│   ├── (tabs)/                 # Bottom floating dock navigation
│   │   ├── _layout.tsx         # Floating dock options & custom tab icons (DASH, REFUEL, LOGS, STATS)
│   │   ├── index.tsx           # Dashboard (Figma: Updated Dashboard.png)
│   │   ├── new-entry.tsx       # New Fuel Refueling (Figma: New Entry.png)
│   │   ├── history.tsx         # Logs timeline & search (Figma: History.png)
│   │   └── statistics.tsx      # Efficiency Trends & charts (Figma: Statistics.png)
│   ├── modal.tsx               # Backup & Vercel Cloud Sync modal
│   ├── +not-found.tsx          # 404 fallback
│   └── _layout.tsx             # Root layout with SQLiteProvider & Theme
├── src/
│   ├── components/             # Reusable UI components
│   │   ├── AppHeader.tsx       # Top bar with Enerjon logo, notifications & avatar
│   │   └── FloatingAddButton.tsx # Electric cyan FAB with glow
│   ├── db/                     # Local SQLite layer
│   │   ├── client.ts           # SQLiteProvider & database query helpers
│   │   └── schema.ts           # CREATE TABLE DDL & Figma seed data
│   ├── services/               # Logic & calculations
│   │   ├── calculations.ts     # Efficiency (MPG / km/L), formatting
│   │   └── syncService.ts      # Vercel sync service
│   ├── types/                  # TypeScript domain models
│   └── constants/              # Theme tokens & units
├── api/                        # Vercel Serverless Function
│   └── sync/
│       └── push.ts             # Vercel handler to receive SQLite backup
├── assets/                     # App icons, splash, fonts
├── figma_renders/              # Figma design references
│   ├── Updated Dashboard.png
│   ├── New Entry.png
│   ├── History.png
│   └── Statistics.png
├── plans/
│   ├── scaffolding_plan.md     # Architecture & high-level specification
│   └── plan-v0.1-implementation.md # Detailed v0.1 implementation blueprint
├── app.json                    # Expo configuration
├── metro.config.js             # Metro config with NativeWind
├── tailwind.config.js          # Tailwind CSS configuration
├── package.json                # Dependencies & scripts
├── tsconfig.json               # TypeScript configuration
└── .gitignore                  # Git ignore rules
```

---

## 5. Execution Roadmap & Status

- [x] **Phase 1: Architecture Alignment & Strategy**
  - Confirmed: Expo Go target, Expo Router v4, Hybrid DB (Local SQLite + Vercel backup).
  - Defined brand evolution: "Enerjon" replacing legacy mock title "Fuel Prism".
  - Configured Indian unit defaults: `₹` (INR), `liters`, `km`, `km/L`.
- [x] **Phase 2: Project Initialization & Configuration**
  - Initialized Expo project with TypeScript, Expo Router, `expo-sqlite`, `react-native-svg`, `@expo/vector-icons`, and safe area context.
  - Configured `metro.config.js`, `tsconfig.json`, and `app.json`.
- [x] **Phase 3: Database & Local Schema Setup**
  - Implemented `src/db/schema.ts` and `src/db/client.ts` with SQLite migrations and auto-initialization.
  - Seeded initial realistic Indian records (`Tata Nexon - Dark Edition`, `IndianOil`, `BPCL`, `HPCL`, `Shell India`).
- [x] **Phase 4: Navigation & Floating Dock Layout**
  - Built sleek floating bottom dock in `app/(tabs)/_layout.tsx` (DASH, REFUEL, LOGS, STATS).
  - Built top `AppHeader.tsx` (Enerjon branding, notifications, user avatar).
  - Built floating action button `FloatingAddButton.tsx` with electric cyan glow.
- [x] **Phase 5: Screen Implementations (Faithful to `figma_renders/`)**
  - **Dashboard** (`Updated Dashboard.png`): Efficiency Index (`18.2 km/L`) with glowing cyan SVG bar chart, Monthly Spend breakdown (`₹12,450.00`), Fuel Price Trends curve, Recent Refuels list.
  - **New Refueling** (`New Entry.png`): Vehicle selector, date picker, prominent cyan `₹`, price/unit (`₹/L`), odometer (`km`), live estimated fuel volume banner (`L`), glowing Save button, and quick comparison cards.
  - **Logs / History** (`History.png`): Search & filter header, detailed log cards with date, station, total cost, volume and odometer chips.
  - **Statistics** (`Statistics.png`): Efficiency Trends hero, Monthly Fuel Spending 6-month bar chart, Average Monthly Cost, Total Mileage, Price per Station donut chart with legend, and Eco Score recommendation card.
- [x] **Phase 6: Vercel Sync Engine & Modal**
  - Implemented `src/services/syncService.ts` and `api/sync/backup.ts` for Vercel backups.
  - Modal UI for one-tap backup trigger and SQLite inspection.
- [ ] **Phase 7: Mobile-Only Optimization & Store Prep**
  - Validate in Expo Go on physical mobile devices.
  - Configure EAS build profile for future Google Play Store and Apple App Store deployment.

*Note: For the granular step-by-step technical breakdown, see `plans/plan-v0.1-implementation.md`.*
