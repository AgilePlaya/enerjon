import * as SQLite from 'expo-sqlite';
import { CREATE_TABLES_SQL, INITIAL_VEHICLE, INITIAL_VEHICLES, INITIAL_ENTRIES } from './schema';
import { Vehicle, FuelEntry, AppSetting, FuelType, FuelUnit, DistanceUnit, CurrencySymbol, VehicleCategory } from '../types';
import { calculateEntryEfficiency } from '../services/calculations';

const DB_NAME = 'enerjon.db';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) {
    return dbInstance;
  }
  dbInstance = await SQLite.openDatabaseAsync(DB_NAME);
  await initializeDatabase(dbInstance);
  return dbInstance;
}

export async function initializeDatabase(db: SQLite.SQLiteDatabase): Promise<void> {
  // Execute table creation DDL
  await db.execAsync(CREATE_TABLES_SQL);

  // Auto-migration: ensure category column exists in vehicles
  try {
    await db.execAsync(`ALTER TABLE vehicles ADD COLUMN category TEXT NOT NULL DEFAULT '4-wheeler';`);
  } catch (e) {
    // Column already exists
  }

  // Check if initial vehicle exists
  const vehicleCountResult = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM vehicles;'
  );

  if (!vehicleCountResult || vehicleCountResult.count === 0) {
    // Seed initial vehicles
    for (const v of INITIAL_VEHICLES) {
      await db.runAsync(
        `INSERT INTO vehicles (id, name, category, license_plate, fuel_type, fuel_unit, distance_unit, currency_symbol, is_primary, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          v.id,
          v.name,
          v.category || '4-wheeler',
          v.license_plate ?? null,
          v.fuel_type,
          v.fuel_unit,
          v.distance_unit,
          v.currency_symbol,
          v.is_primary,
          v.created_at,
          v.updated_at,
        ]
      );
    }

    // Seed initial fuel entries
    for (const entry of INITIAL_ENTRIES) {
      await db.runAsync(
        `INSERT INTO fuel_entries (id, vehicle_id, date, odometer, fuel_amount, price_per_unit, total_cost, is_full_tank, gas_station, notes, calculated_efficiency, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          entry.id,
          entry.vehicle_id,
          entry.date,
          entry.odometer,
          entry.fuel_amount,
          entry.price_per_unit,
          entry.total_cost,
          entry.is_full_tank,
          entry.gas_station,
          entry.notes ?? null,
          entry.calculated_efficiency ?? null,
          entry.created_at,
          entry.updated_at,
        ]
      );
    }
  }
}

// ------------------- VEHICLE QUERIES -------------------

export async function getPrimaryVehicle(): Promise<Vehicle | null> {
  const db = await getDatabase();
  const vehicle = await db.getFirstAsync<Vehicle>(
    'SELECT * FROM vehicles WHERE is_primary = 1 LIMIT 1;'
  );
  return vehicle ?? null;
}

export async function getAllVehicles(): Promise<Vehicle[]> {
  const db = await getDatabase();
  return await db.getAllAsync<Vehicle>('SELECT * FROM vehicles ORDER BY is_primary DESC, created_at ASC;');
}

export async function setActiveVehicle(vehicleId: string): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.runAsync('UPDATE vehicles SET is_primary = 0;');
  await db.runAsync('UPDATE vehicles SET is_primary = 1, updated_at = ? WHERE id = ?;', [now, vehicleId]);
}

export async function createVehicle(params: {
  name: string;
  category?: VehicleCategory;
  license_plate?: string;
  fuel_type?: FuelType;
  fuel_unit?: FuelUnit;
  distance_unit?: DistanceUnit;
  currency_symbol?: CurrencySymbol;
}): Promise<Vehicle> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const id = `v-${Date.now()}`;
  const newVehicle: Vehicle = {
    id,
    name: params.name.trim(),
    category: params.category || '4-wheeler',
    license_plate: params.license_plate?.trim() || null,
    fuel_type: params.fuel_type || 'petrol',
    fuel_unit: params.fuel_unit || 'liters',
    distance_unit: params.distance_unit || 'km',
    currency_symbol: params.currency_symbol || '₹',
    is_primary: 1, // Make the newly added vehicle primary
    created_at: now,
    updated_at: now,
    synced_at: null,
  };

  // Set previous vehicles to non-primary
  await db.runAsync('UPDATE vehicles SET is_primary = 0;');

  await db.runAsync(
    `INSERT INTO vehicles (id, name, category, license_plate, fuel_type, fuel_unit, distance_unit, currency_symbol, is_primary, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      newVehicle.id,
      newVehicle.name,
      newVehicle.category,
      newVehicle.license_plate ?? null,
      newVehicle.fuel_type,
      newVehicle.fuel_unit,
      newVehicle.distance_unit,
      newVehicle.currency_symbol,
      newVehicle.is_primary,
      newVehicle.created_at,
      newVehicle.updated_at,
    ]
  );

  return newVehicle;
}

export async function updateVehicle(params: {
  id: string;
  name: string;
  category?: VehicleCategory;
  license_plate?: string;
  fuel_type: FuelType;
}): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.runAsync(
    `UPDATE vehicles SET name = ?, category = COALESCE(?, category), license_plate = ?, fuel_type = ?, updated_at = ? WHERE id = ?;`,
    [params.name.trim(), params.category ?? null, params.license_plate?.trim() || null, params.fuel_type, now, params.id]
  );
}

export async function deleteVehicle(vehicleId: string): Promise<boolean> {
  const db = await getDatabase();
  const vehicles = await getAllVehicles();
  if (vehicles.length <= 1) {
    return false; // Cannot delete the only vehicle
  }

  // Delete vehicle (cascades to its fuel entries)
  await db.runAsync('DELETE FROM vehicles WHERE id = ?;', [vehicleId]);

  // If deleted vehicle was primary, make the first remaining vehicle primary
  const remaining = await getAllVehicles();
  const hasPrimary = remaining.some((v) => v.is_primary === 1);
  if (!hasPrimary && remaining.length > 0) {
    await setActiveVehicle(remaining[0].id);
  }

  return true;
}

// ------------------- FUEL ENTRY QUERIES -------------------

export async function getFuelEntriesForVehicle(vehicleId?: string): Promise<FuelEntry[]> {
  const db = await getDatabase();
  if (vehicleId) {
    return await db.getAllAsync<FuelEntry>(
      'SELECT * FROM fuel_entries WHERE vehicle_id = ? ORDER BY date DESC, odometer DESC;',
      [vehicleId]
    );
  }
  return await getAllFuelEntries();
}

export async function getAllFuelEntries(): Promise<FuelEntry[]> {
  const db = await getDatabase();
  return await db.getAllAsync<FuelEntry>(
    'SELECT * FROM fuel_entries ORDER BY date DESC, odometer DESC;'
  );
}

export async function getRecentFuelEntries(limit: number = 5): Promise<FuelEntry[]> {
  const db = await getDatabase();
  return await db.getAllAsync<FuelEntry>(
    'SELECT * FROM fuel_entries ORDER BY date DESC, odometer DESC LIMIT ?;',
    [limit]
  );
}

export async function addFuelEntry(params: {
  vehicle_id: string;
  date: string;
  odometer: number;
  fuel_amount: number;
  price_per_unit: number;
  total_cost: number;
  is_full_tank: number;
  gas_station: string;
  notes?: string;
}): Promise<FuelEntry> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const id = `f-${Date.now()}`;

  // Fetch previous entries to compute efficiency
  const previousEntries = await getAllFuelEntries();
  const calculatedEfficiency = calculateEntryEfficiency(
    {
      odometer: params.odometer,
      fuel_amount: params.fuel_amount,
      is_full_tank: params.is_full_tank,
    },
    previousEntries
  );

  await db.runAsync(
    `INSERT INTO fuel_entries (id, vehicle_id, date, odometer, fuel_amount, price_per_unit, total_cost, is_full_tank, gas_station, notes, calculated_efficiency, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      id,
      params.vehicle_id,
      params.date,
      params.odometer,
      params.fuel_amount,
      params.price_per_unit,
      params.total_cost,
      params.is_full_tank,
      params.gas_station,
      params.notes ?? null,
      calculatedEfficiency,
      now,
      now,
    ]
  );

  return {
    id,
    vehicle_id: params.vehicle_id,
    date: params.date,
    odometer: params.odometer,
    fuel_amount: params.fuel_amount,
    price_per_unit: params.price_per_unit,
    total_cost: params.total_cost,
    is_full_tank: params.is_full_tank,
    gas_station: params.gas_station,
    notes: params.notes ?? null,
    calculated_efficiency: calculatedEfficiency,
    created_at: now,
    updated_at: now,
    synced_at: null,
  };
}

export async function deleteFuelEntry(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM fuel_entries WHERE id = ?;', [id]);
}

// ------------------- SETTINGS & SYNC QUERIES -------------------

export async function getSetting(key: string): Promise<string | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<AppSetting>(
    'SELECT * FROM app_settings WHERE key = ? LIMIT 1;',
    [key]
  );
  return row ? row.value : null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO app_settings (key, value, updated_at)
     VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at;`,
    [key, value, now]
  );
}

export async function getUnsyncedCounts(): Promise<{ unsyncedEntries: number }> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM fuel_entries WHERE synced_at IS NULL;'
  );
  return { unsyncedEntries: result?.count ?? 0 };
}

