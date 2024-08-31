import { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FileUpload from '@/components/FileUpload';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useToast } from "@/components/ui/use-toast";

export default function Home() {
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleFileUploadAndAnalysis = async (file) => {
    setIsProcessing(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('apiKey', localStorage.getItem('openaiApiKey'));

    try {
      const response = await fetch('/api/process-statement', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to process the statement');
      }

      const result = await response.json();
      localStorage.setItem('statementAnalysis', JSON.stringify(result));
      router.push('/statement-review');
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Head>
        <title>Business Bank Statement Analyzer</title>
        <meta name="description" content="Upload and analyze your business bank statement" />
      </Head>

      <Header />

      <main className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Upload and Analyze Your Statement</CardTitle>
          </CardHeader>
          <CardContent>
            <FileUpload onUploadAndAnalyze={handleFileUploadAndAnalysis} isProcessing={isProcessing} />
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}