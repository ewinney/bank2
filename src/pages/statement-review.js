import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

export default function StatementReview() {
  const [statementData, setStatementData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const data = localStorage.getItem('statementAnalysis');
    if (data) {
      setStatementData(JSON.parse(data));
      setIsLoading(false);
    } else {
      router.push('/');
    }
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <span className="ml-2 text-lg font-medium">Processing your statement...</span>
      </div>
    );
  }

  if (!statementData) {
    return <div>No analysis data available.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Head>
        <title>Statement Review | Business Bank Statement Analyzer</title>
        <meta name="description" content="Review your analyzed bank statement" />
      </Head>

      <Header />

      <main className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Bank Statement Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <h3 className="text-xl font-semibold mb-4">Extracted Data</h3>
            <Textarea
              value={statementData.extractedData}
              readOnly
              rows={10}
              className="mb-8 font-mono text-sm"
            />
            <h3 className="text-xl font-semibold mb-4">Analysis</h3>
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md overflow-x-auto whitespace-pre-wrap font-mono text-sm">
              {statementData.analysis}
            </div>
          </CardContent>
        </Card>
        <div className="flex justify-between">
          <Link href="/">
            <Button variant="outline">Back to Home</Button>
          </Link>
          <Button onClick={() => window.print()}>Print Report</Button>
        </div>
      </main>

      <Footer />
    </div>
  );
}