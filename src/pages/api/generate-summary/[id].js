import { OpenAI } from 'openai';

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { extractedData } = req.body;

  if (!extractedData) {
    return res.status(400).json({ error: 'Missing required data' });
  }

  try {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) {
      return res.status(400).json({ error: 'OpenAI API key is missing' });
    }

    const summary = await generateSummaryWithAI(extractedData, apiKey);
    res.status(200).json(summary);
  } catch (error) {
    console.error('Error generating summary:', error);
    res.status(500).json({ error: `Error generating summary: ${error.message}` });
  }
}

async function generateSummaryWithAI(extractedData, apiKey) {
  const openai = new OpenAI({ apiKey });

  const prompt = `Analyze the following bank statement data and provide a summary including total income, total expenses, net profit, largest transaction, and a brief overview of the financial health:

${extractedData}

Provide the response in the following JSON format:
{
  "overview": "Brief overview of financial health",
  "totalIncome": 0,
  "totalExpenses": 0,
  "netProfit": 0,
  "largestTransaction": 0,
  "chartData": {
    "labels": ["Income", "Expenses"],
    "values": [0, 0]
  }
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 500,
  });

  return JSON.parse(response.choices[0].message.content);
}