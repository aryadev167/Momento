export default async function handler(req, res) {
  // 1. Phone APK se aane wali request ko allow karne ke liye CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Browser/APK preflight check handle karna
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST requests allowed' });
  }

  try {
    const { leftBase64, rightBase64 } = req.body;

    // 2. Vercel ke hidden Environment Variable se API key uthana
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is missing in Vercel settings' });
    }

    // 3. Google Gemini Vision API ko dono haathon ki photo bhejna
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                text: "You are an expert in traditional Hindu Palmistry. Analyze Image 1 (Left Hand) and Image 2 (Right Hand). Measure the Jeevan Rekha (Life Line) curve, the arc of Shukra Parvat (Venus Mount), and check for a Mangal Rekha (Sister Line). Return a raw JSON with estimated_lifespan (between 65 and 92) and a short reading_summary."
              },
              { inline_data: { mime_type: "image/jpeg", data: leftBase64 } },
              { inline_data: { mime_type: "image/jpeg", data: rightBase64 } }
            ]
          }],
          generationConfig: {
            responseMimeType: "application/json"
          }
        })
      }
    );

    const data = await response.json();
    return res.status(200).json(data);

  } catch (error) {
    return res.status(500).json({ error: 'Failed to analyze palms', details: error.message });
  }
}