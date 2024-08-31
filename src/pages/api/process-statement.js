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

async function processStatement(text, openai) {
  try {
    const maxTokens = 4000;
    const encodedText = encode(text);
    const chunks = [];
    
    for (let i = 0; i < encodedText.length; i += maxTokens) {
      chunks.push(decode(encodedText.slice(i, i + maxTokens)));
    }

    console.log(`Total chunks: ${chunks.length}`);

    let extractedData = '';
    let analysis = '';

    // Extract data
    for (let i = 0; i < chunks.length; i++) {
      console.log(`Processing chunk ${i + 1} of ${chunks.length}`);
      const response = await openai.chat.completions.create({
        model: "gpt-4-1106-preview",
        messages: [
          {
            role: "system",
            content: "You are a financial data extractor. Extract all relevant financial information from the given bank statement chunk, including transaction details, dates, amounts, and any other important data. Format the output as a structured text, preserving the original layout where possible."
          },
          {
            role: "user",
            content: `Extract financial data from this bank statement chunk:\n\n${chunks[i]}`
          }
        ],
        max_tokens: 1500,
      });

      extractedData += response.choices[0].message.content + '\n';

      if (i < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Analyze extracted data
    const analysisResponse = await openai.chat.completions.create({
      model: "gpt-4-1106-preview",
      messages: [
        {
          role: "system",
          content: "You are a financial analyst. Analyze the given financial data and provide a comprehensive summary including total income, expenses, largest transaction, average transaction size, number of transactions, net profit, and a brief assessment of the financial health."
        },
        {
          role: "user",
          content: `Analyze this financial data:\n\n${extractedData}`
        }
      ],
      max_tokens: 1500,
    });

    analysis = analysisResponse.choices[0].message.content;

    return { extractedData: extractedData.trim(), analysis: analysis.trim() };
  } catch (error) {
    console.error('Error in processing:', error);
    throw new Error(`Failed to process the statement: ${error.message}`);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let file;
  try {
    const form = new IncomingForm();

    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve([fields, files]);
      });
    });

    file = files.file?.[0];
    const apiKey = fields.apiKey?.[0];

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!apiKey) {
      return res.status(400).json({ error: 'OpenAI API key is missing' });
    }

    const openai = new OpenAI({ 
      apiKey: apiKey,
      timeout: 60000
    });

    console.log("Extracting text from PDF");
    const extractedText = await extractTextFromPDF(file.filepath);
    console.log(`Extracted text length: ${extractedText.length} characters`);

    console.log("Processing statement");
    const result = await processStatement(extractedText, openai);

    // Clean up the file
    await fs.unlink(file.filepath);

    res.status(200).json(result);
  } catch (error) {
    console.error('Error processing file:', error);
    res.status(500).json({ error: `Error processing file: ${error.message}` });
  }
}