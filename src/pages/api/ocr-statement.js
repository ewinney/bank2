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

async function performOCR(text, openai) {
  try {
    const maxTokens = 4000;
    const encodedText = encode(text);
    const chunks = [];
    
    for (let i = 0; i < encodedText.length; i += maxTokens) {
      chunks.push(decode(encodedText.slice(i, i + maxTokens)));
    }

    console.log(`Total chunks: ${chunks.length}`);

    let ocrResult = '';

    for (let i = 0; i < chunks.length; i++) {
      console.log(`Processing chunk ${i + 1} of ${chunks.length}`);
      const response = await openai.chat.completions.create({
        model: "gpt-4-1106-preview",
        messages: [
          {
            role: "system",
            content: "You are an OCR system. Extract all readable text from the given bank statement chunk, focusing on transaction details, dates, amounts, and other relevant financial information. Ignore any non-text elements or formatting instructions."
          },
          {
            role: "user",
            content: `Extract readable text from this bank statement chunk:\n\n${chunks[i]}`
          }
        ],
        max_tokens: 1500,
      });

      ocrResult += response.choices[0].message.content + '\n';

      if (i < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return ocrResult.trim();
  } catch (error) {
    console.error('Error in OCR:', error);
    throw new Error(`Failed to perform OCR: ${error.message}`);
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
      timeout: 60000
    });

    console.log("Extracting text from PDF");
    const extractedText = await extractTextFromPDF(file.filepath);
    console.log(`Extracted text length: ${extractedText.length} characters`);

    console.log("Performing OCR");
    const ocrResult = await performOCR(extractedText, openai);

    res.status(200).json({ ocrResult });
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