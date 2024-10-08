import { IncomingForm } from 'formidable';
import fs from 'fs/promises';
import { OpenAI } from 'openai';
import pdf from 'pdf-parse';
import { encode, decode } from 'gpt-3-encoder';

export const config = {
  api: {
    bodyParser: false,
  },
};

async function extractTextFromPDF(filePath) {
  const dataBuffer = await fs.readFile(filePath);
  const data = await pdf(dataBuffer);
  return data.text;
}

async function analyzeStatementWithAI(text, openai) {
  try {
    const maxTokens = 3000; // Further reduce token count per request
    const encodedText = encode(text);
    const chunks = [];
    
    for (let i = 0; i < encodedText.length; i += maxTokens) {
      chunks.push(decode(encodedText.slice(i, i + maxTokens)));
    }

    console.log(`Total chunks: ${chunks.length}`);

    let transactions = [];

    for (let i = 0; i < chunks.length; i++) {
      console.log(`Processing chunk ${i + 1} of ${chunks.length}`);
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a financial data extractor. Extract transaction details from the given text in a structured format: date, description, amount (positive for credits, negative for debits). Respond with a JSON array of transactions only."
          },
          {
            role: "user",
            content: `Extract transactions from this bank statement chunk:\n\n${chunks[i]}`
          }
        ],
        max_tokens: 1000,
      });

      const chunkTransactions = JSON.parse(response.choices[0].message.content);
      transactions = transactions.concat(chunkTransactions);

      if (i < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
      }
    }

    console.log(`Total transactions extracted: ${transactions.length}`);

    // Summarize transactions
    const summaryResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a financial analyst. Summarize the following transactions, providing key insights, total income, expenses, largest transaction, average transaction size, number of transactions, and net profit. Also, provide a brief assessment of the financial health based on these transactions."
        },
        {
          role: "user",
          content: `Summarize these transactions:\n\n${JSON.stringify(transactions)}`
        }
      ],
      max_tokens: 500,
    });

    const summary = summaryResponse.choices[0].message.content;
    console.log("Summary generated successfully");

    return { summary, transactions };
  } catch (error) {
    console.error('Error in AI analysis:', error);
    throw new Error(`Failed to analyze the statement with AI: ${error.message}`);
  }
}

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
    const apiKey = fields.apiKey?.[0];

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!apiKey) {
      return res.status(400).json({ error: 'OpenAI API key is missing' });
    }

    const openai = new OpenAI({ 
      apiKey: apiKey,
      timeout: 60000 // 60 seconds timeout
    });

    console.log("Extracting text from PDF");
    const extractedText = await extractTextFromPDF(file.filepath);
    console.log(`Extracted text length: ${extractedText.length} characters`);

    console.log("Analyzing statement with AI");
    const analysis = await analyzeStatementWithAI(extractedText, openai);

    res.status(200).json(analysis);
  } catch (error) {
    console.error('Error processing file:', error);
    res.status(500).json({ error: `Error processing file: ${error.message}` });
  } finally {
    if (file && file.filepath) {
      try {
        await fs.unlink(file.filepath);
      } catch (unlinkError) {
        console.error('Error deleting temporary file:', unlinkError);
      }
    }
  }
}