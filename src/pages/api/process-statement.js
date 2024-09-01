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

      const maxTokens = 4000;
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
          max_tokens: 2000,
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
            content: "You are a financial data extractor. Extract a list of transactions from the given financial data. Each transaction should include a date, description, and amount. Also calculate the total income, total expenses, largest transaction, and average transaction size for this month. Format the output as a valid JSON object with 'transactions' array and 'summary' object containing the calculated values. Do not include any markdown formatting or code blocks in your response."
          },
          {
            role: "user",
            content: `Extract transactions and calculate summary data from this financial data for ${month}. Only include transactions between ${startDate} and ${endDate}:\n\n${extractedData}`
          }
        ],
        max_tokens: 2000,
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
        allTransactions[month] = { transactions: [], summary: { totalIncome: 0, totalExpenses: 0, largestTransaction: 0, averageTransactionSize: 0 } };
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

### Total Income
- Total income for the period: $X

### Income Breakdown
- Source 1: $X (X% of total)
- Source 2: $X (X% of total)

### Income Trends and Patterns

### Largest Income Transactions

## 2. Expense Analysis

### Total Expenses
- Total expenses for the period: $X

### Expense Categorization
- Category 1: $X (X% of total)
- Category 2: $X (X% of total)

### Expense Trends and Patterns

### Largest Expense Transactions

## 3. Cash Flow Analysis

### Net Cash Flow
- Net cash flow for the period: $X

### Monthly Cash Flow Trends

### Cash Flow Stability Assessment

## 4. Transaction Analysis

### Transaction Overview
- Total number of transactions: X
- Average transaction size: $X

### Transaction Patterns

### Unusual or Noteworthy Transactions

## 5. Financial Ratios

- Income-to-expense ratio: X
- Savings rate: X%
- Debt-to-income ratio (if applicable): X
- Liquidity ratio: X

## 6. Trend Analysis

### Monthly Trends

### Seasonal Patterns or Cyclical Behavior

## 7. Risk Assessment

### Potential Financial Risks

### Overall Financial Stability

# Underwriter's Analysis

## Overall Financial Health Assessment

## Potential Red Flags or Areas of Concern

## Positive Aspects of Financial Behavior

## Account Holder's Financial Situation and Habits

## Areas Needing More Information

## Insights for Underwriting Decisions

# Recommendations

## Financial Health Improvement Suggestions

## Cost-Saving and Income Growth Opportunities

Use bullet points, numbered lists, and other markdown formatting to enhance readability. Ensure there is adequate spacing between sections for easy scanning.`
        },
        {
          role: "user",
          content: `Analyze this financial data from multiple months, considering only transactions between ${startDate} and ${endDate}:\n\n${JSON.stringify(allTransactions, null, 2)}`
        }
      ],
      max_tokens: 4000,
      temperature: 0.2,
    });

    const analysis = analysisResponse.choices[0].message.content;

    // Generate visualization data
    console.log('Starting visualization data generation process...');
    let visualizationData;
    try {
        console.log('Input for generateVisualizationData:');
        console.log('Transaction periods:', Object.keys(allTransactions));
        console.log('Sample transaction data:', JSON.stringify(allTransactions[Object.keys(allTransactions)[0]], null, 2));

        visualizationData = await generateVisualizationData(allTransactions, openai);

        console.log('Visualization data generated successfully');
        console.log('Visualization data structure:', JSON.stringify(Object.keys(visualizationData), null, 2));
        console.log('Number of charts:', visualizationData.charts ? visualizationData.charts.length : 0);

        if (visualizationData.charts && visualizationData.charts.length > 0) {
            visualizationData.charts.forEach((chart, index) => {
                console.log(`Chart ${index + 1} details:`, JSON.stringify({
                    type: chart.type,
                    title: chart.title,
                    datasetCount: chart.data.datasets.length,
                    dataPointCount: chart.data.datasets[0].data.length,
                    labels: chart.data.labels,
                    datasetLabels: chart.data.datasets.map(ds => ds.label)
                }, null, 2));
                console.log(`Chart ${index + 1} input data:`, JSON.stringify(chart.inputData, null, 2));
                console.log(`Chart ${index + 1} configuration:`, JSON.stringify(chart.options, null, 2));
            });
        } else {
            console.warn('No charts found in visualization data');
        }
    } catch (vizError) {
        console.error('Error generating visualization data:', vizError);
        console.error('Error stack:', vizError.stack);
        console.error('Error occurred while processing:', JSON.stringify(allTransactions, null, 2));
        visualizationData = null;
    }

    // Create a dedicated section for formatted visualization data
    const formattedVisualizationData = visualizationData ? {
        charts: visualizationData.charts.map(chart => ({
            type: chart.type,
            title: chart.title,
            labels: chart.data.labels,
            datasets: chart.data.datasets.map(dataset => ({
                label: dataset.label,
                data: dataset.data,
                backgroundColor: dataset.backgroundColor,
                borderColor: dataset.borderColor
            }))
        }))
    } : null;

    const result = {
        extractedData: allExtractedData.trim(),
        analysis,
        transactions: allTransactions,
        visualizationData: formattedVisualizationData
    };

    console.log('Final result object structure:', JSON.stringify(Object.keys(result), null, 2));
    console.log('Visualization data in final result:', result.visualizationData ? 'Present' : 'Absent');

    if (result.visualizationData) {
        console.log('Final visualization data summary:', JSON.stringify({
            chartCount: result.visualizationData.charts.length,
            chartTypes: result.visualizationData.charts.map(chart => chart.type),
            totalDataPoints: result.visualizationData.charts.reduce((sum, chart) =>
                sum + chart.datasets.reduce((dataSum, dataset) => dataSum + dataset.data.length, 0), 0)
        }, null, 2));
        console.log('Detailed chart information:');
        result.visualizationData.charts.forEach((chart, index) => {
            console.log(`Chart ${index + 1}:`, JSON.stringify(chart, null, 2));
        });
    } else {
        console.warn('Visualization data is missing from the final result');
    }

    // Log the size of the visualization data
    console.log('Visualization data size:', JSON.stringify(formattedVisualizationData).length, 'bytes');

    return result;
  } catch (error) {
    console.error('Error in processing:', error);
    console.error('Error details:', JSON.stringify({
        name: error.name,
        message: error.message,
        stack: error.stack
    }, null, 2));
    throw new Error(`Failed to process the statements: ${error.message}`);
  }
}

async function generateVisualizationData(transactions, openai) {
  console.log('Entering generateVisualizationData function');
  console.log('Transactions received:', JSON.stringify(transactions, null, 2));
  console.log('Number of transaction periods:', Object.keys(transactions).length);

  if (!transactions || Object.keys(transactions).length === 0) {
    console.error('No transactions data provided');
    throw new Error('No transactions data provided for visualization');
  }

  try {
    console.log('Preparing API request to OpenAI');
    const apiRequest = {
      model: "gpt-4-1106-preview",
      messages: [
        {
          role: "system",
          content: "You are a data visualization expert. Given a set of financial transactions, generate JSON data for creating charts and graphs. Focus on key financial metrics and trends. The output should be a valid JSON object with a 'charts' array containing chart configurations compatible with Chart.js. Ensure that all numeric values are properly formatted as numbers, not strings. Include at least one bar chart and one line chart."
        },
        {
          role: "user",
          content: `Generate visualization data for these transactions. Ensure the output is a valid JSON object:\n\n${JSON.stringify(transactions)}`
        }
      ],
      max_tokens: 1500,
      temperature: 0.2, // Lower temperature for more consistent output
    };
    console.log('API request prepared:', JSON.stringify(apiRequest, null, 2));

    console.log('Sending request to OpenAI API');
    const response = await openai.chat.completions.create(apiRequest);
    console.log('Received response from OpenAI API');
    console.log('Response status:', response.status);
    console.log('Response headers:', JSON.stringify(response.headers, null, 2));
    console.log('Full API response:', JSON.stringify(response, null, 2));

    const content = response.choices[0].message.content;
    console.log('Raw API response content:', content);
    console.log('Raw API response content type:', typeof content);
    console.log('Raw API response content length:', content.length);
    console.log('First 100 characters of content:', content.substring(0, 100));
    console.log('Last 100 characters of content:', content.substring(content.length - 100));
    console.log('Content contains valid JSON opening/closing characters:', content.trim().startsWith('{') && content.trim().endsWith('}'));

    let parsedData;
    try {
      console.log('Attempting to parse API response content');
      parsedData = JSON.parse(content);
      console.log('Successfully parsed data. Structure:', JSON.stringify(Object.keys(parsedData), null, 2));
      console.log('Parsed data:', JSON.stringify(parsedData, null, 2));
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      console.error('Failed to parse content. Content starts with:', content.substring(0, 200));
      console.error('Content ends with:', content.substring(content.length - 200));
      console.error('Full content (for debugging):', content);
      throw new Error(`Failed to parse visualization data: ${parseError.message}`);
    }

    console.log('Validating parsed data structure');
    if (!parsedData || typeof parsedData !== 'object') {
      console.error('Invalid root structure. Actual type:', typeof parsedData);
      throw new Error('Invalid JSON structure: root should be an object');
    }

    if (!Array.isArray(parsedData.charts)) {
      console.error('Invalid charts property. Actual type:', typeof parsedData.charts);
      throw new Error('Invalid JSON structure: missing or invalid "charts" array');
    }

    if (parsedData.charts.length === 0) {
      console.error('Charts array is empty');
      throw new Error('No charts generated: charts array is empty');
    }

    console.log('Validating individual chart structures');
    parsedData.charts.forEach((chart, index) => {
      console.log(`Validating chart at index ${index}. Chart type:`, chart.type);
      if (!chart.type || !chart.data || !chart.options) {
        console.error(`Chart at index ${index} is missing properties:`, JSON.stringify(chart, null, 2));
        throw new Error(`Invalid chart structure at index ${index}: missing required properties`);
      }
      if (!['bar', 'line', 'pie', 'doughnut'].includes(chart.type)) {
        console.error(`Invalid chart type at index ${index}:`, chart.type);
        throw new Error(`Invalid chart type at index ${index}: ${chart.type}`);
      }
      if (!Array.isArray(chart.data.datasets) || chart.data.datasets.length === 0) {
        console.error(`Invalid datasets at index ${index}:`, JSON.stringify(chart.data.datasets, null, 2));
        throw new Error(`Invalid or empty datasets at index ${index}`);
      }
      // Ensure all numeric values are actually numbers
      chart.data.datasets.forEach((dataset, datasetIndex) => {
        dataset.data = dataset.data.map((value, valueIndex) => {
          const num = Number(value);
          if (isNaN(num)) {
            console.error(`Invalid numeric value in dataset ${datasetIndex} of chart ${index}:`, value);
            console.error(`Full dataset ${datasetIndex}:`, JSON.stringify(dataset.data, null, 2));
            throw new Error(`Invalid numeric value in dataset ${datasetIndex} of chart ${index} at position ${valueIndex}: ${value}`);
          }
          return num;
        });
      });
      console.log(`Chart at index ${index} is valid. Chart type: ${chart.type}, Dataset count:`, chart.data.datasets.length);
    });

    console.log('All validations passed, returning parsed data');
    console.log('Number of charts generated:', parsedData.charts.length);
    console.log('Chart types:', parsedData.charts.map(chart => chart.type).join(', '));
    return parsedData;
  } catch (error) {
    console.error('Error in generateVisualizationData:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    if (error.response) {
      console.error('OpenAI API error response:', JSON.stringify(error.response.data, null, 2));
    }
    throw new Error(`Failed to generate visualization data: ${error.message}`);
  } finally {
    console.log('Exiting generateVisualizationData function');
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
