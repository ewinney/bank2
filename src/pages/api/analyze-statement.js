import { IncomingForm } from 'formidable';
import fs from 'fs/promises';
import { OpenAI } from 'openai';
import pdf from 'pdf-parse';

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
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a financial analyst specializing in analyzing bank statements. Provide a concise summary and key details of the financial situation based on the given bank statement. Always start your response with 'Summary:' followed by a brief overview."
        },
        {
          role: "user",
          content: `Analyze this bank statement and provide a summary of the financial situation, including total income, expenses, largest transaction, average daily balance, number of transactions, and net profit. Also, provide a brief assessment of the business's financial health. Here's the statement:\n\n${text}`
        }
      ],
      max_tokens: 500,
    });

    console.log('OpenAI API Response:', JSON.stringify(response, null, 2));

    const analysisContent = response.choices[0].message.content;
    console.log('Analysis Content:', analysisContent);

    if (!analysisContent.toLowerCase().includes('summary:')) {
      throw new Error('OpenAI response does not contain a summary');
    }

    return analysisContent;
  } catch (error) {
    console.error('Error in AI analysis:', error);
    throw new Error(`Failed to analyze the statement with AI: ${error.message}`);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const form = new IncomingForm();

  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(500).json({ error: 'Error parsing form data' });
    }

    const file = files.file?.[0];
    const apiKey = fields.apiKey?.[0];

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!apiKey) {
      return res.status(400).json({ error: 'OpenAI API key is missing' });
    }

    try {
      const openai = new OpenAI({ apiKey: apiKey });

      // Extract text from PDF
      const extractedText = await extractTextFromPDF(file.filepath);

      // Analyze the extracted text with OpenAI
      const analysis = await analyzeStatementWithAI(extractedText, openai);

      // Parse the analysis to extract structured data
      const parsedAnalysis = parseAnalysis(analysis);

      // Ensure the response contains a summary
      if (!parsedAnalysis.summary) {
        throw new Error('Analysis result does not contain a summary');
      }

      res.status(200).json(parsedAnalysis);
    } catch (error) {
      console.error('Error processing file:', error);
      res.status(500).json({ error: `Error processing file: ${error.message}` });
    } finally {
      // Clean up the temporary file
      await fs.unlink(file.filepath);
    }
  });
}

function parseAnalysis(analysis) {
  console.log('Parsing analysis:', analysis);
  const lines = analysis.split('\n');
  const result = {
    summary: '',
    details: []
  };

  let summaryStarted = false;
  for (const line of lines) {
    if (line.toLowerCase().includes('summary:')) {
      summaryStarted = true;
      result.summary = line.replace(/^summary:\s*/i, '').trim();
    } else if (summaryStarted && line.trim() !== '') {
      result.summary += ' ' + line.trim();
    } else if (line.includes(':')) {
      result.details.push(line.trim());
    }
  }

  console.log('Parsed result:', JSON.stringify(result, null, 2));

  if (!result.summary) {
    throw new Error('Failed to extract summary from analysis');
  }

  return result;
}