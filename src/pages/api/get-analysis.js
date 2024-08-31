import fs from 'fs/promises';
import path from 'path';

const ANALYSES_DIR = path.join(process.cwd(), 'data', 'analyses');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { fileName } = req.query;

  if (!fileName) {
    return res.status(400).json({ error: 'Missing fileName parameter' });
  }

  try {
    const filePath = path.join(ANALYSES_DIR, fileName);
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const analysisData = JSON.parse(fileContent);

    // Extract bank name and statement date from the file name
    const [bankName, statementDate] = fileName.replace('.json', '').split('_');

    res.status(200).json({
      ...analysisData,
      bankName,
      statementDate: statementDate.replace(/-/g, '/'),
    });
  } catch (error) {
    console.error('Error fetching analysis:', error);
    res.status(500).json({ error: 'Failed to fetch analysis' });
  }
}