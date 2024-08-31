import fs from 'fs/promises';
import path from 'path';

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const filePath = path.join(process.cwd(), 'uploads', `${id}.pdf`);
    const fileContent = await fs.readFile(filePath, 'utf-8');
    res.status(200).json({ fileContent });
  } catch (error) {
    console.error('Error reading file:', error);
    res.status(500).json({ error: `Error reading file: ${error.message}` });
  }
}