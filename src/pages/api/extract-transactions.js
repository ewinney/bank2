import { OpenAI } from 'openai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id, statementData } = req.body;

  if (!id || !statementData) {
    return res.status(400).json({ error: 'Missing required data' });
  }

  try {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) {
      return res.status(400).json({ error: 'OpenAI API key is missing' });
    }

    const openai = new OpenAI({ apiKey });

    const prompt = `Extract the high-level details and transactions from the following bank statement. Focus on dates, descriptions, and amounts. Format the output as a clear, readable list:

${statementData}

Provide the extracted data in a clear, structured format.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1000,
    });

    const extractedData = response.choices[0].message.content;

    res.status(200).json({ extractedData });
  } catch (error) {
    console.error('Error extracting transactions:', error);
    res.status(500).json({ error: `Failed to extract transactions: ${error.message}` });
  }
}