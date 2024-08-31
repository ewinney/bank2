import { useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useToast } from "@/components/ui/use-toast";
import FileUpload from '@/components/FileUpload';

export default function Home() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [startDate, setStartDate] = useState(new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const router = useRouter();
  const { toast } = useToast();

  const handleFileUploadAndAnalysis = async (files) => {
    setIsProcessing(true);
    setProgress(0);
    const formData = new FormData();
    
    Object.keys(files).forEach((month) => {
      if (files[month]) {
        formData.append(month, files[month]);
      }
    });
    
    formData.append('apiKey', localStorage.getItem('openaiApiKey'));
    formData.append('startDate', startDate);
    formData.append('endDate', endDate);

    try {
      const response = await fetch('/api/process-statement', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to process the statements');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let partialData = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        partialData += chunk;

        const lines = partialData.split('\n\n');
        partialData = lines.pop();

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            if (data.month) {
              // Update progress
              setProgress((prev) => prev + (100 / Object.keys(files).length));
              // You can update UI with partial results here
            } else if (data.final) {
              // Process final result
              localStorage.setItem('statementAnalysis', JSON.stringify(data.final));
              router.push('/statement-review');
            }
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  return (
    <Layout 
      title="Home" 
      description="Upload and analyze your business bank statements"
    >
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader className="bg-primary text-primary-foreground">
            <CardTitle className="text-2xl font-bold text-center">Upload and Analyze Your Statements</CardTitle>
          </CardHeader>
          <CardContent className="mt-6">
            <div className="flex justify-between mb-4">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  max={endDate}
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                />
              </div>
            </div>
            <FileUpload 
              onUploadAndAnalyze={handleFileUploadAndAnalysis} 
              isProcessing={isProcessing}
              startDate={startDate}
              endDate={endDate}
            />
            {isProcessing && (
              <div className="mt-4">
                <progress value={progress} max="100" className="w-full" />
                <p className="text-center mt-2">{Math.round(progress)}% Complete</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}