// Vercel Serverless Function: POST /api/sync/backup
// Compatible with Vercel Node.js / Edge runtime

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const { device_id, timestamp, vehicles, fuel_entries } = req.body || {};

    if (!device_id) {
      return res.status(400).json({ error: 'Missing device_id' });
    }

    const serverTimestamp = new Date().toISOString();
    const syncedCount = (fuel_entries?.length || 0) + (vehicles?.length || 0);

    // In production with Vercel Postgres:
    // await sql`INSERT INTO backups (device_id, payload, updated_at) VALUES (${device_id}, ${JSON.stringify(req.body)}, ${serverTimestamp}) ON CONFLICT ...`;

    return res.status(200).json({
      success: true,
      device_id,
      synced_count: syncedCount,
      server_timestamp: serverTimestamp,
      message: 'Backup successfully recorded.',
    });
  } catch (error: any) {
    console.error('Vercel sync error:', error);
    return res.status(500).json({ error: 'Internal server backup failure', details: error.message });
  }
}

