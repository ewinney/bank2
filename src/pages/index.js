import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useToast } from "@/components/ui/use-toast";
import FileUpload from '@/components/FileUpload';
import { motion } from 'framer-motion';

export default function Home() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [startDate, setStartDate] = useState(new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const router = useRouter();
  const { toast } = useToast();

  console.log('Home component rendered. isProcessing:', isProcessing);
  console.log('Date range:', startDate, 'to', endDate);

  const handleFileUploadAndAnalysis = async (files) => {
    console.log('handleFileUploadAndAnalysis called with files:', files);
    if (!files || Object.keys(files).length === 0) {
      console.error('No files provided for upload and analysis');
      toast({
        title: "Error",
        description: "No files selected for upload and analysis.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    const formData = new FormData();

    Object.keys(files).forEach((month) => {
      if (files[month]) {
        formData.append(month, files[month]);
        console.log(`Appended file for ${month}:`, files[month].name);
      }
    });

    const apiKey = localStorage.getItem('openaiApiKey');
    if (!apiKey) {
      console.error('OpenAI API key not found in localStorage');
      toast({
        title: "Error",
        description: "OpenAI API key is missing. Please check your settings.",
        variant: "destructive",
      });
      setIsProcessing(false);
      return;
    }

    formData.append('apiKey', apiKey);
    formData.append('startDate', startDate);
    formData.append('endDate', endDate);
    console.log('FormData prepared with start date:', startDate, 'and end date:', endDate);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api/process-statement';
      console.log(`Sending POST request to ${apiUrl}`);
      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
      });

      console.log('Received response with status:', response.status);
      if (!response.ok) {
        throw new Error(`Failed to process the statements: ${response.status} ${response.statusText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let partialData = '';

      console.log('Starting to read response stream');
      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          console.log('Finished reading response stream');
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        partialData += chunk;

        const lines = partialData.split('\n\n');
        partialData = lines.pop();

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              console.log('Received data:', data);
              if (data.month) {
                const newProgress = Math.min(100, (prev) => prev + (100 / Object.keys(files).length));
                console.log(`Updating progress for ${data.month}:`, newProgress);
                setProgress(newProgress);
              } else if (data.final) {
                console.log('Received final data, storing in localStorage');
                localStorage.setItem('statementAnalysis', JSON.stringify(data.final));
                console.log('Redirecting to statement-review page');
                router.push('/statement-review');
              }
            } catch (parseError) {
              console.error('Error parsing streaming data:', parseError);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error in handleFileUploadAndAnalysis:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      console.log('Finishing handleFileUploadAndAnalysis');
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const onUploadComplete = () => {
    console.log('Upload completed');
    setIsProcessing(false);
  };

  return (
    <Layout
      title="Home"
      description="Upload and analyze your business bank statements"
    >
      <div className="min-h-screen full-screen-gradient bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-5xl mx-auto px-4 py-12"
        >
          <Card className="shadow-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
              <CardTitle className="text-4xl font-bold text-center">Analyze Your Business Finances</CardTitle>
            </CardHeader>
            <CardContent className="mt-8 space-y-8">
              <motion.div
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div>
                  <Label htmlFor="startDate" className="text-lg font-semibold">Start Date</Label>
                  <Input
                    id="startDate"
                    type="month"
                    value={startDate.slice(0, 7)}
                    onChange={(e) => setStartDate(e.target.value)}
                    max={endDate.slice(0, 7)}
                    className="mt-2 w-full"
                  />
                </div>
                <div>
                  <Label htmlFor="endDate" className="text-lg font-semibold">End Date</Label>
                  <Input
                    id="endDate"
                    type="month"
                    value={endDate.slice(0, 7)}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate.slice(0, 7)}
                    className="mt-2 w-full"
                  />
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                {console.log('Rendering FileUpload component with props:', { isProcessing, startDate, endDate })}
                <FileUpload
                  onUploadAndAnalyze={handleFileUploadAndAnalysis}
                  isProcessing={isProcessing}
                  startDate={startDate}
                  endDate={endDate}
                  onUploadComplete={() => setIsProcessing(false)}
                />
              </motion.div>
              {isProcessing && (
                <motion.div
                  className="mt-6"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="w-full bg-gray-200 rounded-full h-3 dark:bg-gray-700">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <p className="text-center mt-3 text-sm font-medium">{Math.round(progress)}% Complete</p>
                </motion.div>
              )}
            </CardContent>
          </Card>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-lg shadow-lg">
              <svg className="w-12 h-12 text-blue-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              <h3 className="text-xl font-semibold mb-2">Advanced Analytics</h3>
              <p className="text-gray-600 dark:text-gray-300">Get deep insights into your business finances with our advanced analytics tools.</p>
            </div>
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-lg shadow-lg">
              <svg className="w-12 h-12 text-purple-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
              <h3 className="text-xl font-semibold mb-2">Automated Reports</h3>
              <p className="text-gray-600 dark:text-gray-300">Save time with our automated reporting features, delivering key insights at a glance.</p>
            </div>
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-lg shadow-lg">
              <svg className="w-12 h-12 text-pink-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              <h3 className="text-xl font-semibold mb-2">Secure & Confidential</h3>
              <p className="text-gray-600 dark:text-gray-300">Your financial data is protected with state-of-the-art encryption and security measures.</p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </Layout>
  );
}
