import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { getOpenAIApiKey } from '@/lib/settings';

export default function StatementPage() {
  const router = useRouter();
  const { id } = router.query;
  const [statementData, setStatementData] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (id) {
      fetchStatementData(id);
    }
  }, [id]);

  const fetchStatementData = async (statementId) => {
    try {
      const response = await fetch(`/api/get-statement/${statementId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch statement data');
      }
      const data = await response.json();
      setStatementData(data.fileContent);
    } catch (err) {
      setError(err.message);
    }
  };

  const extractTransactions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const apiKey = getOpenAIApiKey();
      if (!apiKey) {
        throw new Error('OpenAI API key not found. Please set it in the settings.');
      }

      const response = await fetch('/api/extract-transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
        },
        body: JSON.stringify({ id, statementData }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to extract transactions');
      }

      const result = await response.json();
      setStatementData(result.extractedData);
    } catch (err) {
      console.error('Error in extractTransactions:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const generateSummary = () => {
    router.push(`/summary/${id}`);
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Head>
        <title>Statement Data | Business Bank Statement Analyzer</title>
      </Head>

      <Header />

      <main className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle>Statement Data</CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              className="w-full h-64 p-2 border rounded"
              value={statementData}
              onChange={(e) => setStatementData(e.target.value)}
              placeholder="Statement data will appear here after extraction"
            />
            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button onClick={extractTransactions} className="mt-4" disabled={isLoading || !statementData}>
              {isLoading ? 'Extracting...' : 'Extract Transactions'}
            </Button>
            <Button onClick={generateSummary} className="mt-4 ml-4" disabled={!statementData}>
              Generate Summary
            </Button>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}