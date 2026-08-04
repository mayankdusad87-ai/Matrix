import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  const uri = process.env.MONGODB_URI || '';
  res.json({
    hasUri: !!uri,
    length: uri.length,
    startsWithMongo: uri.startsWith('mongodb'),
    first20: uri.substring(0, 20),
    charCodes: Array.from(uri.substring(0, 5)).map(c => c.charCodeAt(0)),
  });
}
