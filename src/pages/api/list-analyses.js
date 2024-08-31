import fs from 'fs/promises';
import path from 'path';

const ANALYSES_DIR = path.join(process.cwd(), 'data', 'analyses');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const files = await fs.readdir(ANALYSES_DIR);
    const analyses = files.map(file => {
      const [bankName, date] = file.replace('.json', '').split('_');
      return {
        fileName: file,
        bankName,
        statementDate: date.replace(/-/g, '/'),
      };
    });

    res.status(200).json({ analyses });
  } catch (error) {
    console.error('Error listing analyses:', error);
    res.status(500).json({ error: 'Failed to list analyses' });
  }
}