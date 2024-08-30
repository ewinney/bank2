import { useState, useCallback, useMemo } from 'react';
import Head from 'next/head';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import FileUpload from '@/components/FileUpload';
import AnalysisResult from '@/components/AnalysisResult';
import LoadingSpinner from '@/components/LoadingSpinner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HowItWorks from '@/components/HowItWorks';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

const BarChart = dynamic(() => import('@/components/BarChart'), { ssr: false });

export default function Home() {
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  const handleAnalysis = useCallback(async (formData) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds timeout

    try {
      const response = await fetch('/api/analyze-statement', {
        method: 'POST',
        body: formData,
        signal: controller.signal
      });
      const result = await response.json();
      console.log('API Response:', result); // Add this line for debugging

      if (!response.ok) {
        throw new Error(result.error || `HTTP error! status: ${response.status}`);
      }
      if (!result || typeof result !== 'object') {
        throw new Error(`Invalid response format: ${JSON.stringify(result)}`);
      }
      if (!result.summary) {
        throw new Error(`Missing summary in response: ${JSON.stringify(result)}`);
      }

      setAnalysisResult(result);
      localStorage.setItem('analysisResult', JSON.stringify(result));
      router.push('/statement-review');
    } catch (err) {
      if (err.name === 'AbortError') {
        setError('Request timed out');
      } else {
        setError(err.message);
      }
    } finally {
      clearTimeout(timeoutId);
      setIsLoading(false);
    }
  }, [router]);

  const handleClearResults = useCallback(() => {
    setAnalysisResult(null);
    setError(null);
    localStorage.removeItem('analysisResult');
  }, []);

  const showBarChart = useMemo(() => 
    analysisResult?.details && analysisResult.details.length >= 3, 
    [analysisResult]
  );

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Head>
        <title>Business Bank Statement Analyzer</title>
        <meta name="description" content="Analyze your business bank statements with AI" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />

      <main className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-end mb-4">
          <Link href="/settings">
            <Button variant="outline">Settings</Button>
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center">Upload Your Statement</CardTitle>
              <CardDescription className="text-center mt-2">
                Get an AI-powered analysis of your business bank statement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <FileUpload onFileUpload={handleAnalysis} isLoading={isLoading} />
              </div>
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <Alert variant="destructive" className="mt-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>

          <AnimatePresence>
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <LoadingSpinner />
              </motion.div>
            )}
          </AnimatePresence>

          <HowItWorks />
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}