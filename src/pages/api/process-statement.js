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

async function processStatement(labeledTexts, openai, res, startDate, endDate) {
  try {
    let allExtractedData = '';
    let allTransactions = {};

    for (const [month, text] of Object.entries(labeledTexts)) {
      console.log(`Processing statement for ${month}`);

      const maxTokens = 4000; // Reduced from 8000
      const encodedText = encode(text);
      const chunks = [];
      
      for (let i = 0; i < encodedText.length; i += maxTokens) {
        chunks.push(decode(encodedText.slice(i, i + maxTokens)));
      }

      let extractedData = '';

      for (let i = 0; i < chunks.length; i++) {
        console.log(`Processing chunk ${i + 1} of ${chunks.length} for ${month}`);
        const response = await openai.chat.completions.create({
          model: "gpt-4-1106-preview",
          messages: [
            {
              role: "system",
              content: "You are a financial data extractor. Extract all relevant financial information from the given bank statement chunk, including transaction details, dates, amounts, and any other important data. Format the output as a structured text, preserving the original layout where possible."
            },
            {
              role: "user",
              content: `Extract financial data from this bank statement chunk for ${month}:\n\n${chunks[i]}`
            }
          ],
          max_tokens: 2000, // Reduced from 3000
        });

        extractedData += response.choices[0].message.content + '\n';

        if (i < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      allExtractedData += `Statement for ${month}:\n${extractedData}\n\n`;

      // Extract transactions from the extracted data
      const transactionsResponse = await openai.chat.completions.create({
        model: "gpt-4-1106-preview",
        messages: [
          {
            role: "system",
            content: "You are a financial data extractor. Extract a list of transactions from the given financial data. Each transaction should include a date, description, and amount. Also calculate the total income and total expenses for this month. Format the output as a valid JSON object with 'transactions' array, 'totalIncome', and 'totalExpenses' fields. Do not include any markdown formatting or code blocks in your response."
          },
          {
            role: "user",
            content: `Extract transactions and calculate totals from this financial data for ${month}. Only include transactions between ${startDate} and ${endDate}:\n\n${extractedData}`
          }
        ],
        max_tokens: 2000, // Reduced from 4000
        temperature: 0.2,
      });

      try {
        const cleanedResponse = transactionsResponse.choices[0].message.content.replace(/```json\n?|\n?```/g, '').trim();
        const monthData = JSON.parse(cleanedResponse);
        allTransactions[month] = monthData;

        // Send partial results to the client
        res.write(`data: ${JSON.stringify({ month, data: monthData })}\n\n`);
      } catch (parseError) {
        console.error(`Error parsing transactions for ${month}:`, parseError);
        console.log('Raw response:', transactionsResponse.choices[0].message.content);
        allTransactions[month] = { transactions: [], totalIncome: 0, totalExpenses: 0 };
      }
    }

    // Analyze all extracted data
    const analysisResponse = await openai.chat.completions.create({
      model: "gpt-4-1106-preview",
      messages: [
        {
          role: "system",
          content: `You are an expert financial analyst with experience in underwriting. Analyze the given financial data from multiple months and provide a comprehensive, well-structured summary. Your analysis should be detailed, insightful, and presented in a clear, easy-to-read format. Use markdown formatting to enhance readability and structure.

Format your response as follows:

# Executive Summary

Provide a brief overview of the financial health and key findings.

# Detailed Analysis

## 1. Income Analysis

- Total income for the period: $X
- Breakdown of income sources:
  * Source 1: $X (X% of total)
  * Source 2: $X (X% of total)
- Income trends and patterns
- Largest income transactions

## 2. Expense Analysis

- Total expenses for the period: $X
- Categorization of expenses:
  * Category 1: $X (X% of total)
  * Category 2: $X (X% of total)
- Expense trends and patterns
- Largest expense transactions

## 3. Cash Flow Analysis

- Net cash flow for the period: $X
- Monthly cash flow trends
- Cash flow stability assessment

## 4. Transaction Analysis

- Total number of transactions: X
- Average transaction size: $X
- Transaction frequency patterns
- Unusual or noteworthy transactions

## 5. Financial Ratios

- Income-to-expense ratio: X
- Savings rate: X%
- Debt-to-income ratio (if applicable): X
- Liquidity ratio: X

## 6. Trend Analysis

- Identify and explain trends across months
- Seasonal patterns or cyclical behavior

## 7. Risk Assessment

- Identify potential financial risks
- Assess overall financial stability

# Underwriter's Analysis

- Overall financial health assessment
- Potential red flags or areas of concern
- Positive aspects of financial behavior
- Educated assumptions about the account holder's financial situation and habits
- Areas where more information might be needed
- Insights valuable for underwriting decisions

# Recommendations

- Suggestions for improving financial health
- Areas for potential cost-saving or income growth

Use bullet points, numbered lists, and other markdown formatting to enhance readability. Ensure there is adequate spacing between sections for easy scanning.`
        },
        {
          role: "user",
          content: `Analyze this financial data from multiple months, considering only transactions between ${startDate} and ${endDate}:\n\n${allExtractedData}`
        }
      ],
      max_tokens: 4000, // Reduced from 8000
      temperature: 0.2,
    });

    const analysis = analysisResponse.choices[0].message.content;

    return { extractedData: allExtractedData.trim(), analysis, transactions: allTransactions };
  } catch (error) {
    console.error('Error in processing:', error);
    throw new Error(`Failed to process the statements: ${error.message}`);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const files = [];
  try {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    const form = new IncomingForm({ multiples: true });

    const [fields, formFiles] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve([fields, files]);
      });
    });

    const apiKey = fields.apiKey?.[0];
    const startDate = fields.startDate?.[0];
    const endDate = fields.endDate?.[0];

    if (!formFiles) {
      res.write(`data: ${JSON.stringify({ error: 'No files uploaded' })}\n\n`);
      res.end();
      return;
    }

    if (!apiKey) {
      res.write(`data: ${JSON.stringify({ error: 'OpenAI API key is missing' })}\n\n`);
      res.end();
      return;
    }

    const openai = new OpenAI({ 
      apiKey: apiKey,
      timeout: 60000
    });

    const labeledTexts = {};
    for (const [month, fileArray] of Object.entries(formFiles)) {
      if (month !== 'apiKey' && month !== 'startDate' && month !== 'endDate') {
        const file = Array.isArray(fileArray) ? fileArray[0] : fileArray;
        const pdfText = await extractTextFromPDF(file.filepath);
        labeledTexts[month] = pdfText;
        files.push(file);
      }
    }

    console.log(`Processing statements for ${Object.keys(labeledTexts).length} months`);
    const result = await processStatement(labeledTexts, openai, res, startDate, endDate);

    res.write(`data: ${JSON.stringify({ final: result })}\n\n`);
    res.end();
  } catch (error) {
    console.error('Error processing files:', error);
    res.write(`data: ${JSON.stringify({ error: `Error processing files: ${error.message}` })}\n\n`);
    res.end();
  } finally {
    for (const file of files) {
      try {
        await fs.unlink(file.filepath);
      } catch (unlinkError) {
        console.error('Error deleting temporary file:', unlinkError);
      }
    }
  }
}