import { OpenAI } from 'openai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { transactions, apiKey } = req.body;

    if (!transactions || !Array.isArray(transactions)) {
      console.error('Invalid transactions data:', transactions);
      return res.status(400).json({ error: 'Invalid or missing transactions data' });
    }

    if (!apiKey) {
      return res.status(400).json({ error: 'OpenAI API key is missing' });
    }

    const openai = new OpenAI({ 
      apiKey: apiKey,
      timeout: 60000
    });

    console.log('Sending request to OpenAI for visualization data');
    const response = await openai.chat.completions.create({
      model: "gpt-4-1106-preview",
      messages: [
        {
          role: "system",
          content: "You are a data visualization expert. Given a set of financial transactions, generate JSON data for creating charts and graphs. Focus on key financial metrics and trends. The output should be a valid JSON object with a 'charts' array containing chart configurations compatible with ApexCharts."
        },
        {
          role: "user",
          content: `Generate visualization data for these transactions:\n\n${JSON.stringify(transactions)}`
        }
      ],
      max_tokens: 1500,
    });

    const content = response.choices[0].message.content;
    console.log('Received response from OpenAI:', content);

    let visualizationData;
    try {
      visualizationData = JSON.parse(content);
    } catch (error) {
      console.error('Error parsing OpenAI response:', error);
      return res.status(500).json({ error: 'Failed to parse visualization data' });
    }

    if (!visualizationData || !visualizationData.charts) {
      console.error('Invalid visualization data structure:', visualizationData);
      return res.status(500).json({ error: 'Invalid visualization data structure' });
    }

    res.status(200).json({ visualizationData });
  } catch (error) {
    console.error('Error generating visualizations:', error);
    res.status(500).json({ error: `Error generating visualizations: ${error.message}` });
  }
}