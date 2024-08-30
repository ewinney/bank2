import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AnalysisResult from '@/components/AnalysisResult';
import BarChart from '@/components/BarChart';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function StatementReview() {
  const [analysisData, setAnalysisData] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const data = localStorage.getItem('analysisResult');
    if (data) {
      setAnalysisData(JSON.parse(data));
    } else {
      router.push('/');
    }
  }, [router]);

  if (!analysisData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Head>
        <title>Bank Statement Review | Business Bank Statement Analyzer</title>
        <meta name="description" content="Review your analyzed bank statement" />
      </Head>

      <Header />

      <main className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Bank Statement Analysis Review</CardTitle>
            </CardHeader>
            <CardContent>
              <AnalysisResult result={analysisData} />
              {analysisData.details && analysisData.details.length >= 3 && (
                <div className="mt-8">
                  <h3 className="text-xl font-semibold mb-4">Financial Overview</h3>
                  <BarChart data={analysisData} />
                </div>
              )}
              <div className="mt-8">
                <h3 className="text-xl font-semibold mb-4">Detailed Analysis</h3>
                <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md overflow-x-auto">
                  {JSON.stringify(analysisData, null, 2)}
                </pre>
              </div>
            </CardContent>
          </Card>
          <div className="flex justify-between">
            <Link href="/">
              <Button variant="outline">Back to Home</Button>
            </Link>
            <Button onClick={() => window.print()}>Print Report</Button>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}