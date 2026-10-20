import { Vehicle, FuelEntry } from '../types';

export const CREATE_TABLES_SQL = `
CREATE TABLE IF NOT EXISTS vehicles (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '4-wheeler',
  license_plate TEXT,
  fuel_type TEXT NOT NULL DEFAULT 'petrol',
  fuel_unit TEXT NOT NULL DEFAULT 'liters',
  distance_unit TEXT NOT NULL DEFAULT 'km',
  currency_symbol TEXT NOT NULL DEFAULT '₹',
  is_primary INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  synced_at TEXT
);

CREATE TABLE IF NOT EXISTS fuel_entries (
  id TEXT PRIMARY KEY NOT NULL,
  vehicle_id TEXT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  odometer REAL NOT NULL,
  fuel_amount REAL NOT NULL,
  price_per_unit REAL NOT NULL,
  total_cost REAL NOT NULL,
  is_full_tank INTEGER NOT NULL DEFAULT 1,
  gas_station TEXT NOT NULL,
  notes TEXT,
  calculated_efficiency REAL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  synced_at TEXT
);

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_fuel_entries_vehicle ON fuel_entries(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_fuel_entries_date ON fuel_entries(date DESC);
CREATE INDEX IF NOT EXISTS idx_fuel_entries_sync ON fuel_entries(synced_at);
`;

export const INITIAL_VEHICLES: Vehicle[] = [
  {
    id: 'v-nexon-1',
    name: 'Tata Nexon - Dark Edition',
    category: '4-wheeler',
    license_plate: 'KA-01-EQ-7700',
    fuel_type: 'petrol',
    fuel_unit: 'liters',
    distance_unit: 'km',
    currency_symbol: '₹',
    is_primary: 1,
    created_at: '2026-09-01T08:00:00Z',
    updated_at: '2026-09-01T08:00:00Z',
    synced_at: null,
  },
  {
    id: 'v-creta-2',
    name: 'Hyundai Creta SX',
    category: '4-wheeler',
    license_plate: 'KA-05-MH-2022',
    fuel_type: 'diesel',
    fuel_unit: 'liters',
    distance_unit: 'km',
    currency_symbol: '₹',
    is_primary: 0,
    created_at: '2026-09-10T08:00:00Z',
    updated_at: '2026-09-10T08:00:00Z',
    synced_at: null,
  },
  {
    id: 'v-bullet-3',
    name: 'Royal Enfield Classic 350',
    category: '2-wheeler',
    license_plate: 'KA-03-HL-3500',
    fuel_type: 'petrol',
    fuel_unit: 'liters',
    distance_unit: 'km',
    currency_symbol: '₹',
    is_primary: 0,
    created_at: '2026-09-15T08:00:00Z',
    updated_at: '2026-09-15T08:00:00Z',
    synced_at: null,
  },
];

export const INITIAL_VEHICLE: Vehicle = INITIAL_VEHICLES[0];

export const INITIAL_ENTRIES: FuelEntry[] = [
  {
    id: 'f-1',
    vehicle_id: 'v-nexon-1',
    date: '2026-10-24',
    odometer: 42851,
    fuel_amount: 37.56,
    price_per_unit: 102.50,
    total_cost: 3850.00,
    is_full_tank: 1,
    gas_station: 'IndianOil Express',
    notes: 'Regular highway run',
    calculated_efficiency: 18.2,
    created_at: '2026-10-24T09:30:00Z',
    updated_at: '2026-10-24T09:30:00Z',
    synced_at: null,
  },
  {
    id: 'f-2',
    vehicle_id: 'v-nexon-1',
    date: '2026-10-12',
    odometer: 42420,
    fuel_amount: 34.20,
    price_per_unit: 102.34,
    total_cost: 3500.00,
    is_full_tank: 1,
    gas_station: 'BPCL SmartFleet',
    notes: 'City commute',
    calculated_efficiency: 18.5,
    created_at: '2026-10-12T18:15:00Z',
    updated_at: '2026-10-12T18:15:00Z',
    synced_at: null,
  },
  {
    id: 'f-3',
    vehicle_id: 'v-nexon-1',
    date: '2026-09-28',
    odometer: 41980,
    fuel_amount: 40.05,
    price_per_unit: 102.37,
    total_cost: 4100.00,
    is_full_tank: 1,
    gas_station: 'HPCL AutoCare',
    notes: 'Weekend road trip',
    calculated_efficiency: 17.9,
    created_at: '2026-09-28T14:45:00Z',
    updated_at: '2026-09-28T14:45:00Z',
    synced_at: null,
  },
  {
    id: 'f-4',
    vehicle_id: 'v-nexon-1',
    date: '2026-09-14',
    odometer: 41520,
    fuel_amount: 35.50,
    price_per_unit: 104.50,
    total_cost: 3709.75,
    is_full_tank: 1,
    gas_station: 'Shell India',
    notes: 'V-Power petrol fill',
    calculated_efficiency: 18.0,
    created_at: '2026-09-14T11:20:00Z',
    updated_at: '2026-09-14T11:20:00Z',
    synced_at: null,
  },
];

