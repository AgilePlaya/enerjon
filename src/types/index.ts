export type FuelType = 'petrol' | 'diesel' | 'cng' | 'hybrid' | 'electric';
export type FuelUnit = 'liters' | 'gal';
export type DistanceUnit = 'km' | 'mi';
export type CurrencySymbol = '₹' | '$' | '€' | '£';
export type VehicleCategory = '2-wheeler' | '4-wheeler';

export interface Vehicle {
  id: string;
  name: string;
  category: VehicleCategory;
  license_plate?: string | null;
  fuel_type: FuelType;
  fuel_unit: FuelUnit;
  distance_unit: DistanceUnit;
  currency_symbol: CurrencySymbol;
  is_primary: number; // 1 for primary, 0 otherwise
  created_at: string;
  updated_at: string;
  synced_at?: string | null;
}

export interface FuelEntry {
  id: string;
  vehicle_id: string;
  date: string; // ISO date YYYY-MM-DD
  odometer: number; // in km (or mi)
  fuel_amount: number; // in liters (or gal)
  price_per_unit: number; // in ₹/L (or $/gal)
  total_cost: number; // in ₹ (or $)
  is_full_tank: number; // 1 if full tank, 0 if partial
  gas_station: string;
  notes?: string | null;
  calculated_efficiency?: number | null; // km/L (or MPG)
  created_at: string;
  updated_at: string;
  synced_at?: string | null;
}

export interface AppSetting {
  key: string;
  value: string;
  updated_at: string;
}

export interface EfficiencySummary {
  currentYield: number; // e.g. 18.2 km/L
  yieldChangePercent: number; // e.g. +12%
  monthlySpend: number; // e.g. ₹12,450.00
  refuelCount: number; // e.g. 4
  avgPricePerUnit: number; // e.g. ₹102.50
  totalFuelVolume: number; // e.g. 121.5 L
  totalDistanceRun: number; // e.g. 2,400 km
  ecoScore: number; // e.g. 82/100
  potentialSavingsPercent: number; // e.g. 12%
}

export interface StationPriceComparison {
  station: string;
  avgPrice: number;
  color: string;
}

export interface MonthlySpendData {
  month: string; // "MAY", "JUN", etc.
  amount: number;
  isCurrent: boolean;
}

export interface SyncPayload {
  device_id: string;
  timestamp: string;
  vehicles: Vehicle[];
  fuel_entries: FuelEntry[];
}

