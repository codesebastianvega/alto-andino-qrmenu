export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const token = req.headers.authorization?.replace(/^Bearer\s+/i, '') || req.body?.token || req.query?.token;
    if (!token) {
      return res.status(400).json({ error: 'Token de Microsoft Clarity no proporcionado' });
    }

    const numOfDays = req.query?.numOfDays || req.body?.numOfDays || '1';
    const dimension1 = req.query?.dimension1 || req.body?.dimension1 || 'Country/Region';
    const dimension2 = req.query?.dimension2 || req.body?.dimension2 || 'Device';

    const url = new URL('https://www.clarity.ms/export-data/api/v1/project-live-insights');
    url.searchParams.set('numOfDays', String(numOfDays));
    url.searchParams.set('dimension1', dimension1);
    url.searchParams.set('dimension2', dimension2);

    const clarityRes = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!clarityRes.ok) {
      const errorText = await clarityRes.text().catch(() => '');
      return res.status(clarityRes.status).json({
        error: `Error de Microsoft Clarity (${clarityRes.status})`,
        details: errorText || 'Verifica que el API Token sea válido en Settings > Data Export de Clarity.'
      });
    }

    const data = await clarityRes.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('[Clarity Insights API Error]:', error);
    return res.status(500).json({ error: 'Error interno conectando con Microsoft Clarity', message: error.message });
  }
}
