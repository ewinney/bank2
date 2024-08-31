import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import BarChart from '@/components/BarChart';
import { getOpenAIApiKey } from '@/lib/settings';

export default function SummaryPage() {
  const router = useRouter();
  const { id } = router.query;
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (id) {
      fetchSummary(id);
    }
  }, [id]);

  const fetchSummary = async (statementId) => {
    setIsLoading(true);
    setError(null);
    try {
      const apiKey = getOpenAIApiKey();
      if (!apiKey) {
        throw new Error('OpenAI API key not found. Please set it in the settings.');
      }

      const response = await fetch(`/api/generate-summary/${statementId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
        },
        body: JSON.stringify({ extractedData: localStorage.getItem(`extractedData_${statementId}`) }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate summary');
      }

      const data = await response.json();
      setSummary(data);
    } catch (error) {
      console.error('Error fetching summary:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Head>
        <title>Statement Summary | Business Bank Statement Analyzer</title>
      </Head>

      <Header />

      <main className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {summary && (
          <>
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Financial Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{summary.overview}</p>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Key Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <ul>
                  <li>Total Income: ${summary.totalIncome}</li>
                  <li>Total Expenses: ${summary.totalExpenses}</li>
                  <li>Net Profit: ${summary.netProfit}</li>
                  <li>Largest Transaction: ${summary.largestTransaction}</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Income vs Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <BarChart data={summary.chartData} />
              </CardContent>
            </Card>
          </>
        )}

        <Button onClick={() => router.push(`/statement/${id}`)}>Back to Statement</Button>
      </main>

      <Footer />
    </div>
  );
}