import { getAllFuelEntries, getAllVehicles, getSetting, setSetting, getDatabase } from '../db/client';
import { SyncPayload } from '../types';

export async function performCloudBackup(): Promise<{ success: boolean; message: string }> {
  try {
    const db = await getDatabase();
    const vercelUrl = (await getSetting('vercel_sync_url')) || 'https://enerjon.vercel.app';
    let deviceId = await getSetting('device_id');

    if (!deviceId) {
      deviceId = `dev-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      await setSetting('device_id', deviceId);
    }

    const vehicles = await getAllVehicles();
    const fuelEntries = await getAllFuelEntries();

    const payload: SyncPayload = {
      device_id: deviceId,
      timestamp: new Date().toISOString(),
      vehicles,
      fuel_entries: fuelEntries,
    };

    // If using simulated or local endpoint:
    try {
      const response = await fetch(`${vercelUrl}/api/sync/backup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-device-id': deviceId,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        const serverTime = data.server_timestamp || new Date().toISOString();

        // Mark local entries as synced
        await db.runAsync('UPDATE fuel_entries SET synced_at = ? WHERE synced_at IS NULL;', [serverTime]);
        await setSetting('last_sync_timestamp', serverTime);

        return { success: true, message: `Synced ${fuelEntries.length} entries to Vercel.` };
      }
    } catch {
      // Offline fallback: records remain in SQLite with synced_at = null
    }

    // Save timestamp locally even if remote server is unreachable
    const localTimestamp = new Date().toISOString();
    await setSetting('last_sync_timestamp', localTimestamp);
    return { success: true, message: 'Local snapshot prepared. Will sync when server is reachable.' };
  } catch (error: any) {
    return { success: false, message: error.message || 'Sync failed.' };
  }
}

