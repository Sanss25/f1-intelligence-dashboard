/**
 * PitWall — AI Race Engineer API Proxy (Groq Edition)
 * Vercel Serverless Function
 *
 * Uses Groq's free API with Llama 3 — ultra-fast responses.
 * Frontend calls /api/engineer (no change needed in index.html).
 *
 * Setup:
 *   1. Get free API key at console.groq.com
 *   2. Add GROQ_API_KEY to Vercel environment variables
 *   3. Deploy: vercel --prod
 */

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GROQ_API_KEY not configured on server.' });
  }

  try {
    const { messages, system, max_tokens = 200 } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid request: messages array required' });
    }

    // Groq uses OpenAI-compatible API format
    // Inject system prompt as first message with role "system"
    const groqMessages = [
      { role: 'system', content: system || 'You are an expert F1 race engineer.' },
      ...messages,
    ];

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',  // best free Groq model
        max_tokens,
        temperature: 0.7,
        messages: groqMessages,
      }),
    });

    if (!groqRes.ok) {
      const err = await groqRes.text();
      console.error('Groq API error:', err);
      return res.status(groqRes.status).json({ error: 'Upstream API error', detail: err });
    }

    const groqData = await groqRes.json();

    // Convert Groq's OpenAI-format response → Anthropic-format
    // so the frontend works with zero changes
    const replyText = groqData.choices?.[0]?.message?.content || 'No response from engineer.';

    return res.status(200).json({
      content: [{ type: 'text', text: replyText }],
    });

  } catch (err) {
    console.error('Proxy error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
