// Vercel Serverless Function: GET /api/sync/restore?device_id=<id>

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed. Use GET.' });
  }

  const { device_id } = req.query || {};

  if (!device_id) {
    return res.status(400).json({ error: 'Missing device_id query parameter' });
  }

  // In production, queries Vercel Postgres:
  // const row = await sql`SELECT payload FROM backups WHERE device_id = ${device_id} LIMIT 1;`;

  return res.status(200).json({
    success: true,
    device_id,
    vehicles: [],
    fuel_entries: [],
    restored_at: new Date().toISOString(),
  });
}

