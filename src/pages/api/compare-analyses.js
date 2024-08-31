import fs from 'fs/promises';
import path from 'path';
import { OpenAI } from 'openai';

const ANALYSES_DIR = path.join(process.cwd(), 'data', 'analyses');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { fileNames, apiKey } = req.body;

    if (!fileNames || !Array.isArray(fileNames) || fileNames.length < 2) {
      return res.status(400).json({ error: 'At least two file names are required for comparison' });
    }

    if (!apiKey) {
      return res.status(400).json({ error: 'OpenAI API key is missing' });
    }

    const analysesData = await Promise.all(fileNames.map(async (fileName) => {
      const filePath = path.join(ANALYSES_DIR, fileName);
      const fileContent = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(fileContent);
    }));

    const openai = new OpenAI({ apiKey, timeout: 60000 });

    const comparisonResponse = await openai.chat.completions.create({
      model: "gpt-4-1106-preview",
      messages: [
        {
          role: "system",
          content: "You are a financial analyst tasked with comparing multiple financial analyses. Provide a comprehensive comparison highlighting key differences, trends, and insights across the analyses."
        },
        {
          role: "user",
          content: `Compare the following financial analyses:\n\n${JSON.stringify(analysesData, null, 2)}`
        }
      ],
      max_tokens: 4000,
      temperature: 0.2,
    });

    const comparison = comparisonResponse.choices[0].message.content;

    res.status(200).json({ comparison });
  } catch (error) {
    console.error('Error comparing analyses:', error);
    res.status(500).json({ error: 'Failed to compare analyses' });
  }
}