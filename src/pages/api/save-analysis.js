import fs from 'fs/promises';
import path from 'path';

const ANALYSES_DIR = path.join(process.cwd(), 'data', 'analyses');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { bankName, statementDate, analysis } = req.body;

    if (!bankName || !statementDate || !analysis) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    await fs.mkdir(ANALYSES_DIR, { recursive: true });

    const fileName = `${bankName}_${statementDate.replace(/\//g, '-')}.json`;
    const filePath = path.join(ANALYSES_DIR, fileName);

    const dataToSave = {
      ...analysis,
      visualizationData: analysis.visualizationData || {}
    };

    await fs.writeFile(filePath, JSON.stringify(dataToSave, null, 2));

    res.status(200).json({ message: 'Analysis saved successfully', fileName });
  } catch (error) {
    console.error('Error saving analysis:', error);
    res.status(500).json({ error: 'Failed to save analysis' });
  }
}