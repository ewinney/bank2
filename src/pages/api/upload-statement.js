import { IncomingForm } from 'formidable';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const form = new IncomingForm();

    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve([fields, files]);
      });
    });

    const file = files.file?.[0];

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const id = uuidv4();
    const uploadDir = path.join(process.cwd(), 'uploads');
    await fs.mkdir(uploadDir, { recursive: true });

    const newPath = path.join(uploadDir, `${id}.pdf`);
    await fs.copyFile(file.filepath, newPath);

    // Read the file content
    const fileContent = await fs.readFile(newPath, 'utf-8');

    res.status(200).json({ id, fileContent });
  } catch (error) {
    console.error('Error processing file:', error);
    res.status(500).json({ error: `Error processing file: ${error.message}` });
  }
}