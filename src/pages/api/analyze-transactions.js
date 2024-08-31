import { OpenAI } from 'openai';
import { encode } from 'gpt-3-encoder';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { transactions, apiKey } = req.body;

    if (!transactions) {
      return res.status(400).json({ error: 'No transactions provided' });
    }

    if (!apiKey) {
      return res.status(400).json({ error: 'OpenAI API key is missing' });
    }

    const openai = new OpenAI({ 
      apiKey: apiKey,
      timeout: 60000 // 60 seconds timeout
    });

    const encodedTransactions = encode(transactions);
    const maxTokens = 4000; // Increased token limit for GPT-4-turbo
    const chunks = [];

    for (let i = 0; i < encodedTransactions.length; i += maxTokens) {
      chunks.push(encodedTransactions.slice(i, i + maxTokens));
    }

    let analysis = '';

    for (let i = 0; i < chunks.length; i++) {
      const response = await openai.chat.completions.create({
        model: "gpt-4-1106-preview", // Using GPT-4-turbo
        messages: [
          {
            role: "system",
            content: "You are a financial analyst. Analyze the given transactions and provide a summary including total income, expenses, largest transaction, average transaction size, number of transactions, and net profit. Also, provide a brief assessment of the financial health based on these transactions."
          },
          {
            role: "user",
            content: `Analyze these transactions (part ${i + 1} of ${chunks.length}):\n\n${transactions.substring(i * maxTokens, (i + 1) * maxTokens)}`
          }
        ],
        max_tokens: 1500, // Increased max tokens
      });

      analysis += response.choices[0].message.content + '\n\n';

      if (i < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
      }
    }

    res.status(200).json({ analysis });
  } catch (error) {
    console.error('Error analyzing transactions:', error);
    res.status(500).json({ error: `Error analyzing transactions: ${error.message}` });
  }
}